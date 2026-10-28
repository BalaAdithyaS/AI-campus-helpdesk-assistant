from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.app.models.schemas import KnowledgeEntry
from backend.app.services.knowledge_base import kb_service

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base"])

@router.get("", response_model=List[KnowledgeEntry])
def list_knowledge_entries(
    query: Optional[str] = Query(None, description="Search term for title, content, or keywords"),
    category: Optional[str] = Query(None, description="Category filter"),
    source_type: Optional[str] = Query(None, description="Source type filter")
):
    """Retrieves knowledge base records matching filter and search parameters."""
    return kb_service.get_all(query=query, category=category, source_type=source_type)

@router.get("/categories", response_model=List[str])
def list_categories():
    """Returns all unique categories present in the knowledge base."""
    return kb_service.get_categories()

@router.get("/source-types", response_model=List[str])
def list_source_types():
    """Returns all unique source types in the knowledge base."""
    return kb_service.get_source_types()

@router.get("/{entry_id}", response_model=KnowledgeEntry)
def get_knowledge_entry(entry_id: str):
    """Fetches full details of a specific knowledge entry by unique identifier."""
    entry = kb_service.get_by_id(entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge entry '{entry_id}' not found."
        )
    return entry
