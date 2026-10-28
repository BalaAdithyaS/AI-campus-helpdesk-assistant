import pytest
from fastapi import HTTPException
from backend.app.api.knowledge import (
    list_knowledge_entries,
    list_categories,
    list_source_types,
    get_knowledge_entry
)

def test_list_all_knowledge_entries():
    entries = list_knowledge_entries()
    assert len(entries) >= 20
    first = entries[0]
    assert hasattr(first, "id")
    assert hasattr(first, "title")
    assert hasattr(first, "category")
    assert hasattr(first, "content")
    assert hasattr(first, "keywords")

def test_filter_by_category():
    entries = list_knowledge_entries(category="Classroom Locations")
    assert len(entries) >= 1
    for entry in entries:
        assert entry.category.lower() == "classroom locations".lower()

def test_search_knowledge_entries():
    entries = list_knowledge_entries(query="library")
    assert len(entries) >= 1
    found = any("library" in e.title.lower() or "library" in e.content.lower() for e in entries)
    assert found

def test_list_categories():
    categories = list_categories()
    assert len(categories) >= 5
    assert "Classroom Locations" in categories
    assert "Laboratory Schedules" in categories

def test_list_source_types():
    source_types = list_source_types()
    assert len(source_types) >= 3

def test_get_entry_by_id_success():
    entry = get_knowledge_entry("kb_nav_001")
    assert entry.id == "kb_nav_001"
    assert "Technology Tower" in entry.title

def test_get_entry_by_id_not_found():
    with pytest.raises(HTTPException) as exc_info:
        get_knowledge_entry("nonexistent_id_999")
    assert exc_info.value.status_code == 404
