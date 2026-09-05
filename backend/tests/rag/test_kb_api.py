"""
Tests for the Knowledge Base HTTP API.

Uses FastAPI's TestClient to exercise the real routes (upload, list,
search, delete) end-to-end, including real Ollama embedding calls and
real ChromaDB storage. This is the true "does the whole system work
through the API layer" test referenced in the continuity doc.

Requires ollama serve running + nomic-embed-text pulled.

Run with:
    pytest tests/rag/test_kb_api.py -v
"""

import io

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.documents import router as documents_router
from app.api.knowledge_base import router as kb_router

app = FastAPI()
app.include_router(documents_router)
app.include_router(kb_router)

client = TestClient(app)


def _upload_txt(filename: str, content: str):
    return client.post(
        "/api/upload-document",
        files={"file": (filename, io.BytesIO(content.encode("utf-8")), "text/plain")},
    )


def test_upload_document_success():
    response = _upload_txt(
        "test_upload_pump.txt",
        "Pump P-101 must be inspected every 30 days. Check seals and bearings.",
    )

    assert response.status_code == 200
    data = response.json()

    assert data["filename"] == "test_upload_pump.txt"
    assert data["file_type"] == ".txt"
    assert data["chunk_count"] >= 1
    assert data["page_count"] == 1
    assert "doc_id" in data

    # Cleanup
    client.delete(f"/api/documents/{data['doc_id']}")


def test_upload_rejects_unsupported_file_type():
    response = client.post(
        "/api/upload-document",
        files={"file": ("bad.zip", io.BytesIO(b"fake zip"), "application/zip")},
    )
    assert response.status_code == 400


def test_uploaded_document_appears_in_kb_list():
    upload_response = _upload_txt(
        "test_upload_list_check.txt",
        "Fire extinguishers must be inspected monthly.",
    )
    doc_id = upload_response.json()["doc_id"]

    try:
        list_response = client.get("/api/knowledge-base")
        assert list_response.status_code == 200
        data = list_response.json()

        doc_ids_in_list = [d["doc_id"] for d in data["documents"]]
        assert doc_id in doc_ids_in_list
        assert data["total"] >= 1
    finally:
        client.delete(f"/api/documents/{doc_id}")


def test_search_kb_returns_relevant_result():
    upload_response = _upload_txt(
        "test_search_pump.txt",
        "Pump P-101 must be inspected every 30 days for wear and tear.",
    )
    doc_id = upload_response.json()["doc_id"]

    try:
        search_response = client.post(
            "/api/search-kb",
            json={"query": "How often should the pump be inspected?", "top_k": 3},
        )
        assert search_response.status_code == 200
        data = search_response.json()

        assert data["query"] == "How often should the pump be inspected?"
        assert len(data["results"]) >= 1
        assert "Pump P-101" in data["results"][0]["text"]
        assert data["results"][0]["source"] == "test_search_pump.txt"
        assert 0.0 <= data["results"][0]["score"] <= 1.0
    finally:
        client.delete(f"/api/documents/{doc_id}")


def test_delete_document_removes_it_from_kb_list():
    upload_response = _upload_txt(
        "test_delete_me.txt",
        "Temporary content for deletion test.",
    )
    doc_id = upload_response.json()["doc_id"]

    delete_response = client.delete(f"/api/documents/{doc_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["deleted"] is True

    list_response = client.get("/api/knowledge-base")
    doc_ids_in_list = [d["doc_id"] for d in list_response.json()["documents"]]
    assert doc_id not in doc_ids_in_list


def test_delete_nonexistent_document_returns_false():
    response = client.delete("/api/documents/nonexistent_doc_id_12345")
    assert response.status_code == 200
    assert response.json()["deleted"] is False