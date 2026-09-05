"""
Pydantic schemas for document-related API request/response shapes.
"""

from __future__ import annotations

from pydantic import BaseModel


class UploadDocumentResponse(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    page_count: int
    pages_ocred: int
    uploaded_at: str


class DocumentListItem(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    page_count: int
    uploaded_at: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentListItem]
    total: int


class DeleteDocumentResponse(BaseModel):
    doc_id: str
    deleted: bool