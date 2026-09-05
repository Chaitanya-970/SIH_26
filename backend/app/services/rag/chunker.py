"""
Chunker.

Splits extracted document text into overlapping, sentence-boundary-aware
chunks, ready for embedding.

Spec (per project handoff):
    chunk size:     512 tokens
    overlap:        50 tokens
    splitting:      sentence-boundary aware (never cut mid-sentence)

Approach:
    1. Split the full text into sentences (NLTK punkt).
    2. Greedily pack sentences into a chunk until adding the next
       sentence would exceed CHUNK_SIZE_TOKENS.
    3. Start the next chunk by walking back OVERLAP_TOKENS worth of
       sentences from the end of the previous chunk, so consecutive
       chunks share context (helps retrieval when relevant info sits
       right at a chunk boundary).

Token counts use tiktoken so "512 tokens" means roughly what an LLM
would actually count, not just words or characters.
"""

from __future__ import annotations

from dataclasses import dataclass

import nltk
import tiktoken

CHUNK_SIZE_TOKENS = 512
CHUNK_OVERLAP_TOKENS = 50

# cl100k_base is a good general-purpose tokenizer and close enough
# for chunk-sizing purposes even though we're not calling GPT models.
_encoding = tiktoken.get_encoding("cl100k_base")


def _ensure_punkt() -> None:
    """Make sure NLTK's sentence tokenizer data is available."""
    for resource in ("punkt_tab", "punkt"):
        try:
            nltk.data.find(f"tokenizers/{resource}")
            return
        except LookupError:
            continue
    # Neither found — download the current recommended resource.
    nltk.download("punkt_tab", quiet=True)


def _token_count(text: str) -> int:
    return len(_encoding.encode(text))


def split_into_sentences(text: str) -> list[str]:
    """Split raw text into sentences using NLTK's punkt tokenizer."""
    _ensure_punkt()
    # Collapse excessive whitespace/newlines first so punkt doesn't
    # treat mid-paragraph line breaks as sentence boundaries.
    cleaned = " ".join(text.split())
    return nltk.sent_tokenize(cleaned)


@dataclass
class Chunk:
    text: str
    token_count: int
    chunk_index: int


def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE_TOKENS,
    overlap: int = CHUNK_OVERLAP_TOKENS,
) -> list[Chunk]:
    """
    Split text into overlapping, sentence-boundary-aware chunks.

    Returns a list of Chunk objects (text + token_count + index).
    Metadata (source filename, page, doc_id) is NOT attached here —
    that's the ingestion pipeline's job, since this function only
    knows about text, not where it came from.
    """
    sentences = split_into_sentences(text)
    if not sentences:
        return []

    sentence_tokens = [(s, _token_count(s)) for s in sentences]

    chunks: list[Chunk] = []
    current_sentences: list[tuple[str, int]] = []
    current_tokens = 0
    i = 0

    while i < len(sentence_tokens):
        sentence, tok_count = sentence_tokens[i]

        # Edge case: a single sentence longer than chunk_size on its own.
        # Rare in SOP-style docs, but don't let it loop forever — just
        # let it form its own oversized chunk rather than dropping text.
        if tok_count > chunk_size and not current_sentences:
            chunks.append(
                Chunk(text=sentence, token_count=tok_count, chunk_index=len(chunks))
            )
            i += 1
            continue

        if current_tokens + tok_count > chunk_size and current_sentences:
            # Finalize current chunk.
            chunk_text_str = " ".join(s for s, _ in current_sentences)
            chunks.append(
                Chunk(
                    text=chunk_text_str,
                    token_count=current_tokens,
                    chunk_index=len(chunks),
                )
            )

            # Build overlap: walk back from the end of current_sentences
            # until we've accumulated ~overlap tokens, and seed the next
            # chunk with those sentences so context carries forward.
            overlap_sentences: list[tuple[str, int]] = []
            overlap_tokens = 0
            for s, t in reversed(current_sentences):
                if overlap_tokens + t > overlap:
                    break
                overlap_sentences.insert(0, (s, t))
                overlap_tokens += t

            current_sentences = overlap_sentences
            current_tokens = overlap_tokens
            continue  # re-process the same sentence against the fresh chunk

        current_sentences.append((sentence, tok_count))
        current_tokens += tok_count
        i += 1

    # Final leftover chunk.
    if current_sentences:
        chunk_text_str = " ".join(s for s, _ in current_sentences)
        chunks.append(
            Chunk(text=chunk_text_str, token_count=current_tokens, chunk_index=len(chunks))
        )

    return chunks