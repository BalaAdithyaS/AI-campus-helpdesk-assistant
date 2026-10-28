import time
from fastapi import APIRouter, HTTPException, status
from backend.app.models.schemas import (
    ChatRequest,
    ChatResponse,
    FeedbackRequest,
    FeedbackResponse
)
from backend.app.services.evaluation import eval_service

router = APIRouter(prefix="/api", tags=["Chat"])

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Primary campus helpdesk chat endpoint.
    Performs input normalization, guardrail filtering, ambiguity checks,
    TF-IDF hybrid retrieval, and grounded answer synthesis.
    """
    clean_query = request.query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty or whitespace only."
        )

    if len(clean_query) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query length exceeds maximum allowed character limit (500)."
        )

    answer, chat_status, citations, evidence_strength, needs_clarification, clar_prompt, elapsed_ms, diagnostics = (
        eval_service.execute_query(clean_query, request.context)
    )

    return ChatResponse(
        answer=answer,
        status=chat_status,
        sources=citations,
        evidence_strength=evidence_strength,
        needs_clarification=needs_clarification,
        clarification_prompt=clar_prompt,
        execution_time_ms=elapsed_ms,
        query=clean_query,
        diagnostics=diagnostics
    )

@router.post("/feedback", response_model=FeedbackResponse)
def feedback_endpoint(feedback: FeedbackRequest):
    """Logs student feedback on answer helpfulness."""
    # In a production app this would persist to an analytics store.
    return FeedbackResponse(
        status="success",
        message="Thank you! Your feedback helps us continuously audit and improve campus documentation."
    )
