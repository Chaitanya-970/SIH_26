from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Citadel Workspace API")

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
