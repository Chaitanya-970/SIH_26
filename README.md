# CITADEL WORKSPACE

CITADEL WORKSPACE is a sovereign, air-gapped agentic AI workbench that runs entirely on an organization's own hardware. It uses open-weight multimodal LLMs to handle confidential industrial knowledge work without any data ever leaving the premises.

## Project Structure

- `frontend/`: React + Vite single-page application
- `backend/`: FastAPI backend handling model routing, agent logic, and RAG
- `docker/`: Docker configurations for the code execution sandbox
- `data/`: Local storage for the knowledge base, ChromaDB, and session files
- `docs/`: Product Requirements Document (PRD) and architecture specifications

## Getting Started

1. Ensure Ollama is installed and running locally with the required models.
2. Review `models.yaml` to configure available models.
3. Start the application:
   ```bash
   docker-compose up --build
   ```

## Requirements

- Python 3.11+
- Node.js 18+ (for local frontend development)
- Docker Desktop / Engine
- Ollama
