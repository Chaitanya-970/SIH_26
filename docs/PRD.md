# CITADEL WORKSPACE — Product Requirements Document

**SIH 2026 | Problem Statement 26117**
**Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)
**Version:** 2.0
**Date:** 2026-09-03
**Product Type:** Self-Hosted Web Application
**Changelog:** See [PRD-REVIEW.md](file:///c:/Users/LOQ/OneDrive/Desktop/sih/PRD-REVIEW.md) for the gap analysis that motivated v2 changes.

---

## 1. Overview

CITADEL WORKSPACE is a sovereign, air-gapped agentic AI workbench that runs entirely on an organization's own hardware. It uses open-weight multimodal LLMs to handle confidential industrial knowledge work — drafting approval notes, extracting data from scanned reports, running engineering calculations, and generating real deliverables (.docx, .xlsx, .pptx, code) — without any data ever leaving the premises.

The core value proposition: **everything a knowledge worker does with Claude or Codex, but nothing leaves the building.**

Refineries, PSUs, and defence-linked units generate massive amounts of sensitive routine work (financials, P&IDs, vendor negotiations, internal correspondence) that company policy forbids sending to cloud AI services. CITADEL gives these organizations a genuinely useful AI assistant that respects that boundary, provably.

### Product Type Classification: Web App

**Included sections:** Auth, state management, responsive design, infrastructure, security, accessibility, performance, error handling.

**Tailored for this product:**
- Auth is mocked (single-user demo; real auth deferred to production roadmap)
- Security focus is on **air-gap proof and sandboxed execution**, not traditional web app threats (XSS, CSRF)
- Infrastructure focus is on **local Docker deployment**, not cloud scaling
- No payment/billing, no analytics/tracking, no third-party integrations by design

**Skipped checks (visible and auditable):**
- **Regulatory/Compliance** — Hackathon prototype, not production. No real user data. (Future: OISD/PNGRB/ISO-27001 for MRPL deployment.)
- **Business Model / Pricing** — SIH hackathon entry, not commercial.
- **SEO** — Self-hosted, air-gapped. No public web presence.
- **Analytics / Telemetry** — Explicitly excluded by design (air-gap requirement).

---

## 2. Goals and Objectives

### Primary Goal
Build a working hackathon prototype that satisfies every requirement in PS 26117 and demonstrably proves zero external network traffic during operation.

### Measurable Objectives

| Objective | Metric | Target |
|-----------|--------|--------|
| Multi-model routing | Distinct models used per demo session | >= 2 (vision + text) |
| End-to-end agentic task | Steps completed autonomously without user intervention | >= 3 (OCR -> RAG -> draft -> export) |
| Deliverable generation | Real files produced (.docx, .xlsx, .pptx) | >= 2 file types |
| Code sandbox execution | Python scripts run and verified in isolation | >= 1 |
| Multimodal understanding | Scanned/image inputs processed | >= 1 |
| Sovereign proof | External network calls during full demo | Exactly 0 |
| Inference latency | Time from prompt to first token (single model loaded) | < 15 seconds |
| Total demo duration | End-to-end scripted demo | < 8 minutes |

---

## 3. Scope

### In Scope (v1.0 — Hackathon Demo)

- Split-pane web UI (chat + deliverable workspace)
- 3-model backend via Ollama (vision, coding, document/chat) + embedding model
- Configurable model registry (`models.yaml`) for extensibility
- Rule-based model router with UI override dropdown
- 6 agent tools: `execute_code`, `search_knowledge_base`, `read_document`, `write_word_document`, `write_spreadsheet`, `write_presentation`
- Agentic multi-step task execution with visible reasoning
- SSE streaming protocol with tool-call interleaving
- Local RAG pipeline: document upload -> OCR/parse -> chunk -> embed -> ChromaDB
- Knowledge Base management dashboard (drag-and-drop upload)
- Dockerized Python code sandbox (network-disabled, privilege-dropped)
- Per-session file management with Workspace Assets drawer
- Built-in air-gap status badge (live connection counter)
- Graceful error handling with retry mechanism
- Mock authentication (hardcoded single user)

### Explicitly Out of Scope (v1.0)

- Real authentication (JWT, OAuth, Active Directory)
- Multi-user concurrent access and request queuing
- Kubernetes / Helm deployment
- Production-grade logging, monitoring, alerting
- Mobile / tablet responsive layout
- Multi-language code sandbox (Node.js, bash, etc.)
- Model fine-tuning or training
- Real-time collaboration features
- Automated testing suite
- CI/CD pipeline

### Documented for Future (Pitch Deck "Architecture to Scale")

- Active Directory / LDAP integration for enterprise auth
- Redis-backed request queue for multi-user concurrency
- Milvus replacing ChromaDB for enterprise vector search
- Kubernetes deployment with GPU scheduling
- Audit logging and compliance reporting

---

## 4. User Personas

### Primary Persona: The Plant Engineer

| Attribute | Detail |
|-----------|--------|
| Name | Chaitanya (Chief Engineer) |
| Role | Oversees pump/equipment maintenance at MRPL |
| Technical literacy | Moderate — uses Excel, SAP, email daily; no coding |
| Pain point | Spends 2-3 hours manually drafting approval notes from inspection reports |
| Goal | Upload a scanned report, get a formatted approval note in 5 minutes |
| Trust requirement | Must see proof that data stays local |

### Secondary Persona: The Office Administrator

| Attribute | Detail |
|-----------|--------|
| Name | Priya (Administrative Officer) |
| Role | Manages correspondence, SOPs, and document filing |
| Technical literacy | Low — comfortable with Word and basic web apps |
| Pain point | Searches through hundreds of PDFs to find the right SOP reference |
| Goal | Ask a question in plain language, get an answer grounded in company documents |

### Tertiary Persona: The Internal Developer

| Attribute | Detail |
|-----------|--------|
| Name | Ravi (IT Systems Engineer) |
| Role | Builds internal tools, scripts, and automations |
| Technical literacy | High — writes Python, manages servers |
| Pain point | Cannot use Codex/Copilot because the codebase is confidential |
| Goal | Get coding assistance for internal tooling without data leakage |

---

## 5. Functional Requirements

### 5.1 Conversational Interface (P0 — Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| F-01 | Chat thread | Left pane displays a scrolling conversation between user and agent. Supports markdown rendering. |
| F-02 | File upload | Drag-and-drop or click-to-upload into the chat. Accepted: PDF, DOCX, XLSX, CSV, PNG, JPG, JPEG. **Max 50 MB per file. MIME type validated server-side.** |
| F-03 | Agent reasoning | The agent's multi-step plan is visible in the chat (e.g., "Step 1: Extracting text via OCR..."). Each tool call and its result are displayed as collapsible step cards. |
| F-04 | Streaming response | Tokens stream to the UI via SSE as they are generated. Tool calls and results are interleaved as distinct SSE event types (see Section 10.2). |

### 5.2 Deliverable Workspace (P0 — Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| F-05 | Right pane rendering | Displays generated documents (Word/PPT preview via server-side HTML conversion), code output, spreadsheet previews, and data tables. |
| F-06 | Workspace Assets drawer | Lists all uploaded files and generated exports for the current session. Each item is clickable. |
| F-07 | Download button | Every generated file (.docx, .xlsx, .pptx, .py) has a one-click download. |
| F-08 | Code sandbox output | Rendered code blocks with syntax highlighting. stdout/stderr displayed inline. |

### 5.3 Model Router (P0 — Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| F-09 | Auto-detection (default) | Router reads `models.yaml` and applies rules: image attachment -> Vision model; code keywords -> Coding model; everything else -> Document model. |
| F-10 | Keyword matching | Python regex dictionary scans the prompt for code-related terms (`def`, `python`, `calculate`, `script`, `loop`, `function`, `class`, `import`, `debug`, `error`). |
| F-11 | UI override dropdown | A sleek dropdown next to the chat input, defaulting to "Auto-Detect". Options loaded dynamically from `models.yaml`. |
| F-12 | Routing log | The chat displays which model was selected and why (e.g., "Routed to Vision Analyst — image attachment detected"). |

### 5.4 Agent Tools (P0 — Must Have)

| ID | Tool | Signature | Implementation |
|----|------|-----------|----------------|
| F-13 | `execute_code` | `(script: str) -> stdout/stderr` | Runs Python in a Docker container (`python:3.11-alpine`). Network disabled (`--network none`). Privileges dropped. Timeout: 10-15 seconds. Uses `asyncio.create_subprocess_exec`. |
| F-14 | `search_knowledge_base` | `(query: str) -> list[Chunk]` | Embeds the query via nomic-embed-text, searches ChromaDB (cosine similarity, 768-dim), returns top 3 matching text chunks with source metadata. |
| F-15 | `read_document` | `(file_path: str) -> str` | Reads uploaded files using PyPDF2 (PDF), python-docx (DOCX), pandas (XLSX/CSV), or raw text I/O. |
| F-16 | `write_word_document` | `(content: dict) -> file_path` | Accepts `{title, body, signature_block}`. Generates formatted `.docx` via python-docx. Saves to session exports. Pushes download link to workspace. |
| F-17 | `write_spreadsheet` | `(data: list[dict]) -> file_path` | Accepts array of JSON objects. Converts to DataFrame. Exports as `.xlsx` via openpyxl. Saves to session exports. |
| F-18 | `write_presentation` | `(content: dict) -> file_path` | Accepts `{title, slides: [{heading, bullets}]}`. Generates `.pptx` via python-pptx with clean template. Saves to session exports. |

### 5.5 Knowledge Base Management (P0 — Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| F-19 | Upload dashboard | Dedicated "Knowledge Base" page in the React UI with drag-and-drop file upload. **Max 50 MB per file.** |
| F-20 | Ingestion pipeline | On upload: save to `/opt/citadel/kb/` -> detect type -> OCR if scanned -> chunk text (512 tokens, 50-token overlap, sentence-boundary aware) -> generate embeddings (nomic-embed-text, 768-dim) -> upsert into ChromaDB (cosine similarity). |
| F-21 | Document list | Shows all ingested documents with name, type, chunk count, and upload timestamp. |
| F-22 | Delete document | Remove a document and its chunks from ChromaDB. |
| F-23 | OCR pipeline | Scanned PDFs and images run through Tesseract or EasyOCR before chunking. |
| F-24 | P&ID handling | Engineering drawings are passed through the Vision model to generate text descriptions, which are then embedded (not the raw image). |

### 5.6 Air-Gap Proof (P0 — Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| F-25 | Status badge | Persistent badge in the top nav: `[ STATUS: AIR-GAPPED ] External: 0 | Local: N` with a green indicator. |
| F-26 | Connection counter | Backend periodically reports active local connections (Ollama, ChromaDB, Docker). External count is always 0. |
| F-27 | Network log endpoint | `/api/network-status` returns current connection data for the frontend badge. |

### 5.7 Mock Authentication (P1 — Should Have)

| ID | Requirement | Details |
|----|-------------|---------|
| F-28 | Static login screen | A simple login form that accepts any input and redirects to the workspace. Takes < 2 seconds. |
| F-29 | User avatar | Top-right corner shows "Logged in: Chaitanya (Chief Engineer)" with a static avatar. |

### 5.8 Error Handling (P0 — Must Have)

| ID | Requirement | Details |
|----|-------------|---------|
| F-30 | Graceful failure | No raw stack traces ever reach the UI. All errors are caught in the FastAPI layer. |
| F-31 | OOM / timeout recovery | If Ollama returns 500 or times out: display "VRAM swap timeout. Re-allocating memory..." with a **Retry Task** button. |
| F-32 | Sandbox timeout | If `execute_code` exceeds 15 seconds, kill the container and return a clean timeout message. |
| F-33 | Upload validation | Reject files exceeding 50 MB or failing MIME type check with a clear user-facing error message. |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target |
|-------------|--------|
| First token latency (model already loaded) | < 5 seconds |
| First token latency (model swap required) | < 15 seconds |
| Document upload + ingestion (single PDF, < 20 pages) | < 30 seconds |
| Code sandbox execution (simple script) | < 10 seconds |
| Word/Excel/PPT file generation | < 5 seconds |
| UI initial load time | < 3 seconds |

### 6.2 Security

| Requirement | Details |
|-------------|---------|
| Zero external traffic | No outbound network calls at any point during operation. Provable via network monitor. |
| Sandboxed code execution | Docker container with `--network none`, dropped privileges, read-only mounts, hard timeout. |
| No telemetry | No analytics, tracking, crash reporting, or update checks. |
| File isolation | Per-session directories prevent cross-session data leakage. |
| Upload validation | MIME type check + 50 MB size limit on all file uploads. |

### 6.3 Reliability

| Requirement | Details |
|-------------|---------|
| Model crash recovery | Automatic retry with user-visible status. No data loss on OOM. |
| Session persistence | Chat history and files survive a page refresh. Stored as JSON per session on backend (see Section 8.2). |
| Graceful degradation | If one model fails to load, the system continues with available models and informs the user. |

### 6.4 Hardware Constraints

| Resource | Available | Strategy |
|----------|-----------|----------|
| VRAM | 6 GB | Run one model at a time. Ollama handles load/unload. Use quantized models (Q4_K_M). **All models must set `num_ctx: 4096` to prevent VRAM overflow from KV cache.** |
| RAM | 24 GB | CPU offloading for larger layers if needed. ChromaDB and FastAPI share system RAM. |
| Storage | ~15-20 GB minimum | Ollama model cache (~6 GB for all 4 models), ChromaDB data, session files. |

### 6.5 Compatibility

| Requirement | Details |
|-------------|---------|
| OS | Linux (primary deployment target). Development on Windows via WSL2 / Docker Desktop. |
| Browser | Chrome / Chromium (latest). No IE/Safari support needed. |
| GPU | NVIDIA with CUDA support (Ollama requirement). |

---

## 7. System Architecture

```
+-----------------------------------------------------------+
|                    CITADEL WORKSPACE                       |
|                                                            |
|  +----------------+     +------------------------------+   |
|  |  React (Vite)  |---->|      FastAPI Backend          |  |
|  |  Split-Pane UI |<----|      (async only)             |  |
|  |                |     |                               |  |
|  |  - Chat Pane   |     |  +------------------------+   |  |
|  |  - Workspace   |     |  |    Model Router        |   |  |
|  |  - KB Dashboard|     |  |  (reads models.yaml)   |   |  |
|  |  - Air-Gap     |     |  +----------+-------------+   |  |
|  |    Badge       |     |             |                 |  |
|  |                |     |  +----------v-------------+   |  |
|  +----------------+     |  |    Ollama Server        |   |  |
|                         |  |  +-------------------+  |   |  |
|                         |  |  | Vision (Moondream) |  |   |  |
|                         |  |  | Code (Qwen2.5)    |  |   |  |
|                         |  |  | Doc (Phi-3.5-mini)|  |   |  |
|                         |  |  | Embed (nomic)     |  |   |  |
|                         |  |  +-------------------+  |   |  |
|                         |  +-------------------------+   |  |
|                         |                               |  |
|                         |  +-------------------------+   |  |
|                         |  |    ChromaDB             |   |  |
|                         |  |  (cosine, 768-dim)      |   |  |
|                         |  +-------------------------+   |  |
|                         |                               |  |
|                         |  +-------------------------+   |  |
|                         |  |  Docker Sandbox         |   |  |
|                         |  |  (python:3.11-alpine)   |   |  |
|                         |  |  --network none         |   |  |
|                         |  +-------------------------+   |  |
|                         |                               |  |
|                         |  +-------------------------+   |  |
|                         |  |  OCR Engine             |   |  |
|                         |  |  (Tesseract/EasyOCR)    |   |  |
|                         |  +-------------------------+   |  |
|                         +-------------------------------+  |
|                                                            |
|              ## NETWORK: NONE (AIR-GAPPED) ##              |
+-----------------------------------------------------------+
```

### Key Architecture Decisions

1. **Fully async FastAPI** — All I/O operations (Ollama calls via `httpx.AsyncClient`, Docker sandbox via `asyncio.create_subprocess_exec`, file I/O via `aiofiles`) MUST be async. Synchronous blocking calls (`requests.post`, `subprocess.run`) will freeze the event loop and kill SSE streaming.
2. **Ollama as inference server** — Handles model loading/unloading, quantization, and GPU memory management. Avoids writing custom inference code.
3. **ChromaDB (SQLite backend)** — Zero-config, embedded vector database. Cosine similarity, 768-dim vectors from nomic-embed-text. No separate database server to manage.
4. **Per-session file isolation** — `/opt/citadel/sessions/{uuid}/uploads/`, `/exports/`, and `history.json`. Clean separation between sessions.
5. **Model registry (`models.yaml`)** — Decouples model identities from routing logic. New models can be added by editing the config file, not the router code.

### 7.1 Model Registry Design

```yaml
# models.yaml — add new models by appending to this file
models:
  vision:
    name: "Vision Analyst"
    ollama_tag: "moondream"          # or moondream3.1 after benchmarking
    capability: "vision"
    routing_rule: "has_image_attachment"
    num_ctx: 4096

  coder:
    name: "Code Sandbox"
    ollama_tag: "qwen2.5-coder:3b"
    capability: "code"
    routing_rule: "keyword_match"
    keywords: ["def", "python", "calculate", "script", "loop", "function",
               "class", "import", "debug", "error", "code", "program"]
    num_ctx: 4096

  document:
    name: "Document Drafter"
    ollama_tag: "phi3.5:3.8b"        # or switch to llama3.2:3b for tool calling
    capability: "text"
    routing_rule: "default"
    num_ctx: 4096

  embedding:
    name: "Embedder"
    ollama_tag: "nomic-embed-text"
    capability: "embedding"
    num_ctx: 8192
```

The router reads this file at startup. To add a new model: pull it with `ollama pull <tag>`, add an entry to `models.yaml`, restart FastAPI. No code changes needed — this satisfies the PS requirement for extensibility.

---

## 8. Agent Architecture

### 8.1 Orchestration Loop

The agent uses a **ReAct-style loop** (Reason → Act → Observe → Repeat) with a hard iteration cap.

```
User message + file attachments
        |
        v
  [Model Router] — selects initial model based on input
        |
        v
  [System Prompt + Tool Definitions + User Message]
        |
        v
  +---> [LLM Inference] ---------> text response (streamed to UI)
  |           |
  |     tool_call detected?
  |       /         \
  |     NO           YES
  |      |             |
  |    [DONE]    [Execute Tool]
  |               |
  |          [Append tool result to conversation]
  |               |
  |          iteration < MAX_STEPS?
  |            /         \
  |          YES          NO
  |           |            |
  +--------<--+       [DONE — forced stop, notify user]
```

**Configuration:**
- `MAX_STEPS = 8` — Hard cap on tool-call iterations per user message
- Stop condition: model generates a response without any tool call, OR max steps reached
- Context accumulation: each tool result is appended as an `assistant`/`tool` message pair in the conversation history
- If max steps reached without completion: agent outputs "I've reached the step limit. Here's what I've done so far..." with partial results

### 8.2 Tool-Calling Strategy

**Primary strategy: Text-parsed JSON (not Ollama native `tools` API)**

Rationale: Phi-3.5-mini does not have confirmed native tool-calling support in Ollama. To keep the system model-agnostic and avoid dependency on the `tools` badge, the agent uses a structured prompt that instructs the model to output tool calls as JSON.

**System prompt template (simplified):**
```
You are CITADEL, an AI assistant for industrial knowledge work.
You have access to these tools:

1. execute_code(script: str) — Run Python code in a sandbox. Returns stdout/stderr.
2. search_knowledge_base(query: str) — Search company documents. Returns relevant passages.
3. read_document(file_path: str) — Read an uploaded file. Returns file content.
4. write_word_document(content: {title, body, signature_block}) — Generate a .docx file.
5. write_spreadsheet(data: [{col: val, ...}]) — Generate an .xlsx file.
6. write_presentation(content: {title, slides: [{heading, bullets}]}) — Generate a .pptx file.

To use a tool, output EXACTLY this JSON on its own line:
{"tool": "<tool_name>", "args": {<arguments>}}

After the tool runs, you will receive its output. Continue reasoning and call more tools if needed.
When you are done, respond with your final answer in plain text (no tool call).
```

**Parsing logic in `orchestrator.py`:**
1. Stream tokens from model
2. After each complete response, scan for `{"tool": ...}` JSON pattern
3. If found: execute the tool, append result to conversation, re-invoke model
4. If not found: treat as final response, stream to UI, mark task complete

**Fallback:** If a model with native tool-calling support is used (verified by checking `models.yaml` for a `native_tools: true` flag), the orchestrator can optionally use Ollama's `tools` API for more reliable structured output.

### 8.3 Session State Storage

Each session stores its state in the filesystem:

```
/opt/citadel/sessions/{uuid}/
├── history.json       # Conversation messages
├── uploads/           # User-uploaded files
└── exports/           # Agent-generated files (.docx, .xlsx, .pptx, .py)
```

**`history.json` schema:**
```json
{
  "session_id": "uuid",
  "created_at": "ISO-8601",
  "messages": [
    {
      "role": "user | assistant | tool",
      "content": "message text",
      "model_used": "phi3.5:3.8b",
      "tool_calls": [{"tool": "...", "args": {...}}],
      "tool_result": "...",
      "timestamp": "ISO-8601"
    }
  ]
}
```

---

## 9. User Journeys

### Journey 1: The Core Demo — Scanned Report to Approval Note

```
User                          CITADEL                              Models
  |                              |                                    |
  |  Drag-drop scanned PDF       |                                    |
  |  "Summarize critical         |                                    |
  |   failures and draft an      |                                    |
  |   approval note"             |                                    |
  |----------------------------->|                                    |
  |                              |  Router: image detected            |
  |                              |----------------------------------> |
  |                              |        Moondream (Vision)          |
  |                              |  Extracts: "Bearing temp > 90C"   |
  |                              |<----------------------------------|
  |  "Step 1: Extracted 4        |                                    |
  |   findings via OCR..."       |                                    |
  |<-----------------------------|                                    |
  |                              |  Tool: search_knowledge_base       |
  |                              |  Query: "pump failure SOP"         |
  |                              |------> ChromaDB                    |
  |                              |<------ Top 3 chunks (SOP-42)      |
  |  "Step 2: Found SOP-42      |                                    |
  |   approval chain..."         |                                    |
  |<-----------------------------|                                    |
  |                              |  Router: text task                  |
  |                              |----------------------------------> |
  |                              |        Phi-3.5-mini (Document)     |
  |                              |  Drafts approval note              |
  |                              |<----------------------------------|
  |  "Step 3: Drafting           |                                    |
  |   approval note..."          |                                    |
  |<-----------------------------|                                    |
  |                              |  Tool: write_word_document          |
  |                              |  Generates approval_note.docx      |
  |                              |                                    |
  |  Right pane: Document        |                                    |
  |  preview + Download button   |                                    |
  |<-----------------------------|                                    |
```

### Journey 2: Code Execution Task

1. User types: "Write a Python script to calculate pump efficiency given flow rate and head pressure. Use the Bernoulli equation."
2. Router detects code keywords -> routes to **Qwen2.5-Coder**.
3. Model generates Python script.
4. Agent calls `execute_code` -> Docker sandbox runs the script -> returns stdout.
5. Right pane shows the code with syntax highlighting and the execution output.
6. User can download the `.py` file.

### Journey 3: Knowledge Base Query

1. User types: "What is the maximum allowable vibration level for centrifugal pumps according to our maintenance manual?"
2. Router: no image, no code keywords -> routes to **Phi-3.5-mini**.
3. Agent calls `search_knowledge_base` -> retrieves relevant SOP chunks.
4. Phi-3.5-mini answers grounded in the retrieved context, citing the source document.
5. Right pane shows the referenced source document section.

### Journey 4: Knowledge Base Upload

1. User navigates to "Knowledge Base" dashboard.
2. Drags and drops 5 PDF files (SOPs, maintenance manuals). Files exceeding 50 MB are rejected with a clear error.
3. Backend processes each: detect type -> OCR if scanned -> chunk (512 tokens, 50 overlap) -> embed (nomic-embed-text) -> store in ChromaDB.
4. Dashboard updates with new documents listed (name, type, chunk count, timestamp).
5. User returns to chat and can now query against these documents.

---

## 10. Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | React 18 + Vite | Fast dev server, hot reload, component model fits split-pane UI. |
| Backend | FastAPI (Python 3.11) | Async ASGI framework. All I/O must be async (httpx, aiofiles, asyncio subprocess). |
| HTTP Client | httpx (AsyncClient) | Async HTTP for Ollama API calls. **Do NOT use `requests` — it blocks the event loop.** |
| Inference | Ollama | Handles model management, quantization, GPU memory. Simple HTTP API. |
| Vector DB | ChromaDB | Embedded, zero-config, SQLite backend. Cosine similarity, 768-dim vectors. |
| Code Sandbox | Docker (`python:3.11-alpine`) | Lightweight, network-disabled, privilege-dropped isolation. |
| OCR | Tesseract / EasyOCR | On-device text extraction from scanned documents. |
| Doc Generation | python-docx, openpyxl, python-pptx, pandas | Industry-standard Python libraries for Office file formats. |
| Doc Preview | mammoth | Server-side .docx to HTML conversion for right-pane preview. |
| Embeddings | Ollama (nomic-embed-text) | Local embedding model (137M, 768-dim, 8192 context). All model execution inside Ollama. |

### Models (Confirmed for Week 1 Benchmarking)

| Role | Model | Size | num_ctx | Notes |
|------|-------|------|---------|-------|
| Vision / OCR | Moondream2 (benchmark Moondream 3.1 too) | ~1.8B | 4096 | Tiny footprint. Pair with Tesseract for handwriting fallback. **Evaluate Moondream 3.1 MoE as upgrade.** |
| Coding | Qwen2.5-Coder (3B, Q4) | ~2 GB | 4096 | Fits in 6GB VRAM. Benchmarks needed against DeepSeek-Coder-1.3B. |
| Document / Chat | Phi-3.5-mini (3.8B, Q4) | ~2.5 GB | 4096 | General text, drafting, summarization. **Tool calling via text-parsed JSON, not native API.** |
| Embeddings | nomic-embed-text | ~275 MB | 8192 | Fast, local embedding for RAG. 768-dim vectors, cosine similarity. |

> **Note:** Models are loaded one at a time due to 6 GB VRAM. Ollama handles swapping. Expect 5-10 second latency per model swap on NVMe SSD. All models MUST have `num_ctx` capped to prevent KV cache VRAM overflow.

> **Week 1 validation required:** Test Phi-3.5-mini tool-calling reliability with the text-parsed JSON approach. If unreliable (hallucinated JSON, missing fields), switch to Llama 3.2 3B or Qwen3 4B which have native tool-calling support. This decision blocks orchestrator development.

---

## 10.1 API Design — Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/chat` | Send a message + optional file attachments. Returns SSE stream (see Section 10.2). |
| `POST` | `/api/upload-document` | Upload file to Knowledge Base. Validates MIME + size. Triggers ingestion pipeline. |
| `GET` | `/api/knowledge-base` | List all ingested documents with metadata. |
| `DELETE` | `/api/knowledge-base/{doc_id}` | Remove document and its chunks from ChromaDB. |
| `GET` | `/api/sessions/{session_id}/files` | List uploaded and generated files for a session. |
| `GET` | `/api/sessions/{session_id}/files/{filename}` | Download a specific file. |
| `GET` | `/api/sessions/{session_id}/files/{filename}/preview` | Get HTML preview of .docx (via mammoth) or .xlsx (via HTML table). |
| `GET` | `/api/network-status` | Returns connection data for the air-gap badge. |
| `GET` | `/api/models` | Returns available models from models.yaml (for UI dropdown). |

### 10.2 SSE Streaming Protocol

The `/api/chat` endpoint returns a Server-Sent Events stream. Each event has a `type` field:

| Event Type | Payload | When Emitted |
|------------|---------|--------------|
| `token` | `{"text": "..."}` | Each token during model inference (streamed). |
| `step_start` | `{"step": 1, "description": "Analyzing image via Vision model..."}` | Agent begins a new reasoning step. |
| `tool_call` | `{"tool": "search_knowledge_base", "args": {"query": "..."}}` | Agent decided to call a tool. UI shows loading state. |
| `tool_result` | `{"tool": "search_knowledge_base", "result": "...", "success": true}` | Tool completed. Result shown as collapsible card. |
| `file_created` | `{"filename": "approval_note.docx", "path": "/api/sessions/.../files/..."}` | Agent generated a downloadable file. UI updates workspace. |
| `model_switch` | `{"from": "moondream", "to": "phi3.5:3.8b", "reason": "text task"}` | Ollama is swapping models. UI shows swap indicator. |
| `error` | `{"message": "VRAM swap timeout", "retryable": true}` | Error occurred. UI shows retry button if retryable. |
| `done` | `{"steps_completed": 4}` | Agent task is complete. |

**Frontend contract:** The React ChatPane listens on an EventSource. On `token` events, it appends text. On `tool_call`, it renders a "calling tool..." card. On `file_created`, it updates the Workspace Assets drawer. On `error`, it shows the retry button. On `done`, it re-enables the input.

---

## 11. Directory Structure

```
citadel-workspace/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatPane/        # Left pane — conversation thread
│   │   │   ├── WorkspacePane/   # Right pane — deliverables + assets
│   │   │   ├── KnowledgeBase/   # KB upload dashboard
│   │   │   ├── ModelSelector/   # Router override dropdown
│   │   │   ├── NetworkBadge/    # Air-gap status indicator
│   │   │   └── Layout/          # Split-pane shell, nav, mock auth
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client functions (incl. SSE handler)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, startup
│   │   ├── routers/
│   │   │   ├── chat.py          # /api/chat (SSE streaming)
│   │   │   ├── knowledge_base.py # /api/knowledge-base, /api/upload-document
│   │   │   ├── files.py         # /api/sessions/*/files + preview
│   │   │   ├── network.py       # /api/network-status
│   │   │   └── models.py        # /api/models (reads models.yaml)
│   │   ├── agent/
│   │   │   ├── orchestrator.py  # ReAct loop, MAX_STEPS, tool dispatch
│   │   │   ├── router.py        # Model selection (reads models.yaml)
│   │   │   ├── tools.py         # 6 tool implementations
│   │   │   └── prompts.py       # System prompt templates
│   │   ├── services/
│   │   │   ├── ollama.py        # Ollama async HTTP client (httpx)
│   │   │   ├── chroma.py        # ChromaDB operations (768-dim, cosine)
│   │   │   ├── ocr.py           # Tesseract/EasyOCR wrapper
│   │   │   ├── sandbox.py       # Docker code execution (asyncio subprocess)
│   │   │   └── docgen.py        # Word/Excel/PPT generation + preview
│   │   ├── models/              # Pydantic schemas
│   │   └── config.py            # Settings, paths
│   ├── models.yaml              # Model registry (see Section 7.1)
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker/
│   ├── sandbox/
│   │   └── Dockerfile           # python:3.11-alpine sandbox image
│   └── docker-compose.yml       # Orchestrates all services
│
├── data/
│   ├── kb/                      # Knowledge base documents
│   ├── sessions/                # Per-session uploads, exports, history.json
│   └── chroma/                  # ChromaDB persistent storage
│
├── docs/
│   ├── PRD.md
│   ├── PRD-REVIEW.md
│   └── ps.md
│
├── README.md
└── .env.example
```

---

## 12. RAG Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk size | 512 tokens | Balances retrieval precision with context completeness. |
| Chunk overlap | 50 tokens | Prevents splitting sentences at chunk boundaries. |
| Splitting strategy | Sentence-boundary aware (recursive character splitter) | Avoids mid-sentence cuts that degrade retrieval quality. |
| Embedding model | nomic-embed-text (768-dim) | Fast, local, available via Ollama. 8192-token context window. |
| Distance metric | Cosine similarity | Standard for text embeddings. Set at ChromaDB collection creation. |
| Top-K retrieval | 3 chunks | Keeps context small enough for 4096 `num_ctx`. |
| Embedding `num_ctx` | 8192 | Allows embedding longer chunks without truncation. |

---

## 13. Team Allocation

| Member | Role | Responsibilities |
|--------|------|------------------|
| **Member 1** | Frontend Lead | React UI: split-pane layout, chat interface (SSE consumer), workspace pane (preview rendering), KB dashboard, network badge, model selector dropdown. |
| **Member 2** | RAG Engineer | ChromaDB setup (768-dim, cosine), embedding pipeline, document chunking (512/50), OCR integration (Tesseract/EasyOCR), `/api/upload-document` and `/api/search-kb` endpoints. |
| **Member 3** | DevOps / Security | Docker sandbox image, `docker-compose.yml`, network isolation (`--network none`), privilege dropping, air-gap validation, deployment scripts. |
| **Member 4** | Presentation / Docs | PPT deck, demo script, README, "Architecture to Scale" slide, sample test documents (fake inspection reports, SOPs), demo rehearsal coordination. |
| **Member 5** | Agent Engineer (+ Prompt Owner) | Agent orchestrator (ReAct loop), tool dispatch, system prompt engineering, JSON parsing logic, model interaction via async Ollama API. **Owns system prompts and tool output schemas.** |
| **Member 6** | Model Router Engineer | Router logic (reads `models.yaml`), Ollama model management (load/unload), model selection logging, SSE event emission for `model_switch`, UI override integration with frontend. |

### Cross-Cutting Responsibilities
- **Members 5 & 6** jointly own the 6 tool implementations in `tools.py`
- **Members 1 & 2** collaborate on the Knowledge Base dashboard (frontend + backend)
- **Member 3** supports **Member 5** on Docker sandbox integration
- **Member 4** works with everyone to gather demo-ready sample data
- **Member 5** is the single owner of system prompts and JSON output schemas (prevents crash loops from schema mismatches)

---

## 14. Timeline

> **Deadline:** September 20, 2026
> **Start Date:** September 3, 2026
> **Available Time:** ~17 days

### Phase 1: Foundation (Days 1-4)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Project scaffolding (Vite + FastAPI + Docker Compose) | Member 3 | Running empty app |
| Ollama setup + model pulling (Moondream2/3.1, Phi-3.5-mini, Qwen2.5-Coder, nomic-embed-text) | Member 6 | Models responding via API |
| **Week 1 blocker: test Phi-3.5-mini tool calling via text-parsed JSON** | Member 5 | Go/no-go on document model choice |
| ChromaDB setup + basic embedding pipeline (768-dim, cosine) | Member 2 | Documents embeddable and queryable |
| Split-pane UI shell + mock auth + SSE client skeleton | Member 1 | Clickable prototype with streaming |
| Sample test documents (fake inspection reports, SOPs) | Member 4 | 5-10 test files ready |
| Agent orchestrator skeleton (single-step ReAct loop) | Member 5 | Agent can call one tool and return |
| `models.yaml` schema + router reading from config | Member 6 | Extensible model registry working |

### Phase 2: Core Features (Days 5-10)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Model router (reads models.yaml + keyword + file type + override dropdown) | Member 6 | Auto-routing working across 3 models |
| All 6 tools implemented and tested individually | Members 5 & 6 | Each tool callable and returning results |
| Multi-step agent loop (ReAct: reason -> act -> observe, max 8 steps) | Member 5 | Agent chains 3+ tools in sequence |
| RAG pipeline complete (upload -> OCR -> chunk 512/50 -> embed -> query) | Member 2 | End-to-end KB ingestion working |
| Chat UI with SSE streaming + agent step cards (tool_call, tool_result events) | Member 1 | Real-time streaming with tool interleaving |
| Workspace pane (document preview via mammoth, code output, file list) | Member 1 | Right pane rendering deliverables |
| Docker sandbox hardened | Member 3 | Network-disabled, privilege-dropped, timeout-enforced |

### Phase 3: Integration & Polish (Days 11-14)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Full demo flow working end-to-end | All | Scanned PDF -> OCR -> RAG -> Draft -> Export |
| KB dashboard (drag-and-drop, document list, delete, 50MB limit) | Members 1 & 2 | Admin interface working |
| Network status badge (live connection counter) | Members 1 & 3 | Air-gap proof visible in UI |
| Error handling (OOM recovery, retry button, upload validation) | Members 1 & 5 | Graceful failure across all paths |
| UI polish (animations, loading states, responsive tweaks) | Member 1 | Professional-looking UI |
| PPT deck draft | Member 4 | First draft for team review |

### Phase 4: Demo Prep (Days 15-17)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Demo script finalized and rehearsed | All | Timed < 8 minutes |
| Edge case testing (OOM, timeout, bad input, large files) | Members 3 & 5 | Known failure modes handled |
| PPT finalized with "Architecture to Scale" slide | Member 4 | Presentation ready |
| README and documentation | Member 4 | Clean repo for judges |
| Full dry run (2-3 times minimum) | All | Confident demo |

---

## 15. Success Metrics

### Hackathon Demo Success (Pass/Fail)

| Criteria | How to Verify |
|----------|---------------|
| >= 2 models used with auto-selection | Router log visible in chat shows different models for different tasks |
| End-to-end agentic task (3+ steps) | Scanned PDF -> Vision extraction -> RAG lookup -> Document draft -> .docx export |
| Code sandbox execution | Python script runs in Docker, output displayed |
| Multimodal input processing | Scanned/image file understood by vision model |
| Zero external network calls | Network badge shows `External: 0` throughout; htop/nethogs confirms |
| Real file deliverables generated | .docx and/or .xlsx downloadable from workspace |
| Graceful error recovery | Intentionally trigger an edge case; system recovers with retry |
| Model extensibility | Show models.yaml, explain how to add a new model (pitch deck) |

### Qualitative Metrics (Judge Impression)

| Aspect | Target |
|--------|--------|
| UI polish | Looks like a real product, not a hackathon prototype |
| Demo smoothness | No long awkward silences waiting for inference |
| Sovereign narrative | Judges immediately understand and believe the air-gap claim |
| Practical value | Judges can imagine a real employee using this daily |

---

## 16. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OOM crash during model swap | High | Demo failure | UI retry mechanism; pre-warm models before demo; keep only one model loaded; cap `num_ctx: 4096`. |
| Slow inference on 6GB VRAM | High | Bad demo pacing | Use smallest quantized models; pre-compute some demo steps; rehearse timing. |
| Phi-3.5-mini fails text-parsed tool calling | Medium | Orchestrator unusable | **Week 1 blocker.** Test immediately. Fallback: switch to Llama 3.2 3B or Qwen3 4B with native tool calling. |
| OCR quality on handwritten text | Medium | Inaccurate extraction | Use clean, pre-prepared sample documents for demo; combine Moondream2 + Tesseract. |
| Agent hallucinates or loops | Medium | Wrong deliverable | Strict JSON parsing with validation; MAX_STEPS=8 cap; manual override dropdown. |
| Docker sandbox setup issues on WSL2 | Low | No code execution demo | Test `--network none` on WSL2 early; have a fallback `subprocess` approach (less secure but functional). |
| ChromaDB returns irrelevant chunks | Medium | Bad RAG answers | Curate KB documents; tune chunk size (512) and overlap (50); test queries beforehand. |
| KV cache overflows VRAM | Medium | OOM crash | All models set `num_ctx: 4096` in models.yaml. Document in config. |

---

## 17. Resolved Decisions & Assumptions

### Resolved Decisions

1. **Model versions (RESOLVED)** — Week 1 benchmarking lineup: Moondream2 (1.8B vision, also benchmark Moondream 3.1), Qwen2.5-Coder (3B coding), Phi-3.5-mini (3.8B text). All quantized to Q4 to fit 6GB VRAM.
2. **Embedding model (RESOLVED)** — `nomic-embed-text` via Ollama (137M, 768-dim, 8192 context). All model execution stays inside a single engine for clean VRAM swap management.
3. **Demo hardware (RESOLVED)** — Own laptop. 6GB VRAM is the hard constraint. All model and performance decisions are locked to this.
4. **Agent prompt ownership (RESOLVED)** — Member 5 (Agent Engineer / backend-integration lead). The system prompts dictate JSON output structures that must match what the Python .docx/.xlsx/.pptx generators expect. Mismatches cause crash loops, so one person owns both sides.
5. **P&ID demo (RESOLVED)** — Live presentation. The problem statement explicitly demands a working demonstration of a multimodal task. This is part of the scripted demo flow, not just documentation.
6. **Tool-calling strategy (RESOLVED)** — Text-parsed JSON, not Ollama native `tools` API. Allows model-agnostic orchestration. Week 1 validation required for Phi-3.5-mini.
7. **Async architecture (RESOLVED)** — All FastAPI I/O must be async. httpx for Ollama, asyncio.create_subprocess_exec for Docker, aiofiles for disk. No synchronous blocking calls.

### Assumptions

1. Ollama runs reliably on the demo laptop with CUDA support.
2. Docker Desktop (or Docker Engine on Linux via WSL2) is available and functional.
3. The demo will use curated, pre-prepared sample documents (not live confidential data).
4. Internet access is available during development but the final demo runs fully offline.
5. Judges will have ~8 minutes of attention for the live demo.
6. A single browser tab (Chrome) is the only client during the demo.
7. The demo laptop has at least 15-20 GB free storage for models, ChromaDB, and session files.
8. The demo laptop has an NVMe SSD (model swap times assume SSD, not HDD).

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **Air-Gapped** | A system with no external network connectivity. All processing happens on-premises. |
| **Agentic AI** | An AI system that can plan multi-step tasks, use tools, and iterate autonomously rather than just responding to single prompts. |
| **Open-Weight Model** | An LLM whose model weights are publicly available for download and local deployment (e.g., Llama, Phi, Qwen). |
| **RAG** | Retrieval-Augmented Generation — grounding LLM responses in retrieved documents from a local knowledge base. |
| **ReAct Loop** | Reason-Act-Observe — an agent architecture where the model reasons about what to do, takes an action (tool call), observes the result, and repeats. |
| **VRAM** | Video RAM on the GPU, used to hold model weights during inference. |
| **KV Cache** | Key-Value cache — GPU memory consumed by the attention mechanism, scaling with context length (`num_ctx`). |
| **Quantization** | Reducing model precision (e.g., from 16-bit to 4-bit) to fit larger models in less VRAM. |
| **num_ctx** | Ollama parameter controlling the context window size. Directly affects VRAM consumption via KV cache. |
| **P&ID** | Piping and Instrumentation Diagram — engineering drawings showing process flow. |
| **SOP** | Standard Operating Procedure — documented organizational processes. |
| **ChromaDB** | An open-source, embedded vector database for similarity search. |
| **Ollama** | A local LLM runtime that manages model downloading, quantization, and inference. |
| **SSE** | Server-Sent Events — a browser API for receiving a one-way stream of events from a server over HTTP. |
| **mammoth** | Python library that converts .docx files to HTML for browser preview. |
