"""
Document parser.

Extracts plain text from uploaded documents (PDF, DOCX, TXT), returning
a per-page (or per-section) breakdown so downstream chunking/metadata
can attach accurate page numbers to each chunk.

This module does NOT do OCR — if a PDF page yields little/no extractable
text (a scanned page), it's flagged so ocr.py can pick it up. See
needs_ocr on each ExtractedPage.

This module does NOT chunk or embed — that's chunker.py / embeddings.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF
from docx import Document as DocxDocument

# A page with fewer than this many characters of extracted text is
# treated as likely-scanned and flagged for OCR.
MIN_TEXT_CHARS_PER_PAGE = 20

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


class UnsupportedFileTypeError(ValueError):
    """Raised when a file extension isn't one we know how to parse."""


@dataclass
class ExtractedPage:
    page_number: int  # 1-indexed, matches how humans reference "page 12"
    text: str
    needs_ocr: bool = False


def detect_file_type(file_path: str | Path) -> str:
    """Return the lowercase file extension, e.g. '.pdf'."""
    ext = Path(file_path).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise UnsupportedFileTypeError(
            f"Unsupported file type '{ext}'. Supported: {sorted(SUPPORTED_EXTENSIONS)}"
        )
    return ext


def parse_pdf(file_path: str | Path) -> list[ExtractedPage]:
    """Extract text from a PDF, one ExtractedPage per PDF page."""
    pages: list[ExtractedPage] = []
    doc = fitz.open(str(file_path))
    try:
        for i, page in enumerate(doc, start=1):
            text = page.get_text().strip()
            pages.append(
                ExtractedPage(
                    page_number=i,
                    text=text,
                    needs_ocr=len(text) < MIN_TEXT_CHARS_PER_PAGE,
                )
            )
    finally:
        doc.close()
    return pages


def parse_docx(file_path: str | Path) -> list[ExtractedPage]:
    """
    Extract text from a DOCX file.

    DOCX has no reliable native concept of "page" (pagination is a
    rendering-time computation, not stored in the file), so we return
    the whole document as a single ExtractedPage with page_number=1.
    If page-level citation accuracy becomes important later, this is
    the place to revisit (e.g. via a rendering pass).
    """
    doc = DocxDocument(str(file_path))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full_text = "\n".join(paragraphs)
    return [ExtractedPage(page_number=1, text=full_text, needs_ocr=False)]


def parse_txt(file_path: str | Path) -> list[ExtractedPage]:
    """Extract text from a plain text file."""
    text = Path(file_path).read_text(encoding="utf-8", errors="replace")
    return [ExtractedPage(page_number=1, text=text, needs_ocr=False)]


def parse_document(file_path: str | Path) -> list[ExtractedPage]:
    """
    Extract text from a document, dispatching by file type.

    Returns a list of ExtractedPage. Pages flagged needs_ocr=True
    contain little/no extractable text and should be passed through
    ocr.py before chunking.
    """
    ext = detect_file_type(file_path)

    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext == ".docx":
        return parse_docx(file_path)
    elif ext == ".txt":
        return parse_txt(file_path)

    # detect_file_type already guards this, but keep mypy/readers happy.
    raise UnsupportedFileTypeError(f"No parser implemented for '{ext}'")