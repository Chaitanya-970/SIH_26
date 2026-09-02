# CITADEL WORKSPACE — Features List

## Product Overview
CITADEL WORKSPACE is a sovereign, air-gapped agentic AI workbench that runs entirely on an organization's own hardware. Designed for sensitive industrial environments like MRPL, it uses open-weight multimodal LLMs to handle confidential knowledge work (drafting notes, running calculations, extracting data from scanned reports) while ensuring zero data leakage. It produces real deliverables (.docx, .xlsx, .pptx, code) in a split-pane web UI powered by an async FastAPI backend, Ollama inference, and ChromaDB vector search.

---

## Feature Summary

### By Priority
| Priority | Count |
|----------|-------|
| Must Have | 34 |
| Should Have | 2 |
| Could Have | 0 |
| Won't Have (v1.0) | 4 |
| **Total** | **40** |

### By Category
| Category | Count |
|----------|-------|
| Conversational Interface | 4 |
| Deliverable Workspace | 4 |
| Model Router | 4 |
| Agent Tools | 6 |
| Knowledge Base Management | 6 |
| Air-Gap Proof | 3 |
| Error Handling | 4 |
| Infrastructure | 3 |
| Mock Authentication | 2 |
| Out of Scope (Future) | 4 |
| **Total** | **40** |

---

## 1. Conversational Interface
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-01 | Chat thread | Must Have | Medium | Left pane displaying a scrolling conversation between user and agent. Supports markdown rendering. |
| F-02 | File upload | Must Have | Medium | Drag-and-drop or click-to-upload into the chat. Accepts PDF, DOCX, XLSX, CSV, PNG, JPG, JPEG. Max 50 MB per file, MIME validated. |
| F-03 | Agent reasoning visibility | Must Have | Medium | Agent's multi-step plan is visible in the chat as collapsible step cards (e.g., "Step 1: Extracting text via OCR..."). |
| F-04 | Streaming response (SSE) | Must Have | High | Tokens stream to the UI via SSE. Tool calls and results are interleaved as distinct event types (`token`, `step_start`, `tool_call`, `tool_result`, `file_created`, `model_switch`, `error`, `done`). |

## 2. Deliverable Workspace
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-05 | Right pane preview | Must Have | Medium | Displays generated documents (Word/PPT via HTML preview), code output, spreadsheet previews, and data tables. |
| F-06 | Workspace Assets drawer | Must Have | Low | Lists all uploaded files and generated exports for the current session. Each item is clickable. |
| F-07 | Download buttons | Must Have | Low | One-click download for every generated file (.docx, .xlsx, .pptx, .py). |
| F-08 | Code sandbox output | Must Have | Medium | Rendered code blocks with syntax highlighting; stdout/stderr displayed inline. |

## 3. Model Router
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-09 | Auto-detection rules | Must Have | Low | Applies rules from `models.yaml`: image attachment -> Vision model; code keywords -> Coding model; everything else -> Document model. |
| F-10 | Keyword matching | Must Have | Low | Python regex scans prompts for code-related terms (`def`, `python`, `calculate`, `script`, etc.) to trigger Qwen2.5-Coder. |
| F-11 | UI override dropdown | Must Have | Low | Dropdown next to chat input (default: "Auto-Detect"). Options load dynamically from `models.yaml`. |
| F-12 | Routing log | Must Have | Low | Chat displays selected model and reason (e.g., "Routed to Vision Analyst — image attachment detected"). |

## 4. Agent Tools
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-13 | `execute_code` | Must Have | High | Runs Python in a network-disabled, privilege-dropped Docker container with a 15s timeout. Uses `asyncio.create_subprocess_exec`. |
| F-14 | `search_knowledge_base` | Must Have | Medium | Embeds query via nomic-embed-text, searches ChromaDB (cosine similarity, 768-dim), returns top 3 chunks. |
| F-15 | `read_document` | Must Have | Medium | Reads uploaded files via PyPDF2, python-docx, pandas, or raw text I/O. |
| F-16 | `write_word_document` | Must Have | Medium | Generates `.docx` via python-docx. Saves to session exports and pushes download link to UI. |
| F-17 | `write_spreadsheet` | Must Have | Medium | Converts JSON array to DataFrame, exports as `.xlsx` via openpyxl. |
| F-18 | `write_presentation` | Must Have | Medium | Generates `.pptx` via python-pptx using a clean template. |

