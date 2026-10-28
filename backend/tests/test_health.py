import pytest
from backend.app.api.health import get_health
from backend.app.main import root

def test_root_endpoint():
    res = root()
    assert res["status"] == "online"
    assert "service" in res

def test_health_endpoint():
    data = get_health()
    assert data.status == "healthy"
    assert data.knowledge_base_entries >= 20
    assert len(data.categories) >= 5
    assert data.retrieval_ready is True
