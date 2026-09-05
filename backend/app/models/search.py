"""
Pydantic schemas for the knowledge base search API.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=3, ge=1, le=20)


class SearchResultItem(BaseModel):
    text: str
    source: str
    page: int
    score: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]