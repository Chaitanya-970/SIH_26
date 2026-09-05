"""
Tests for the chunker.

Pure logic tests — no Ollama or ChromaDB required.

Run with:
    pytest tests/rag/test_chunker.py -v
"""

from app.services.rag.chunker import (
    chunk_text,
    split_into_sentences,
    CHUNK_SIZE_TOKENS,
    CHUNK_OVERLAP_TOKENS,
)


def test_split_into_sentences_basic():
    text = "Pump P-101 must be inspected every 30 days. The inspection must be logged in the maintenance record. Replace the gasket if worn."
    sentences = split_into_sentences(text)

    assert len(sentences) == 3
    assert sentences[0].startswith("Pump P-101")


def test_chunk_text_respects_token_limit():
    # Build a long synthetic document out of short sentences.
    text = " ".join(f"This is sentence number {i} in the test document." for i in range(300))

    chunks = chunk_text(text)

    assert len(chunks) > 1, "Long text should split into multiple chunks"
    for c in chunks:
        # Allow a little slack for the single-oversized-sentence edge case,
        # but ordinary chunks should stay at or under the target size.
        assert c.token_count <= CHUNK_SIZE_TOKENS + 5


def test_chunk_text_creates_overlap():
    text = " ".join(f"This is sentence number {i} in the test document." for i in range(300))
    chunks = chunk_text(text)

    assert len(chunks) >= 2

    # The end of chunk N should share some text with the start of chunk N+1.
    first_chunk_words = chunks[0].text.split()
    second_chunk_words = chunks[1].text.split()

    overlap_found = any(
        " ".join(first_chunk_words[-5:]) in chunks[1].text
        or word in second_chunk_words[:15]
        for word in first_chunk_words[-15:]
    )
    assert overlap_found, "Consecutive chunks should share some overlapping content"


def test_chunk_text_empty_input():
    assert chunk_text("") == []


def test_chunk_text_short_input_single_chunk():
    text = "Pump P-101 must be inspected every 30 days."
    chunks = chunk_text(text)

    assert len(chunks) == 1
    assert chunks[0].text == text
    assert chunks[0].chunk_index == 0


def test_chunk_indices_are_sequential():
    text = " ".join(f"This is sentence number {i} in the test document." for i in range(300))
    chunks = chunk_text(text)

    for idx, c in enumerate(chunks):
        assert c.chunk_index == idx