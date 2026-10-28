import pytest
from backend.app.services.retrieval import retrieval_engine

def test_query_normalization():
    q = "   Where is   room TT-305???  "
    norm = retrieval_engine.normalize_query(q)
    assert "room" in norm
    assert "305" in norm
    assert "tt" in norm

def test_retrieval_answerable_query():
    query = "Where can I find lecture hall TT 305?"
    citations, strength, score, diag = retrieval_engine.retrieve(query)
    assert len(citations) >= 1
    assert citations[0].id == "kb_nav_001"
    assert strength in ["moderate", "strong"]
    assert score >= 0.40
    assert diag is not None

def test_retrieval_insufficient_evidence():
    query = "What is the secret recipe for cafeteria butter chicken?"
    citations, strength, score, diag = retrieval_engine.retrieve(query)
    assert strength == "none"
    assert len(citations) == 0
    assert diag is not None

def test_excerpt_extraction():
    content = (
        "Technology Tower lecture halls are numbered by floor. "
        "Ground floor rooms are TT-101 through TT-120. "
        "Accessible ramps are located at the front."
    )
    excerpt = retrieval_engine._extract_excerpt("TT-101", content)
    assert "TT-101" in excerpt
