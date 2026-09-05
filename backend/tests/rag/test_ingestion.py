"""
Tests for the ingestion pipeline.

These are true end-to-end tests: real file parsing, real Ollama
embedding calls, real ChromaDB storage. Requires:

    ollama serve            (running)
    ollama pull nomic-embed-text   (done)

Run with:
    pytest tests/rag/test_ingestion.py -v
"""

import pytest

from app.services import chroma
from app.services.rag.ingestion import ingest_document, delete_document, compute_doc_id, IngestionError


def test_compute_doc_id_is_stable(tmp_path):
    file_path = tmp_path / "sample.txt"
    file_path.write_text("Pump P-101 must be inspected every 30 days.", encoding="utf-8")

    id_1 = compute_doc_id(file_path)
    id_2 = compute_doc_id(file_path)

    assert id_1 == id_2
    assert len(id_1) == 64  # sha256 hex digest length


def test_compute_doc_id_differs_for_different_content(tmp_path):
    file_a = tmp_path / "a.txt"
    file_b = tmp_path / "b.txt"
    file_a.write_text("Content A", encoding="utf-8")
    file_b.write_text("Content B", encoding="utf-8")

    assert compute_doc_id(file_a) != compute_doc_id(file_b)


@pytest.mark.asyncio
async def test_ingest_txt_document_end_to_end(tmp_path):
    file_path = tmp_path / "maintenance_note.txt"
    file_path.write_text(
        "Pump P-101 must be inspected every 30 days. "
        "Check the seals and bearings for wear. "
        "Replace the gasket if any leakage is observed.",
        encoding="utf-8",
    )

    result = await ingest_document(file_path, source_filename="maintenance_note.txt")

    try:
        assert result.source_filename == "maintenance_note.txt"
        assert result.chunk_count >= 1
        assert result.page_count == 1
        assert result.pages_ocred == 0

        # Confirm it's actually queryable back out of Chroma.
        from app.services.rag.embeddings import embed_text

        query_vector = await embed_text("How often should the pump be inspected?")
        search_result = chroma.query(embedding=query_vector, top_k=1)

        assert len(search_result["documents"][0]) == 1
        assert "Pump P-101" in search_result["documents"][0][0]
        assert search_result["metadatas"][0][0]["source"] == "maintenance_note.txt"
        assert search_result["metadatas"][0][0]["doc_id"] == result.doc_id
    finally:
        # Always clean up, even if an assertion fails.
        delete_document(result.doc_id)


@pytest.mark.asyncio
async def test_ingest_same_file_twice_is_idempotent(tmp_path):
    file_path = tmp_path / "note.txt"
    file_path.write_text("Fire extinguishers must be inspected monthly.", encoding="utf-8")

    result_1 = await ingest_document(file_path, source_filename="note.txt")
    count_after_first = chroma.count()

    result_2 = await ingest_document(file_path, source_filename="note.txt")
    count_after_second = chroma.count()

    try:
        assert result_1.doc_id == result_2.doc_id
        # Upsert means re-ingesting shouldn't increase the total count.
        assert count_after_second == count_after_first
    finally:
        delete_document(result_1.doc_id)


@pytest.mark.asyncio
async def test_ingest_nonexistent_file_raises():
    with pytest.raises(IngestionError):
        await ingest_document("this_file_does_not_exist.txt")