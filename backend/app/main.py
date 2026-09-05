from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, ModelRegistry
from app.services.ollama import OllamaClient
from app.config import Settings, ModelRegistry
from app.services.ollama import OllamaClient
from app.api.documents import router as documents_router
from app.api.knowledge_base import router as kb_router

settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.settings = settings
    app.state.registry = ModelRegistry()
    app.state.ollama = OllamaClient(settings.ollama_base_url)
    yield
    # Shutdown
    await app.state.ollama.close()

app = FastAPI(title="Citadel Workspace API", lifespan=lifespan)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production/air-gapped deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# TODO: Include routers here once implemented
# app.include_router(chat.router, prefix="/api")
# app.include_router(knowledge_base.router, prefix="/api")
# app.include_router(files.router, prefix="/api")
# app.include_router(network.router, prefix="/api")
# app.include_router(models.router, prefix="/api")
app.include_router(documents_router)
app.include_router(kb_router)