## 5. Knowledge Base Management
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-19 | Upload dashboard | Must Have | Low | Dedicated "Knowledge Base" page with drag-and-drop file upload. Max 50 MB per file. |
| F-20 | Ingestion pipeline | Must Have | High | Pipeline: upload -> type detection -> OCR (if needed) -> chunking (512 tokens, 50 overlap) -> embedding (768-dim) -> ChromaDB upsert. |
| F-21 | Document list | Must Have | Low | Displays ingested documents (name, type, chunk count, timestamp). |
| F-22 | Delete document | Must Have | Low | Removes a document and its associated chunks from ChromaDB. |
| F-23 | OCR pipeline | Must Have | High | Scanned PDFs and images process through Tesseract/EasyOCR before chunking. |
| F-24 | P&ID handling | Must Have | High | Engineering drawings pass through Vision model to generate embeddable text descriptions. |

## 6. Air-Gap Proof
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-25 | Status badge | Must Have | Low | Persistent top nav badge: `[ STATUS: AIR-GAPPED ] External: 0 \| Local: N`. |
| F-26 | Connection counter | Must Have | Medium | Backend monitors and reports active local connections (Ollama, ChromaDB, Docker); asserts 0 external. |
| F-27 | Network log endpoint | Must Have | Low | `/api/network-status` returns connection data for the frontend badge. |

## 7. Mock Authentication
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-28 | Static login screen | Should Have | Low | Simple login form accepting any input; redirects to workspace instantly. |
| F-29 | User avatar | Should Have | Low | Top-right corner displays static avatar ("Logged in: Chaitanya (Chief Engineer)"). |

## 8. Error Handling
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-30 | Graceful failure | Must Have | Medium | FastAPI catches all errors; no raw stack traces reach the UI. |
| F-31 | OOM / timeout recovery | Must Have | Medium | Triggers user-visible "VRAM swap timeout" message with a "Retry Task" button if Ollama returns 500. |
| F-32 | Sandbox timeout | Must Have | Medium | Kills Docker container if `execute_code` exceeds 15 seconds; returns clean timeout message. |
| F-33 | Upload validation | Must Have | Low | Rejects files > 50 MB or failing MIME check with clear frontend/backend error message. |

## 9. Infrastructure & Orchestration (Implicit from Architecture)
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-34 | Model Registry (`models.yaml`) | Must Have | Medium | Config-driven model loading decoupled from code, enabling extensibility. |
| F-35 | Session State Storage | Must Have | Medium | Per-session folders (`/sessions/{uuid}/`) storing uploads, exports, and `history.json`. |
| F-36 | Agent Orchestrator Loop | Must Have | High | ReAct-style loop parsing JSON tool calls from text output, accumulating context up to `MAX_STEPS = 8`. |

## 10. Out of Scope (Future Roadmap)
| ID | Feature | Priority | Complexity | Description |
|----|---------|----------|------------|-------------|
| F-37 | Real authentication | Won't Have | High | JWT, OAuth, or Active Directory integration. |
| F-38 | Multi-user concurrency | Won't Have | High | Redis-backed request queuing for concurrent access. |
| F-39 | Enterprise Deployment | Won't Have | High | Kubernetes/Helm with GPU scheduling and Milvus vector search. |
| F-40 | Responsive layout | Won't Have | Medium | Mobile/tablet support (demo targets desktop Chrome only). |

---

## Self-Check Report
1. **Summary Recount**: Manually recounted the rows in the markdown tables above.
   - 34 Must Have, 2 Should Have, 0 Could Have, 4 Won't Have = Total 40.
   - Conversational (4) + Workspace (4) + Router (4) + Tools (6) + KB (6) + Air-Gap (3) + Mock Auth (2) + Error (4) + Infra (3) + Out of Scope (4) = Total 40.
2. **Cross-Reference Verification**: Verified that feature IDs are strictly sequential (F-01 through F-40) and uniquely correspond to the capabilities outlined in `PRD.md`.
3. **Table Agreement**: The "By Priority" table and "By Category" table totals (40) exactly match the number of rows listed in sections 1-10. No discrepancies found.
