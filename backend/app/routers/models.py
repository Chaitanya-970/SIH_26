from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/api/models")
async def get_models(request: Request):
    registry = request.app.state.registry
    return {
        "models": registry.list_for_ui(),
        "default": "auto"
    }
