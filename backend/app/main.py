from contextlib import asynccontextmanager
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings, ModelRegistry
from app.services.ollama import OllamaClient
from app.api.documents import router as documents_router
from app.api.knowledge_base import router as kb_router
from app.agent.router import ModelRouter
from app.agent.orchestrator import AgentOrchestrator, SessionManager
from app.routers import models as models_router
from app.routers import chat as chat_router

settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.settings = settings
    app.state.registry = ModelRegistry()
    app.state.ollama = OllamaClient(settings.ollama_base_url)
    app.state.model_router = ModelRouter(app.state.registry)
    app.state.session_manager = SessionManager(settings.sessions_dir)
    app.state.orchestrator = AgentOrchestrator(
        ollama=app.state.ollama,
        router=app.state.model_router,
        registry=app.state.registry,
        session_manager=app.state.session_manager,
        settings=settings,
    )
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

# F-30: Global exception handler — no stack traces reach the UI
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.debug:
        traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.debug else "Something went wrong. Please try again.",
            "retryable": True,
        },
    )

app.include_router(chat_router.router)
app.include_router(documents_router)
app.include_router(kb_router)
app.include_router(models_router.router)