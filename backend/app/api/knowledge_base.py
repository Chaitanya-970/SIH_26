"""
Knowledge Base API routes.

    GET  /api/knowledge-base
    POST /api/search-kb

Thin HTTP wrappers around registry.py and retriever.py.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.models.document import DocumentListResponse, DocumentListItem
from app.models.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.rag import registry
from app.services.rag.retriever import search_knowledge_base

router = APIRouter()


@router.get("/api/knowledge-base", response_model=DocumentListResponse)
async def list_knowledge_base() -> DocumentListResponse:
    """List all documents currently ingested into the knowledge base."""
    records = registry.list_documents()

    items = [
        DocumentListItem(
            doc_id=r.doc_id,
            filename=r.filename,
            file_type=r.file_type,
            chunk_count=r.chunk_count,
            page_count=r.page_count,
            uploaded_at=r.uploaded_at,
        )
        for r in records
    ]

    return DocumentListResponse(documents=items, total=len(items))


@router.post("/api/search-kb", response_model=SearchResponse)
async def search_kb(request: SearchRequest) -> SearchResponse:
    """
    Search the knowledge base. Returns the top_k most relevant chunks,
    each with source filename, page number, and a relevance score
    (higher = more relevant; see retriever.py for the score convention).
    """
    results = await search_knowledge_base(request.query, top_k=request.top_k)

    result_items = [
        SearchResultItem(text=r.text, source=r.source, page=r.page, score=r.score)
        for r in results
    ]

    return SearchResponse(query=request.query, results=result_items)