"""
ChromaDB service.

Owns the persistent local vector store used by the RAG pipeline.
Everything here runs fully offline — no external API calls.

Other RAG modules (ingestion.py, retriever.py) should go through
this module rather than importing chromadb directly.
"""

from __future__ import annotations

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import Settings

_settings = Settings()

CHROMA_COLLECTION_NAME = "citadel_kb"

# Module-level singletons so we don't reopen the DB on every call.
_client: chromadb.ClientAPI | None = None
_collection = None


def get_client() -> chromadb.ClientAPI:
    """Return a persistent local ChromaDB client, creating it if needed."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=_settings.chroma_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_collection():
    """
    Return the single Chroma collection used for the knowledge base.
    cosine similarity is set via hnsw:space, matching the project spec.
    """
    global _collection
    if _collection is None:
        client = get_client()
        _collection = client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(
    ids: list[str],
    embeddings: list[list[float]],
    documents: list[str],
    metadatas: list[dict],
) -> None:
    """Insert (or upsert) a batch of chunks into the collection."""
    collection = get_collection()
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )


def query(embedding: list[float], top_k: int = 3) -> dict:
    """Run a similarity search against the collection."""
    collection = get_collection()
    return collection.query(
        query_embeddings=[embedding],
        n_results=top_k,
    )


def delete_by_doc_id(doc_id: str) -> None:
    """Delete all chunks belonging to a given document."""
    collection = get_collection()
    collection.delete(where={"doc_id": doc_id})


def count() -> int:
    """Total number of chunks currently stored."""
    return get_collection().count()