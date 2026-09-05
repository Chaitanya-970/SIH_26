"""
Tests for the document parser.

Generates small sample PDF/DOCX/TXT files on the fly (via tmp_path
fixture) rather than requiring checked-in sample files. No Ollama or
ChromaDB required.

Run with:
    pytest tests/rag/test_document_parser.py -v
"""

import fitz
import pytest
from docx import Document as DocxDocument

from app.services.document_parser import (
    parse_document,
    parse_pdf,
    parse_docx,
    parse_txt,
    detect_file_type,
    UnsupportedFileTypeError,
)


def _make_sample_pdf(path, pages_text: list[str]):
    doc = fitz.open()
    for text in pages_text:
        page = doc.new_page()
        page.insert_text((72, 72), text)
    doc.save(str(path))
    doc.close()


def _make_sample_docx(path, paragraphs: list[str]):
    doc = DocxDocument()
    for p in paragraphs:
        doc.add_paragraph(p)
    doc.save(str(path))


def test_detect_file_type():
    assert detect_file_type("report.pdf") == ".pdf"
    assert detect_file_type("notes.DOCX") == ".docx"  # case-insensitive
    assert detect_file_type("readme.txt") == ".txt"


def test_detect_file_type_rejects_unsupported():
    with pytest.raises(UnsupportedFileTypeError):
        detect_file_type("archive.zip")


def test_parse_pdf_extracts_text_per_page(tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    _make_sample_pdf(
        pdf_path,
        [
            "Pump P-101 must be inspected every 30 days.",
            "Replace the gasket if worn.",
        ],
    )

    pages = parse_pdf(pdf_path)

    assert len(pages) == 2
    assert pages[0].page_number == 1
    assert "Pump P-101" in pages[0].text
    assert pages[1].page_number == 2
    assert "gasket" in pages[1].text
    assert all(not p.needs_ocr for p in pages)


def test_parse_pdf_flags_empty_page_for_ocr(tmp_path):
    pdf_path = tmp_path / "scanned.pdf"
    _make_sample_pdf(pdf_path, [""])  # simulates a page with no extractable text

    pages = parse_pdf(pdf_path)

    assert pages[0].needs_ocr is True


def test_parse_docx_extracts_paragraphs(tmp_path):
    docx_path = tmp_path / "sample.docx"
    _make_sample_docx(
        docx_path,
        ["Fire extinguishers must be inspected monthly.", "Log all inspections."],
    )

    pages = parse_docx(docx_path)

    assert len(pages) == 1
    assert "Fire extinguishers" in pages[0].text
    assert "Log all inspections" in pages[0].text


def test_parse_txt_reads_file(tmp_path):
    txt_path = tmp_path / "sample.txt"
    txt_path.write_text("Emergency shutdown procedure for unit 4.", encoding="utf-8")

    pages = parse_txt(txt_path)

    assert len(pages) == 1
    assert pages[0].text == "Emergency shutdown procedure for unit 4."


def test_parse_document_dispatches_correctly(tmp_path):
    txt_path = tmp_path / "sample.txt"
    txt_path.write_text("Test content.", encoding="utf-8")

    pages = parse_document(txt_path)
    assert pages[0].text == "Test content."


def test_parse_document_rejects_unsupported_type(tmp_path):
    bad_path = tmp_path / "sample.zip"
    bad_path.write_bytes(b"fake zip content")

    with pytest.raises(UnsupportedFileTypeError):
        parse_document(bad_path)