"""
OCR service.

Runs Tesseract OCR on PDF pages that document_parser.py flagged as
needs_ocr=True (i.e. pages with little/no extractable text, meaning
they're likely scanned images rather than real text).

Fully offline — Tesseract is a local binary, no cloud OCR API involved.

Flow:
    document_parser.parse_pdf() -> ExtractedPage(needs_ocr=True, page_number=N)
                                 -> ocr.ocr_pdf_page(file_path, N)
                                 -> replaces that page's empty text

On Windows, Tesseract is not auto-detected on PATH, so we point
pytesseract at the known install location explicitly.
"""

from __future__ import annotations

import io
import platform
from pathlib import Path

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

# Windows doesn't put Tesseract on PATH by default. Point pytesseract
# at the standard install location. On Linux/Mac (CI, teammates' machines,
# deployment), Tesseract is usually already on PATH, so we only override
# this on Windows.
if platform.system() == "Windows":
    _DEFAULT_WINDOWS_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if Path(_DEFAULT_WINDOWS_PATH).exists():
        pytesseract.pytesseract.tesseract_cmd = _DEFAULT_WINDOWS_PATH

# Higher zoom = higher resolution render = better OCR accuracy, at the
# cost of speed. 2x is a reasonable default for typical scanned SOPs.
RENDER_ZOOM = 2.0


class OCRError(RuntimeError):
    """Raised when Tesseract is unreachable or OCR fails unexpectedly."""


def _render_page_to_image(file_path: str | Path, page_number: int) -> Image.Image:
    """
    Render a single PDF page (1-indexed) to a PIL Image.

    page_number is 1-indexed to match ExtractedPage.page_number from
    document_parser.py; PyMuPDF's internal indexing is 0-indexed.
    """
    doc = fitz.open(str(file_path))
    try:
        if page_number < 1 or page_number > len(doc):
            raise OCRError(
                f"Page {page_number} out of range for '{file_path}' "
                f"({len(doc)} pages total)"
            )
        page = doc[page_number - 1]
        matrix = fitz.Matrix(RENDER_ZOOM, RENDER_ZOOM)
        pix = page.get_pixmap(matrix=matrix)
        img_bytes = pix.tobytes("png")
        return Image.open(io.BytesIO(img_bytes))
    finally:
        doc.close()


def ocr_pdf_page(file_path: str | Path, page_number: int) -> str:
    """
    Run OCR on a single PDF page and return the extracted text.

    Raises OCRError if Tesseract isn't reachable or the page is invalid.
    """
    try:
        image = _render_page_to_image(file_path, page_number)
    except OCRError:
        raise
    except Exception as e:
        raise OCRError(f"Failed to render page {page_number} of '{file_path}': {e}") from e

    try:
        text = pytesseract.image_to_string(image)
    except pytesseract.TesseractNotFoundError as e:
        raise OCRError(
            "Tesseract binary not found. On Windows, confirm it's installed at "
            r"C:\Program Files\Tesseract-OCR\tesseract.exe, or set "
            "pytesseract.pytesseract.tesseract_cmd manually."
        ) from e
    except Exception as e:
        raise OCRError(f"Tesseract OCR failed on page {page_number}: {e}") from e

    return text.strip()


def ocr_image_file(image_path: str | Path) -> str:
    """
    Run OCR directly on a standalone image file (png/jpg/etc), not a PDF page.
    Useful if the ingestion pipeline ever needs to handle raw image uploads.
    """
    try:
        image = Image.open(str(image_path))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except pytesseract.TesseractNotFoundError as e:
        raise OCRError("Tesseract binary not found.") from e
    except Exception as e:
        raise OCRError(f"OCR failed on image '{image_path}': {e}") from e