import pytest
from fastapi import HTTPException
from backend.app.api.chat import chat_endpoint, feedback_endpoint
from backend.app.models.schemas import ChatRequest, FeedbackRequest

def test_chat_valid_answerable_query():
    req = ChatRequest(query="What are the computing lab timings?")
    res = chat_endpoint(req)
    assert res.status == "answered"
    assert len(res.sources) >= 1
    assert res.sources[0].id == "kb_lab_001"
    assert res.evidence_strength in ["moderate", "strong"]
    assert "08:30 AM" in res.answer or "computing" in res.answer.lower()

def test_chat_empty_query_rejected():
    with pytest.raises(HTTPException) as exc_info:
        chat_endpoint(ChatRequest(query="   "))
    assert exc_info.value.status_code == 400

def test_chat_excessive_length_rejected():
    long_q = "help " * 150
    with pytest.raises((HTTPException, ValueError)):
        chat_endpoint(ChatRequest(query=long_q))

def test_chat_feedback():
    req = FeedbackRequest(
        query="Where is TT-301?",
        answer="TT is technology tower",
        helpful=True
    )
    res = feedback_endpoint(req)
    assert res.status == "success"
    assert "feedback" in res.message.lower()
