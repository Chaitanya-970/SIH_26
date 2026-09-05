"""
Document registry.

ChromaDB only stores chunks, not documents as first-class objects —
there's no built-in way to ask "what documents have been ingested?"
This module maintains a small local JSON registry alongside Chroma so
the Knowledge Base list API can show accurate document-level metadata
(filename, type, chunk count, upload timestamp) without reconstructing
it by grouping/guessing from chunk metadata.

Storage: a single JSON file at <kb_dir>/registry.json (kb_dir comes
from the shared Settings in app.config). This is intentionally simple —
if the KB grows large enough that JSON read/write becomes a bottleneck,
swap this for SQLite without changing the public functions below.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from app.config import Settings

_settings = Settings()
_REGISTRY_PATH = Path(_settings.kb_dir) / "registry.json"

# Guards read-modify-write of the registry file against concurrent
# requests (FastAPI can handle requests concurrently even with a
# single worker, via async/threadpool).
_lock = Lock()


@dataclass
class DocumentRecord:
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    page_count: int
    uploaded_at: str  # ISO 8601 timestamp


def _ensure_registry_file() -> None:
    _REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not _REGISTRY_PATH.exists():
        _REGISTRY_PATH.write_text(json.dumps({}), encoding="utf-8")


def _read_all() -> dict[str, dict]:
    _ensure_registry_file()
    raw = _REGISTRY_PATH.read_text(encoding="utf-8")
    if not raw.strip():
        return {}
    return json.loads(raw)


def _write_all(data: dict[str, dict]) -> None:
    _REGISTRY_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def add_document(
    doc_id: str,
    filename: str,
    file_type: str,
    chunk_count: int,
    page_count: int,
) -> DocumentRecord:
    """
    Register a newly (or re-)ingested document.

    If doc_id already exists (re-upload of identical content), this
    overwrites the entry with fresh counts/timestamp rather than
    creating a duplicate — consistent with ingestion.py's own
    idempotent upsert behavior.
    """
    record = DocumentRecord(
        doc_id=doc_id,
        filename=filename,
        file_type=file_type,
        chunk_count=chunk_count,
        page_count=page_count,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
    )

    with _lock:
        data = _read_all()
        data[doc_id] = asdict(record)
        _write_all(data)

    return record


def list_documents() -> list[DocumentRecord]:
    """Return all registered documents, most recently uploaded first."""
    with _lock:
        data = _read_all()

    records = [DocumentRecord(**entry) for entry in data.values()]
    records.sort(key=lambda r: r.uploaded_at, reverse=True)
    return records


def get_document(doc_id: str) -> DocumentRecord | None:
    """Look up a single document by doc_id, or None if not found."""
    with _lock:
        data = _read_all()

    entry = data.get(doc_id)
    return DocumentRecord(**entry) if entry else None


def remove_document(doc_id: str) -> bool:
    """
    Remove a document from the registry.
    Returns True if it existed and was removed, False if it wasn't found.
    """
    with _lock:
        data = _read_all()
        if doc_id not in data:
            return False
        del data[doc_id]
        _write_all(data)
    return True