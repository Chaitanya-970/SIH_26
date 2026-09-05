"""
Embedding service.

Wraps Ollama's local /api/embeddings endpoint using nomic-embed-text.
Fully offline — Ollama must be running locally (ollama serve), but no
external network call ever leaves the machine.
"""

from __future__ import annotations

import httpx

from app.config import Settings

_settings = Settings()

EMBEDDING_MODEL = "nomic-embed-text"
EMBEDDING_DIM = 768

_EMBEDDINGS_URL = f"{_settings.ollama_base_url}/api/embeddings"


class EmbeddingError(RuntimeError):
    """Raised when Ollama is unreachable or returns an unexpected shape."""


async def embed_text(text: str) -> list[float]:
    """Embed a single string. Returns a 768-dim vector."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                _EMBEDDINGS_URL,
                json={"model": EMBEDDING_MODEL, "prompt": text},
            )
            resp.raise_for_status()
        except httpx.ConnectError as e:
            raise EmbeddingError(
                "Could not reach Ollama at "
                f"{_settings.ollama_base_url}. Is `ollama serve` running, and did you "
                f"`ollama pull {EMBEDDING_MODEL}`?"
            ) from e
        except httpx.HTTPStatusError as e:
            raise EmbeddingError(f"Ollama returned an error: {e}") from e

        data = resp.json()
        vector = data.get("embedding")

        if not vector or len(vector) != EMBEDDING_DIM:
            raise EmbeddingError(
                f"Unexpected embedding shape from Ollama: "
                f"got {len(vector) if vector else 0} dims, expected {EMBEDDING_DIM}"
            )
        return vector


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed multiple strings. Sequential for now (simple + reliable).
    """
    vectors: list[list[float]] = []
    for text in texts:
        vectors.append(await embed_text(text))
    return vectors