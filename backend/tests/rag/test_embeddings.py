"""
Tests for the embedding service.

These are integration tests — they require a running local Ollama
instance with `nomic-embed-text` pulled:

    ollama serve
    ollama pull nomic-embed-text

Run with:
    pytest tests/rag/test_embeddings.py -v
"""

import pytest

from app.services.rag.embeddings import embed_text, embed_batch, EmbeddingError, EMBEDDING_DIM


@pytest.mark.asyncio
async def test_embed_text_returns_correct_dimension():
    vector = await embed_text("Pump P-101 must be inspected every 30 days.")
    assert isinstance(vector, list)
    assert len(vector) == EMBEDDING_DIM
    assert all(isinstance(v, float) for v in vector)


@pytest.mark.asyncio
async def test_embed_batch_returns_one_vector_per_input():
    texts = [
        "The reactor pressure valve should be checked weekly.",
        "Fire extinguishers must be inspected monthly.",
        "Emergency shutdown procedure for unit 4.",
    ]
    vectors = await embed_batch(texts)
    assert len(vectors) == len(texts)
    for v in vectors:
        assert len(v) == EMBEDDING_DIM


@pytest.mark.asyncio
async def test_similar_texts_have_higher_cosine_similarity():
    """
    Sanity check that embeddings actually capture meaning:
    two sentences about the same topic should be closer together
    than two sentences about unrelated topics.
    """
    import numpy as np

    def cosine_sim(a, b):
        a, b = np.array(a), np.array(b)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    pump_a = await embed_text("The pump requires monthly maintenance.")
    pump_b = await embed_text("Pumps must be serviced every month.")
    unrelated = await embed_text("The company picnic is scheduled for July.")

    sim_related = cosine_sim(pump_a, pump_b)
    sim_unrelated = cosine_sim(pump_a, unrelated)

    assert sim_related > sim_unrelated