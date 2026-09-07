# CITADEL WORKSPACE 🛡️⚙️
### Sovereign, Air-Gapped Agentic AI Workbench for Confidential Industrial Work

[![SIH 2026](https://img.shields.io/badge/SIH%202026-Problem%20Statement%2026117-0284c7.svg)](https://www.sih.gov.in/)
[![Organization](https://img.shields.io/badge/Organization-MRPL%20(Mangalore%20Refinery)-d97706.svg)](https://www.mrpl.co.in/)
[![Operational Mode](https://img.shields.io/badge/Operational%20Mode-100%25%20Air--Gapped-10b981.svg)]()
[![Outbound Egress](https://img.shields.io/badge/Outbound%20Egress-0%20Packets%20(Verified)-success.svg)]()
[![Inference Engine](https://img.shields.io/badge/Inference-Local%20Ollama%20IPC-blueviolet.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Internal-lightgrey.svg)]()

---

## 📌 Executive Overview

In refineries, petrochemical complexes, PSUs, and defense installations, engineers and operators produce critical, high-sensitivity knowledge work every day:
- **Turnaround approval notes** and maintenance authorizations
- **Piping & Instrumentation Diagrams (P&IDs)** and engineering schematics
- **Vibration telemetry and SCADA sensor diagnostics**
- **Scanned physical inspection sheets** and handwritten checklists

Because this operational data is classified and safety-critical, **it cannot be routed through commercial cloud AI services (e.g., ChatGPT, Claude, or Codex)**. Commercial cloud solutions introduce severe intellectual property exposure, compliance violations, and external attack surfaces.

**CITADEL WORKSPACE** is an enterprise-grade, **100% air-gapped, self-hosted agentic AI workbench** engineered to operate on single workstation hardware or on-premise GPU servers. It executes state-of-the-art open-weight models locally, autonomously orchestrates multi-step workflows, runs verified code in secure local sandboxes, parses physical scanned engineering documents, and generates production-ready `.docx` deliverables—**with cryptographically verified zero outbound data egress**.

---

## 🏆 SIH 2026 Problem Statement Alignment

* **Problem Statement ID:** 26117
* **Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)
* **Title:** Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work
* **Category:** Software | **Theme:** Smart Automation

| Problem Statement Requirement | Citadel Implementation & Proof |
|---|---|
| **Air-Gapped Local Deployment** | Runs on a single workstation or server with a mid-range GPU. Completely functional with physical network cables detached and Wi-Fi disabled. |
| **Model Auto-Selection Across Tasks** | Dynamic task classification router (`models.yaml`) mapping incoming tasks to specialized open-weight models (Moondream for vision, Phi-3.5/Qwen-2.5 for reasoning, Python for math). |
| **End-to-End Agentic Task** | Multi-step reasoning pipeline with tool calling (`search_knowledge_base` ➔ `write_word_document`) that parses SOPs and produces a native, styled Microsoft Word (`.docx`) turnaround approval note. |
| **Sandboxed Code Execution** | Local isolated Python execution environment that runs computational scripts on sensor data (e.g., `Pump_Vibration_Data.csv`) without external network access. |
| **Multimodal Vision Understanding** | On-premise multimodal vision model (`moondream`) extracting checklist items and engineering observations from scanned documents and P&ID diagrams. |
| **Visible Network Telemetry Proof** | Real-time socket scanner (`psutil`) and UI telemetry bar proving `0 OUTBOUND EGRESS` and 100% local IPC loopback connections. |

---

## 🏛️ System Architecture

Citadel uses a micro-modular on-premise architecture consisting of three core layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CITADEL PRESENTATION TIER                        │
│                 React + Vite · Three.js Ambient Visuals                 │
├───────────────────┬─────────────────────────────┬───────────────────────┤
│   KNOWLEDGE PANE  │       WORKSPACE CANVAS      │   INTELLIGENCE HUB    │
│  "What it knows"  │     "What you are doing"    │  "What it is doing"   │
│  • ChromaDB Tree  │  • Query Bay & Deliverables │  • Agent Pipeline     │
│  • Document Spec  │  • Grounded Verified Answer │  • Citations & Sockets│
└───────────────────┴──────────────┬──────────────┴───────────────────────┘
                                   │ Local SSE Stream / REST
┌──────────────────────────────────▼──────────────────────────────────────┐
│                    CITADEL BACKEND & AGENT RUNTIME                      │
│                    FastAPI · Uvicorn · Python 3.11+                     │
├───────────────────────┬─────────────────────────┬───────────────────────┤
│    AGENT DISPATCHER   │     KNOWLEDGE ENGINE    │    SANDBOX RUNTIME    │
│  • ModelRouter        │  • ChromaDB Vector Store│  • Isolated Execution │
│  • AgentOrchestrator  │  • Document Registry    │  • Telemetry Scanner  │
│  • Tool Calling Loop  │  • OCR / Chunking Engine│  • 0-Egress Enforcer  │
└───────────────────────┴──────────┬──────────────┴───────────────────────┘
                                   │ Local IPC / Unix Sockets
┌──────────────────────────────────▼──────────────────────────────────────┐
│                  LOCAL MODEL INFERENCE (OLLAMA IPC)                     │
│  • Moondream (Vision)          • Phi-3.5 3.8B (Reasoning / Drafter)     │
│  • Qwen-2.5 Coder 3B (Python)  • Nomic-Embed-Text (Vector Embeddings)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. 🔀 Autonomous Task Routing & Model Auto-Selection
Citadel does not lock the enterprise to a single monolithic model. Configured via `models.yaml`, the system automatically selects the best local model for the job:
- **Vision Analyst (`moondream`):** Activated when an image, scan, or diagram attachment is detected.
- **Code Sandbox (`qwen2.5-coder:3b` / `python`):** Activated for statistical queries, telemetry processing, and scripts.
- **Document Drafter (`phi3.5:3.8b`):** Activated for knowledge synthesis, standard operating procedure compliance, and report generation.
- **Embedder (`nomic-embed-text`):** High-density vector embeddings stored in local ChromaDB.

### 2. 📝 Production Deliverable Generation (`.docx`)
Rather than outputting sterile chat messages, Citadel's agentic tools directly compile production-ready files:
- Calls `write_word_document` with strict typographic hierarchies (Title, Executive Summary, Actions, Sign-off blocks).
- Instant download available directly within the **Session Deliverables** bar.

### 3. 🧪 Isolated Computational Python Sandbox
For engineering calculations and sensor analysis:
- Spawns an isolated local execution environment.
- Automatically injects session uploads (e.g., CSV sensor data).
- Performs statistical aggregations, threshold evaluations, and variance calculations without cloud dependencies.

### 4. 👁️ Scanned Document & Engineering Vision
- Direct base64 image pipeline into on-premise vision models.
- Tuned with strict repeatability penalties (`repeat_penalty: 1.1`, `temperature: 0.1`) to eliminate model hallucination loops while accurately extracting tabular data, checklist statuses, and handwritten technician notes.

### 5. 🔒 Verified Sovereign Air-Gap Telemetry
- Real-time network socket monitor scanning active TCP/UDP connections via `psutil`.
- Enforces and displays verified `0 OUTBOUND EGRESS` directly in the persistent telemetry bar and network inspection modals.

---

## 📂 Project Structure

```
sih/
├── backend/                        # FastAPI Application
│   ├── app/
│   │   ├── agent/                 # Agent Orchestrator & Tool Loop
│   │   │   ├── orchestrator.py    # Multi-step Agent execution engine
│   │   │   ├── router.py          # Dynamic task-to-model router
│   │   │   ├── tools.py           # Native tool definitions (RAG, Word, Python sandbox)
│   │   │   ├── prompts.py         # System prompts & vision prompts
│   │   │   └── parser.py          # Structured tool-call streaming parser
│   │   ├── api/                   # REST API Endpoints
│   │   │   ├── documents.py       # Document upload, OCR & deletion
│   │   │   └── knowledge_base.py  # Document registry & search routes
│   │   ├── routers/               # WebSocket & SSE Streaming
│   │   │   ├── chat.py            # SSE token streaming & tool event dispatcher
│   │   │   ├── files.py           # Deliverable download & preview routes
│   │   │   ├── models.py          # Active model registry endpoints
│   │   │   └── network.py         # Air-gap network connection scanner
│   │   ├── services/              # Core Services
│   │   │   ├── ollama.py          # Async HTTP client for local Ollama IPC
│   │   │   ├── chroma.py          # Local ChromaDB vector database manager
│   │   │   ├── document_parser.py # PDF, DOCX, TXT, OCR extraction
│   │   │   └── rag/               # Chunking, vector indexing & registry
│   │   └── config.py              # Application settings & environment parsing
│   └── requirements.txt           # Python dependencies
│
├── frontend/                       # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/            # Reusable UI & Telemetry Components
│   │   │   ├── TopNav.jsx         # Header with Air-Gap indicator & persona switcher
│   │   │   ├── IntelligencePane.jsx# Real-time agent pipeline visualization
│   │   │   ├── KnowledgeTreePane.jsx# Left-hand hierarchical repository browser
│   │   │   ├── WireframeBall.jsx  # Interactive 3D Three.js rotating network sphere
│   │   │   └── FloatingLines.jsx  # WebGL background wave visual
│   │   ├── pages/                 # Primary Application Views
│   │   │   ├── Dashboard.jsx      # Operations launchpad, stats & telemetry
│   │   │   ├── Workspace.jsx      # Flagship 3-Pane Engineering Canvas
│   │   │   └── KnowledgeBase.jsx  # Document ingestion & inspector
│   │   └── services/              # API Client & SSE Stream listener
│   └── package.json
│
├── datasets/                       # Demonstration Datasets
│   ├── MRPL_SOP_402_Maintenance.txt# Sample plant maintenance SOP
│   ├── Pump_Vibration_Data.csv    # Industrial sensor vibration telemetry
│   └── engineering_inspection_scan_1788804054323.jpg # Sample scanned inspection form
│
├── docker/                         # Sandbox & Containerization Definitions
├── docker-compose.yml              # Local multi-service orchestration
└── models.yaml                     # Open-weight model catalog & routing rules
```

---

## 🚀 Getting Started

### Prerequisites
- **Operating System:** Linux, macOS, or Windows 10/11
- **Hardware:** Single workstation or server with 16GB+ RAM and a mid-range GPU (e.g., RTX 3060 / 4060 or better)
- **Runtimes:** Python 3.11+, Node.js 18+, and [Ollama](https://ollama.com/)

---

### Step 1: Install & Pull Local Models
Ensure Ollama is installed and running locally. Pull the required open-weight models:

```bash
# Vision Model for Scanned Documents & Diagrams
ollama pull moondream

# General Reasoning & Document Drafting Model
ollama pull phi3.5:3.8b

# Optional: Code Specialist Model
ollama pull qwen2.5-coder:3b

# Dense Vector Embedding Model
ollama pull nomic-embed-text
```

Verify models are available:
```bash
ollama list
```

---

### Step 2: Set Up & Run Backend

```bash
cd backend

# Create and activate a Python virtual environment
python -m venv .venv

# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend will start at: `http://localhost:8000`  
Swagger API Docs available at: `http://localhost:8000/docs`

---

### Step 3: Set Up & Run Frontend

In a new terminal window:

```bash
cd frontend

# Install node dependencies
npm install

# Start the Vite development server
npm run dev
```
Frontend will be live at: `http://localhost:5173`

---

### (Alternative) Single-Command Docker Deployment

You can also launch Citadel using Docker Compose:

```bash
docker-compose up --build
```

---

## 🧪 Demonstration Guide (SIH Evaluation Workflow)

To replicate the complete air-gap proof demonstration:

### 1. Verify Air-Gap Isolation
1. Disconnect your machine's Ethernet cable or turn **Wi-Fi OFF** / **Airplane Mode ON**.
2. Open your terminal and run `ping 8.8.8.8` to prove external network egress is physically blocked.
3. Open Citadel at `http://localhost:5173`. Look at the bottom telemetry bar: **`• SOVEREIGN OPERATIONAL MODE • AIR-GAPPED • 0 OUTBOUND EGRESS`**.

---

### 2. Task 1: Agentic Knowledge Retrieval & Word (.docx) Export
1. Navigate to **Knowledge Base** (`/kb`).
2. Upload `datasets/MRPL_SOP_402_Maintenance.txt`. The system chunks and indexes the SOP into local ChromaDB.
3. Navigate to **Workspace** (`/workspace`) and execute:
   ```text
   Draft an Executive Turnaround Approval Note based on the MRPL SOP-402 maintenance guidelines. Save it as a Word document.
   ```
4. **Result:** The Intelligence panel shows multi-step decomposition (`search_knowledge_base` ➔ `write_word_document`). A `.docx` deliverable appears in the deliverables bar for instant download.

---

### 3. Task 2: Sandboxed Python Code Execution on Sensor CSV
1. In the Workspace query bar, click the **Attachment (Paperclip)** icon and select `datasets/Pump_Vibration_Data.csv`.
2. Execute:
   ```text
   Analyze this pump vibration data using Python. Which pumps exceed the critical safety threshold?
   ```
3. **Result:** Citadel routes the task to the Code Agent, writes an isolated Python script, mounts the CSV, and outputs calculated mean/peak vibrations, flagging critical units (e.g., Pump 104 and 107) with mathematical precision.

---

### 4. Task 3: Multimodal Vision Understanding on Scanned Inspection Report
1. Click the **Attachment (Paperclip)** icon and select `datasets/engineering_inspection_scan_1788804054323.jpg`.
2. Execute:
   ```text
   Extract the key findings and maintenance checklist from this scanned inspection report.
   ```
3. **Result:** Citadel's router detects the image attachment, selects `moondream`, and extracts the checklist sections, equipment numbers, and technician observations locally without cloud vision APIs.

---

## 🛡️ Security & Privacy Architecture

- **No Remote Telemetry:** No analytics, crash reporters, or external telemetry libraries are packaged or executed.
- **Local IPC Socket Binding:** LLM requests are dispatched exclusively over loopback sockets (`127.0.0.1` / `localhost`).
- **Cryptographic Grounding:** Retrieved chunks are strictly cited with source filenames and page bounds before output rendering.
- **Physical Document Isolation:** Ingested files reside in local directory stores and ChromaDB partitions, fully wiped upon document purge requests.

---

## 👥 Engineering Team

Developed for the **Smart India Hackathon (SIH 2026)**:

* **Chaitanya** – Agent Systems & Multi-Model Orchestration
* **Mohak** – Agent Systems & Tool-Calling Pipeline
* **Aryan** – RAG Knowledge Systems & Vector Embeddings
* **Anwesha** – Frontend Architecture & Industrial UX
* **Vedant** – Infrastructure, Docker & Sandbox Isolation
* **Vardaan** – Research, Datasets & Technical Documentation

---

## 📜 License & Compliance

Designed for **Mangalore Refinery and Petrochemicals Limited (MRPL)** internal sovereign operations. Built entirely with permissive open-source frameworks (FastAPI, React, Ollama, ChromaDB).
