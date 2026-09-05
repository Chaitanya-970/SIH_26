"""
Tests for the retriever (search_knowledge_base).

End-to-end: real Ollama embeddings, real ChromaDB. Ingests a couple
of documents first, then verifies search returns them correctly
shaped and ranked.

Run with:
    pytest tests/rag/test_retriever.py -v
"""

import pytest

from app.services.rag.ingestion import ingest_document, delete_document
from app.services.rag.retriever import search_knowledge_base, search_knowledge_base_as_dicts


@pytest.fixture
async def sample_kb(tmp_path):
    """
    Ingest two unrelated documents so we can verify search returns
    the RELEVANT one, not just any chunk in the DB.
    """
    pump_file = tmp_path / "pump_maintenance_sop.txt"
    pump_file.write_text(
        "Pump P-101 must be inspected every 30 days. "
        "Check seals and bearings during each inspection.",
        encoding="utf-8",
    )

    hr_file = tmp_path / "hr_calendar.txt"
    hr_file.write_text(
        "The company picnic is scheduled for the second week of July. "
        "All employees are invited to attend.",
        encoding="utf-8",
    )

    pump_result = await ingest_document(pump_file, source_filename="pump_maintenance_sop.pdf")
    hr_result = await ingest_document(hr_file, source_filename="hr_calendar.pdf")

    yield pump_result, hr_result

    delete_document(pump_result.doc_id)
    delete_document(hr_result.doc_id)


@pytest.mark.asyncio
async def test_search_returns_relevant_result_first(sample_kb):
    results = await search_knowledge_base("How often should the pump be inspected?", top_k=3)

    assert len(results) >= 1
    top_result = results[0]

    assert top_result.source == "pump_maintenance_sop.pdf"
    assert "Pump P-101" in top_result.text
    assert 0.0 <= top_result.score <= 1.0


@pytest.mark.asyncio
async def test_search_results_are_shaped_per_contract(sample_kb):
    results = await search_knowledge_base("pump inspection schedule")

    assert len(results) >= 1
    result_dict = results[0].to_dict()

    assert set(result_dict.keys()) == {"text", "source", "page", "score"}
    assert isinstance(result_dict["page"], int)
    assert isinstance(result_dict["score"], float)


@pytest.mark.asyncio
async def test_search_respects_top_k(sample_kb):
    results = await search_knowledge_base("inspection", top_k=1)
    assert len(results) <= 1


@pytest.mark.asyncio
async def test_search_empty_query_returns_empty_list(sample_kb):
    results = await search_knowledge_base("")
    assert results == []


@pytest.mark.asyncio
async def test_search_as_dicts_returns_plain_dicts(sample_kb):
    results = await search_knowledge_base_as_dicts("pump inspection")
    assert len(results) >= 1
    assert isinstance(results[0], dict)
    assert "text" in results[0]