"""
Tests for the ChromaDB service.

Sanity check only: insert a couple of fake chunks (with pre-made
fake embeddings, no Ollama needed) and confirm we can query them
back out correctly. This isolates Chroma issues from embedding
issues before we wire the two together.

Run with:
    pytest tests/rag/test_chroma.py -v
"""

import uuid

import pytest

from app.services import chroma


def _fake_vector(active_dim: int) -> list[float]:
    """
    768-dim fake vector with a single dimension set to 1.0 and the rest 0.
    Using different active dimensions makes vectors genuinely different
    directions in cosine space (not just scaled copies of each other).
    """
    v = [0.0] * 768
    v[active_dim] = 1.0
    return v


def test_add_and_query_chunks():
    doc_id = f"test-doc-{uuid.uuid4()}"

    ids = [f"{doc_id}_0", f"{doc_id}_1"]
    embeddings = [_fake_vector(0), _fake_vector(1)]
    documents = [
        "Pump P-101 must be inspected every 30 days.",
        "The company picnic is scheduled for July.",
    ]
    metadatas = [
        {"doc_id": doc_id, "source": "pump_maintenance_sop.pdf", "page": 12},
        {"doc_id": doc_id, "source": "hr_calendar.pdf", "page": 1},
    ]

    chroma.add_chunks(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    # Query with a vector close to the first chunk's fake embedding.
    result = chroma.query(embedding=_fake_vector(0), top_k=1)

    assert result["ids"][0][0] == ids[0]
    assert result["documents"][0][0] == documents[0]
    assert result["metadatas"][0][0]["source"] == "pump_maintenance_sop.pdf"

    # Cleanup so repeated test runs don't accumulate junk.
    chroma.delete_by_doc_id(doc_id)


def test_delete_by_doc_id_removes_chunks():
    doc_id = f"test-doc-{uuid.uuid4()}"

    chroma.add_chunks(
        ids=[f"{doc_id}_0"],
        embeddings=[_fake_vector(2)],
        documents=["Temporary test chunk."],
        metadatas=[{"doc_id": doc_id, "source": "temp.pdf", "page": 1}],
    )

    before = chroma.count()
    chroma.delete_by_doc_id(doc_id)
    after = chroma.count()

    assert after == before - 1