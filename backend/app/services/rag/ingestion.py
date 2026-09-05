"""
Ingestion pipeline.

The single entry point that turns an uploaded file into searchable
chunks in ChromaDB. Ties together, in order:

    document_parser  -> extract text per page
    ocr               -> fill in text for scanned pages
    chunker           -> split each page's text into overlapping chunks
    embeddings        -> embed every chunk
    chroma            -> store chunks + embeddings + metadata

This is what api/documents.py's upload endpoint should call. The
Agent should never call this directly — ingestion is a RAG-internal
concern; the Agent only ever calls retriever.search_knowledge_base().

doc_id is derived from a SHA-256 hash of the file's raw bytes, so
re-ingesting an identical file is idempotent (chroma.add_chunks uses
upsert, so it overwrites rather than duplicating).
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

from app.services import chroma, ocr
from app.services.document_parser import parse_document, ExtractedPage
from app.services.rag.chunker import chunk_text
from app.services.rag.embeddings import embed_batch


class IngestionError(RuntimeError):
    """Raised when any stage of ingestion fails unrecoverably."""


@dataclass
class IngestionResult:
    doc_id: str
    source_filename: str
    chunk_count: int
    page_count: int
    pages_ocred: int


def compute_doc_id(file_path: str | Path) -> str:
    """
    Compute a stable, content-based document ID.

    Same file content -> same doc_id, regardless of filename. This
    makes re-ingesting an unchanged file idempotent.
    """
    file_bytes = Path(file_path).read_bytes()
    return hashlib.sha256(file_bytes).hexdigest()


def _resolve_page_text(file_path: str | Path, page: ExtractedPage) -> tuple[str, bool]:
    """
    Return (text, was_ocred) for a single page.

    If the page was flagged needs_ocr by the parser, run OCR and use
    that text instead of the (near-empty) originally extracted text.
    OCR only works on PDF pages — DOCX/TXT pages never set needs_ocr,
    so this is a no-op for those file types.
    """
    if not page.needs_ocr:
        return page.text, False

    ocr_text = ocr.ocr_pdf_page(file_path, page.page_number)
    return ocr_text, True


async def ingest_document(file_path: str | Path, source_filename: str | None = None) -> IngestionResult:
    """
    Run the full ingestion pipeline on a single uploaded file.

    file_path:        path to the file on disk (e.g. in data/kb/ or a
                       temp upload location)
    source_filename:  the original filename to store in chunk metadata
                       (may differ from file_path's name if the file was
                       saved under a generated name). Defaults to the
                       file_path's own name if not provided.

    Returns an IngestionResult summarizing what was stored.
    Raises IngestionError if the file can't be parsed or embedded.
    """
    file_path = Path(file_path)
    source_filename = source_filename or file_path.name

    if not file_path.exists():
        raise IngestionError(f"File not found: {file_path}")

    doc_id = compute_doc_id(file_path)

    try:
        pages = parse_document(file_path)
    except Exception as e:
        raise IngestionError(f"Failed to parse '{source_filename}': {e}") from e

    if not pages:
        raise IngestionError(f"No content extracted from '{source_filename}'")

    all_chunk_texts: list[str] = []
    all_chunk_ids: list[str] = []
    all_metadatas: list[dict] = []
    pages_ocred = 0

    for page in pages:
        try:
            text, was_ocred = _resolve_page_text(file_path, page)
        except ocr.OCRError as e:
            raise IngestionError(
                f"OCR failed on page {page.page_number} of '{source_filename}': {e}"
            ) from e

        if was_ocred:
            pages_ocred += 1

        if not text.strip():
            # Page genuinely has nothing usable (even after OCR) — skip
            # it rather than storing empty chunks.
            continue

        page_chunks = chunk_text(text)

        for chunk in page_chunks:
            chunk_id = f"{doc_id}_{page.page_number}_{chunk.chunk_index}"
            all_chunk_ids.append(chunk_id)
            all_chunk_texts.append(chunk.text)
            all_metadatas.append(
                {
                    "doc_id": doc_id,
                    "source": source_filename,
                    "page": page.page_number,
                    "chunk_index": chunk.chunk_index,
                    "token_count": chunk.token_count,
                }
            )

    if not all_chunk_texts:
        raise IngestionError(
            f"'{source_filename}' produced no usable text after parsing/OCR"
        )

    try:
        embeddings = await embed_batch(all_chunk_texts)
    except Exception as e:
        raise IngestionError(f"Embedding failed for '{source_filename}': {e}") from e

    chroma.add_chunks(
        ids=all_chunk_ids,
        embeddings=embeddings,
        documents=all_chunk_texts,
        metadatas=all_metadatas,
    )

    return IngestionResult(
        doc_id=doc_id,
        source_filename=source_filename,
        chunk_count=len(all_chunk_texts),
        page_count=len(pages),
        pages_ocred=pages_ocred,
    )


def delete_document(doc_id: str) -> None:
    """Remove a document's chunks from ChromaDB entirely."""
    chroma.delete_by_doc_id(doc_id)