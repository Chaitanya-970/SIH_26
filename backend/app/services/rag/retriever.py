"""
Retriever.

This is the ONLY module the Agent should call into for knowledge base
search — per handoff.md's RAG <-> Agent contract, the Agent should not
know how RAG works internally (no direct ChromaDB access, no knowledge
of embeddings/chunking).

Exposes one function: search_knowledge_base(query) -> list[SearchResult]

Score convention: Chroma returns cosine DISTANCE (0 = identical,
2 = opposite). We convert to a similarity SCORE (1 = identical,
higher = more relevant) via score = 1 - distance, matching the
example in handoff.md ("score": 0.91). This conversion is intentional
and should be communicated to the Agent Engineer — if they expected
raw distance, that's a quick fix here, not on their end.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.services import chroma
from app.services.rag.embeddings import embed_text

DEFAULT_TOP_K = 3


@dataclass
class SearchResult:
    text: str
    source: str
    page: int
    score: float

    def to_dict(self) -> dict:
        """Shape matching the agreed Agent<->RAG contract in handoff.md."""
        return {
            "text": self.text,
            "source": self.source,
            "page": self.page,
            "score": self.score,
        }


async def search_knowledge_base(query: str, top_k: int = DEFAULT_TOP_K) -> list[SearchResult]:
    """
    The stable interface the Agent calls to search the knowledge base.

    query:   natural language question/query text
    top_k:   number of results to return (spec default: 3)

    Returns results ordered by relevance (highest score first).
    Returns an empty list if the knowledge base has no chunks yet,
    rather than raising — an empty KB is a valid state, not an error.
    """
    if not query or not query.strip():
        return []

    if chroma.count() == 0:
        return []

    query_vector = await embed_text(query)
    raw = chroma.query(embedding=query_vector, top_k=top_k)

    results: list[SearchResult] = []

    # Chroma's query() returns one outer list per query embedding we
    # sent; we only ever send one, so we index [0] into each field.
    ids = raw.get("ids", [[]])[0]
    documents = raw.get("documents", [[]])[0]
    metadatas = raw.get("metadatas", [[]])[0]
    distances = raw.get("distances", [[]])[0]

    for doc_text, metadata, distance in zip(documents, metadatas, distances):
        score = 1 - distance
        results.append(
            SearchResult(
                text=doc_text,
                source=metadata.get("source", "unknown"),
                page=metadata.get("page", 0),
                score=round(score, 4),
            )
        )

    # Chroma already returns results ordered by distance ascending
    # (i.e. score descending), but sort explicitly to make the
    # ordering guarantee obvious and resilient to future changes.
    results.sort(key=lambda r: r.score, reverse=True)

    return results


async def search_knowledge_base_as_dicts(query: str, top_k: int = DEFAULT_TOP_K) -> list[dict]:
    """
    Convenience wrapper returning plain dicts instead of SearchResult
    objects — useful if the Agent's tool-calling layer expects raw
    JSON-serializable dicts (e.g. for a tool_result payload).
    """
    results = await search_knowledge_base(query, top_k=top_k)
    return [r.to_dict() for r in results]