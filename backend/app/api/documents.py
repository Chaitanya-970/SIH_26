"""
Document API routes.

    POST   /api/upload-document
    DELETE /api/documents/{doc_id}

Thin HTTP wrappers around ingestion.py and registry.py. All real logic
(parsing, OCR, chunking, embedding, storage) lives in the RAG service
modules — this file only handles the HTTP boundary: receiving the
upload, saving it to disk, calling ingestion, shaping the response.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import Settings
from app.models.document import (
    UploadDocumentResponse,
    DeleteDocumentResponse,
)
from app.services.document_parser import SUPPORTED_EXTENSIONS, UnsupportedFileTypeError
from app.services.rag.ingestion import ingest_document, delete_document, IngestionError
from app.services.rag import registry

router = APIRouter()
_settings = Settings()


@router.post("/api/upload-document", response_model=UploadDocumentResponse)
async def upload_document(file: UploadFile = File(...)) -> UploadDocumentResponse:
    """
    Upload a document (PDF, DOCX, or TXT), ingest it into the RAG
    pipeline, and register it in the Knowledge Base.
    """
    original_filename = file.filename or "unnamed_upload"
    ext = Path(original_filename).suffix.lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {sorted(SUPPORTED_EXTENSIONS)}",
        )

    kb_dir = Path(_settings.kb_dir)
    kb_dir.mkdir(parents=True, exist_ok=True)

    # Save under the original filename inside kb_dir. Since ingestion's
    # doc_id is content-based (sha256), re-uploading the same content
    # is safe even if this overwrites a same-named file on disk.
    dest_path = kb_dir / original_filename
    with dest_path.open("wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    try:
        result = await ingest_document(dest_path, source_filename=original_filename)
    except IngestionError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    record = registry.add_document(
        doc_id=result.doc_id,
        filename=result.source_filename,
        file_type=ext,
        chunk_count=result.chunk_count,
        page_count=result.page_count,
    )

    return UploadDocumentResponse(
        doc_id=record.doc_id,
        filename=record.filename,
        file_type=record.file_type,
        chunk_count=record.chunk_count,
        page_count=record.page_count,
        pages_ocred=result.pages_ocred,
        uploaded_at=record.uploaded_at,
    )


@router.delete("/api/documents/{doc_id}", response_model=DeleteDocumentResponse)
async def delete_document_endpoint(doc_id: str) -> DeleteDocumentResponse:
    """
    Delete a document: removes its chunks from ChromaDB and its entry
    from the registry. Idempotent — deleting a doc_id that doesn't
    exist returns deleted=False rather than erroring, since the end
    state (doc_id absent) is the same either way.
    """
    existed = registry.get_document(doc_id) is not None

    delete_document(doc_id)  # safe even if doc_id has no chunks
    registry.remove_document(doc_id)

    return DeleteDocumentResponse(doc_id=doc_id, deleted=existed)