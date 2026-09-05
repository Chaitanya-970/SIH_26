"""
Tests for the OCR service.

Requires the Tesseract binary to be installed locally (see ocr.py for
the expected Windows path). These are integration tests against the
real Tesseract binary — no Ollama or ChromaDB needed.

We simulate a "scanned" PDF page by rendering text onto an IMAGE and
embedding that image into a PDF page (rather than adding real PDF text),
so PyMuPDF's normal text extraction would find nothing — exactly like
a real scanned document — and OCR is required to read it.

Run with:
    pytest tests/rag/test_ocr.py -v
"""

import fitz
import pytest
from PIL import Image, ImageDraw

from app.services.ocr import ocr_pdf_page, ocr_image_file, OCRError


def _make_scanned_pdf(path, text: str):
    """
    Create a PDF whose page contains a picture of text (not real PDF
    text), simulating a scanned document.
    """
    img = Image.new("RGB", (800, 200), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((20, 80), text, fill="black")

    img_path = path.parent / "temp_scan_source.png"
    img.save(img_path)

    doc = fitz.open()
    page = doc.new_page(width=800, height=200)
    page.insert_image(fitz.Rect(0, 0, 800, 200), filename=str(img_path))
    doc.save(str(path))
    doc.close()


def _make_text_image(path, text: str):
    img = Image.new("RGB", (800, 200), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((20, 80), text, fill="black")
    img.save(path)


def test_ocr_pdf_page_extracts_text_from_scanned_page(tmp_path):
    pdf_path = tmp_path / "scanned.pdf"
    _make_scanned_pdf(pdf_path, "Pump P-101 inspection required")

    result = ocr_pdf_page(pdf_path, page_number=1)

    # OCR isn't always character-perfect, so check for the key words
    # rather than an exact string match.
    assert "Pump" in result
    assert "101" in result or "P-101" in result


def test_ocr_pdf_page_invalid_page_number_raises(tmp_path):
    pdf_path = tmp_path / "scanned.pdf"
    _make_scanned_pdf(pdf_path, "Some text")

    with pytest.raises(OCRError):
        ocr_pdf_page(pdf_path, page_number=5)  # doc only has 1 page


def test_ocr_image_file_extracts_text(tmp_path):
    img_path = tmp_path / "sample.png"
    _make_text_image(img_path, "Fire extinguisher check")

    result = ocr_image_file(img_path)

    assert "Fire" in result or "extinguisher" in result.lower()