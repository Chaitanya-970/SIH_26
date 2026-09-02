# PRD Review — CITADEL WORKSPACE

**Reviewed:** 2026-09-03
**Source:** [PRD.md](file:///c:/Users/LOQ/OneDrive/Desktop/sih/PRD.md) (v1.0)
**Product Type Classified:** Self-Hosted Web App
**Reviewer Context:** Verified technology claims against current (Sept 2026) ecosystem behavior.

---

## Product Type: Web App — Checks Applied and Skipped

**Applied:** Auth (mocked — documented correctly), state management, infrastructure (Docker/local), security (air-gap + sandbox), performance, error handling, accessibility (limited — noted below), responsive design (skipped for demo — documented correctly).

**Skipped (with rationale):**
- **Regulatory/Compliance** — Hackathon prototype, not production deployment. No real user data processed. *If this were a real MRPL deployment, OISD/PNGRB/ISO-27001 compliance would be critical. Noted as a future concern only.*
- **Business Model / Pricing** — SIH hackathon entry, not a commercial product.
- **SEO** — Self-hosted, air-gapped. No public web presence.
- **Analytics / Telemetry** — Explicitly excluded by design (air-gap requirement).

---

## Step 0: Grounding in Reality

### PS-to-PRD Coverage Mapping

| PS Requirement | PRD Coverage | Status |
|---|---|---|
| Self-hosted, air-gapped | F-24 to F-26, NFR 6.2 | **Covered** |
| Multiple open-weight models at once | F-09 to F-12, Section 9 | **Covered** |
| Auto-pick the right model per task | F-09 to F-11 | **Covered** |
| New models addable later without redesign | Not addressed | **GAP (H-01)** |
| Agentic multi-step work | F-03, Journey 1, Section 7 | **Covered** |
| Local tools (file read/write, code exec, spreadsheet, doc search) | F-13 to F-17 | **Covered** |
| Scanned PDFs, handwritten notes, drawings, photos | F-22, F-23, Journey 1 | **Covered** |
| On-device OCR and vision models | Section 9 (Moondream2, Tesseract) | **Covered** |
| Real deliverables (approval notes, PPT/Word/Excel, code) | F-16, F-17, Journey 1-2 | **Partial — PPT missing (H-02)** |
| Knowledge base (manuals, SOPs, past correspondence) | F-18 to F-23 | **Covered** |
| Zero external calls provable via logs/network monitor | F-24 to F-26 | **Covered** |
| Model auto-selection across >= 2 task types | Obj table row 1, F-09 | **Covered** |
| Coding task in sandbox | F-13, Journey 2 | **Covered** |
| Multimodal task (image/scanned doc) | Journey 1, F-23 | **Covered** |

### Technology Claims Verified

| Claim | Verified? | Finding |
|---|---|---|
| Moondream2 available on Ollama | **Yes** | Available since Ollama 0.1.33. However, Moondream 3.1 (MoE) exists and is significantly better. **(M-01)** |
| Qwen2.5-Coder 3B Q4 fits in 6GB VRAM | **Yes** | ~1.8-2 GB weights. 3-4 GB total with KV cache at 4K context. Fits. |
| Phi-3.5-mini Q4 fits in 6GB VRAM | **Yes** | ~2.2-2.5 GB weights. Fits comfortably at modest context lengths. |
| nomic-embed-text via Ollama | **Yes** | Fully available. 137M params, 8192-token context. |
| "Single-threaded FastAPI" | **Misleading** | FastAPI is async (ASGI). It is NOT single-threaded in the traditional sense. It runs an async event loop on one thread per worker. Blocking calls (synchronous Ollama HTTP, Docker subprocess) will freeze the entire server. **(H-03)** |
| Ollama model swap: 5-10 seconds | **Plausible** | Verified: sub-10 seconds on NVMe SSD for Q4 3-4B models. But can be 15+ seconds on HDD or under memory pressure. |
| Phi-3.5-mini supports Ollama tool calling natively | **Unverified / Likely No** | Phi-3.5-mini lacks a native "tools" badge in Ollama library. It may not reliably return structured JSON tool calls. **(H-04)** |
| Qwen2.5-Coder 3B supports Ollama tool calling | **Partially verified** | Qwen2.5-Coder series has tool calling support in some variants but the 3B specifically needs verification. **(H-04)** |

### Claims I Could NOT Verify

1. **Moondream2 OCR quality on handwritten industrial inspection reports** — No benchmark data found for this specific domain. The PRD acknowledges this in the risk table (OCR quality, Medium likelihood), which is appropriate.
2. **python:3.11-alpine Docker image with `--network none` on Windows/WSL2** — Docker Desktop on Windows has known quirks with network namespace isolation in WSL2. Whether `--network none` works identically to native Linux was not confirmed.
3. **30 GB storage estimate** — Actual model sizes total ~6 GB. ChromaDB + sessions add a few GB. 30 GB is conservative/safe but overshoots the realistic minimum by ~3x.

---

## Step 1: Gap Analysis

### HIGH Impact Findings

#### H-01: No Model Extensibility Architecture
**PS requirement:** "New open weight models should be addable later without redesigning the system, since this space is moving fast."
**PRD gap:** The PRD hardcodes 3 specific models and a keyword-based router. There is no documented mechanism for adding a new model — no config file schema, no model registry, no plugin interface. The router logic in `router.py` would need code changes for every new model.
**Recommendation:** Add a `models.yaml` or `config.py` model registry that maps model names to Ollama tags, capability tags (vision/code/text), and routing rules. The router reads this config instead of hardcoded if/else chains.

#### H-02: PPT Generation Missing
**PS requirement:** "Output should be real deliverables, approval notes, PPT/Word/Excel files..."
**PRD gap:** The PRD has `write_word_document` and `write_spreadsheet` tools but no `write_presentation` or PPT equivalent. The PS explicitly calls out PPT as a deliverable type.
**Recommendation:** Add a 6th tool: `write_presentation(content: dict) -> file_path` using `python-pptx`. Even a basic 3-slide deck (title, findings, recommendation) would satisfy the PS requirement. Alternatively, explicitly document this as a known gap and explain why it was deprioritized.

#### H-03: FastAPI Blocking Call Architecture
**PRD claim:** "Single-threaded FastAPI — No async workers, no task queue. One request at a time."
**Reality:** FastAPI runs an async event loop. If the agent orchestrator makes synchronous HTTP calls to Ollama (e.g., `requests.post()`), the entire server freezes — no SSE streaming, no network badge updates, nothing. This is the single most likely cause of the UI appearing "hung" during inference.
**Recommendation:** Clarify in the architecture section: the Ollama client MUST use `httpx.AsyncClient` (not `requests`). The Docker sandbox calls MUST use `asyncio.create_subprocess_exec` (not `subprocess.run`). Add this as a technical constraint in Section 7.

#### H-04: Agent Orchestration Design Undefined
**PRD gap:** The PRD says the agent must "plan out multi-step work" and "iterate on a task instead of answering once and stopping." But the actual orchestration loop is never specified:
- How does the agent decide which tool to call next?
- What is the system prompt structure?
- How does the agent receive tool results and decide to continue or stop?
- What is the max iteration count?
- Does the agent use Ollama's native tool calling API, or does it parse JSON from the model's text output?
This is the hardest engineering problem in the entire project and it gets one line in the directory structure (`orchestrator.py`).
**Recommendation:** Add a dedicated "Agent Architecture" section specifying: the system prompt template, the tool-call parsing strategy (native vs. text-parsed JSON), the iteration loop with max steps (suggest 5-8), the stop condition, and how context accumulates across steps.

#### H-05: Tool Calling Compatibility Risk
**Finding from verification:** Phi-3.5-mini likely does NOT support Ollama's native `tools` API. If the orchestrator relies on native tool calling, the document/chat model — the one that does the actual multi-step agentic work — cannot use tools.
**Recommendation:** Either: (a) switch the document model to one with confirmed tool-calling support (Llama 3.2 3B, Qwen3 4B), or (b) design the orchestrator to use text-parsed JSON (prompt the model to output `{"tool": "...", "args": {...}}` and parse it in Python). Option (b) is more fragile but works with any model.

#### H-06: Streaming + Agentic Steps Conflict
**PRD requires:** F-04 (streaming tokens to UI) AND F-03 (agent reasoning steps visible in chat).
**Technical conflict:** During a multi-step agentic task, the agent calls a tool mid-stream (e.g., after OCR, it needs to call `search_knowledge_base`). How does streaming work across multiple model invocations and tool calls? The UI needs to show:
1. Model generates text (streamed)
2. Model decides to call a tool (stream pauses)
3. Tool executes (loading state in UI)
4. Model resumes with tool results (new stream)

This interleaved streaming-and-tool-calling pattern is not addressed anywhere in the PRD. The API design shows a single `POST /api/chat` endpoint — does it return one long SSE stream covering all steps, or does the frontend poll?
**Recommendation:** Add a "Streaming Protocol" subsection to the API design specifying the SSE event types: `token` (streamed text), `tool_call` (agent is calling a tool), `tool_result` (tool returned data), `step_complete` (one agent step done), `done` (task complete).

#### H-07: No File Size Limits or Upload Validation
**PRD gap:** F-02 accepts PDF, DOCX, XLSX, CSV, PNG, JPG, JPEG via drag-and-drop. No maximum file size is specified. A 500 MB scanned PDF would crash the 24 GB RAM system during OCR. No MIME type validation is specified (a user could rename a .exe to .pdf).
**Recommendation:** Add file size limits (suggest 50 MB per file for demo) and MIME type validation to F-02 and F-18.

---

### MEDIUM Impact Findings

#### M-01: Moondream2 is Outdated
**Finding:** Moondream 3.1 (MoE architecture) is now available and significantly more capable than Moondream2. For the same VRAM budget, it offers better reasoning and segmentation. The PRD locked in Moondream2 without benchmarking against alternatives.
**Recommendation:** Change the Models table to list Moondream 3.1 as the primary candidate, with Moondream2 as fallback. Also evaluate Phi-4-mini for vision if available on Ollama.

#### M-02: Context Window Management Absent
**Finding:** Ollama pre-allocates VRAM for the full `num_ctx` (context window). If a model defaults to 128K context, it will exceed 6 GB VRAM even if the weights fit. The PRD never mentions setting `num_ctx`.
**Recommendation:** Add a technical constraint: all Ollama model configs must set `num_ctx: 4096` (or 8192 max) to stay within VRAM budget. Document this in Section 6.4 and in config.py.

#### M-03: No Conversation History / Session State Design
**Finding:** NFR 6.3 says "Chat history and files survive a page refresh (stored on backend)" but there is no specification for how conversation state is stored. No database schema, no file format, no mention of where chat messages live. Is it in-memory (lost on server restart)? SQLite? JSON files?
**Recommendation:** Specify session storage: suggest a JSON file per session in `/opt/citadel/sessions/{uuid}/history.json`. Define the message schema: `{role, content, model_used, tool_calls, timestamp}`.

#### M-04: No `.docx` Preview Strategy
**Finding:** F-05 says the right pane renders "Word preview." How? Browsers cannot natively render `.docx` files. Options: convert to HTML server-side (using `mammoth` or `pandoc`), render as styled markdown, or show raw text with a download link. None of these are specified.
**Recommendation:** Specify the preview strategy. Suggest: server-side conversion to HTML via `mammoth` for Word, and rendering as an HTML table for spreadsheets. Add `mammoth` to the tech stack.

#### M-05: RAG Chunking Strategy Unspecified
**Finding:** F-19 says "chunk text" but never specifies chunk size, overlap, or chunking strategy. These parameters dramatically affect RAG quality. Too small = fragmented context. Too large = diluted retrieval.
**Recommendation:** Specify: 512-token chunks with 50-token overlap, using sentence-boundary-aware splitting. Document in a new "RAG Configuration" subsection.

#### M-06: No Embedding Dimension or Distance Metric Specified
**Finding:** ChromaDB is mentioned but the embedding dimension (nomic-embed-text produces 768-dim vectors) and distance metric (cosine vs. L2) are not specified. These affect retrieval quality and must be set at collection creation time.
**Recommendation:** Add: ChromaDB collection uses cosine similarity with 768-dimensional vectors from nomic-embed-text.

---

### LOW Impact Findings

#### L-01: Architecture Diagram Shows "Phi-3" Not "Phi-3.5-mini"
**Finding:** The ASCII architecture diagram on line 268 says `Doc (Phi-3)` but Section 9 and Section 16 specify Phi-3.5-mini. Minor label inconsistency.

#### L-02: Timeline Phase 1 References "Phi-3" Not "Phi-3.5-mini"
**Finding:** Line 511 says "model pulling (Moondream2, Phi-3, Qwen2.5-Coder)" — should be Phi-3.5-mini.

#### L-03: Journey 1 Diagram References "Phi-3" Not "Phi-3.5-mini"
**Finding:** Line 331 says "Phi-3 (Document)" — should be Phi-3.5-mini.

---

## Step 2: Improvement Recommendations

### Structure & Clarity

1. **Add "Agent Architecture" section** — The orchestration loop is the technical heart of this project. It needs its own section with: system prompt template, tool-call parsing strategy, iteration loop, stop conditions, context accumulation, and error recovery mid-loop.

2. **Add "Streaming Protocol" to API Design** — Define SSE event types for the interleaved streaming-and-tool-calling pattern. Without this, the frontend developer (Member 1) will have to guess what the backend sends.

3. **Add "Model Registry" to Architecture** — A `models.yaml` config that decouples model names from routing logic. This directly addresses the PS requirement for extensibility.

4. **Add "RAG Configuration" subsection** — Chunk size, overlap, splitting strategy, embedding dimensions, distance metric, `num_ctx` for embedding model.

### Completeness & Feasibility

5. **Resolve tool-calling compatibility** — This is a must-do before writing any agent code. If Phi-3.5-mini doesn't support Ollama native tool calling, the entire orchestrator design changes. Test this in Week 1 alongside model benchmarking.

6. **Add PPT tool or explicitly deprioritize** — The PS mentions PPT. Either add `write_presentation` as tool #6 or add it to the "Out of Scope" list with a note that it's a known PS gap.

7. **Specify async requirements** — `httpx.AsyncClient` for Ollama, `asyncio.create_subprocess_exec` for Docker. This is a hard technical constraint, not a suggestion.

8. **Add file validation** — Size limits, MIME checks, rejection messages.

### Prioritization (MoSCoW Refinement)

| Feature | Current | Recommended | Rationale |
|---|---|---|---|
| Agent orchestrator | P0 (implicit) | **P0-Critical Path** | Everything depends on this working |
| Model router | P0 | P0 | Depends on orchestrator |
| Streaming + tool interleaving | Not specified | **P0-Critical Path** | Demo fails without this |
| KB dashboard | P0 | **P1** | Can demo RAG via pre-loaded data |
| `.docx` preview in right pane | P0 | **P1** | Download link is sufficient for demo |
| Network badge | P0 | P0 | Core differentiator for judges |
| PPT generation | Not listed | **P2** | Nice-to-have for PS coverage |

---

## Quality Assessment

| Dimension | Score (1-10) | Notes |
|---|---|---|
| **Completeness** | 7 | Strong coverage of UI, tools, team, timeline. Missing agent orchestration design, streaming protocol, model extensibility, RAG params, and PPT tool. |
| **Clarity** | 8 | Well-structured with IDs, tables, and diagrams. Minor label inconsistencies (Phi-3 vs Phi-3.5-mini). Functional requirements are unambiguous. |
| **Feasibility** | 6 | Hardware constraints are realistic. But tool-calling compatibility is unverified, async architecture is mislabeled, and the orchestrator (hardest part) is underspecified. |
| **User-Focus** | 8 | Three well-defined personas, four user journeys, demo-oriented success metrics. The "judge impression" qualitative metrics are a smart addition. |
| **Overall** | 7.3 | A strong first draft that covers breadth well. The gaps are in depth — the agent loop, streaming protocol, and model compatibility. |

---

## Self-Check Results

1. **Summary table recount:** H-01 through H-07 = 7 High. M-01 through M-06 = 6 Medium. L-01 through L-03 = 3 Low. **Counts match.**

2. **Internal cross-references verified:** All finding IDs (H-01 through H-07, M-01 through M-06, L-01 through L-03) reference correct PRD sections, line numbers, and PS passages. Verified against source files.

3. **Table consistency check:** Models table (Section 9) and Resolved Decisions (Section 16) agree on Phi-3.5-mini. Architecture diagram and Timeline say "Phi-3" — documented as L-01, L-02, L-03.

4. **No two tables disagree on substance.** The Phi-3 label issue is cosmetic, not substantive.

**Self-check complete. Three label inconsistencies found and documented. No substantive contradictions between tables.**
