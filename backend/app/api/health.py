from fastapi import APIRouter
from backend.app.models.schemas import HealthStatus
from backend.app.services.knowledge_base import kb_service
from backend.app.services.retrieval import retrieval_engine

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthStatus)
def get_health():
    """Returns application health status, knowledge base statistics, and retrieval readiness."""
    categories = kb_service.get_categories()
    count = kb_service.count
    is_ready = retrieval_engine.doc_vectors is not None and count > 0

    return HealthStatus(
        status="healthy",
        app_name="VIT CampusIQ Helpdesk Engine",
        version="1.0.0",
        knowledge_base_entries=count,
        categories=categories,
        retrieval_ready=is_ready
    )
