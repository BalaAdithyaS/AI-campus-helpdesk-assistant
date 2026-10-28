import json
import logging
from pathlib import Path
from typing import List, Optional, Set
from backend.app.config import KB_FILE_PATH
from backend.app.models.schemas import KnowledgeEntry

logger = logging.getLogger(__name__)

class KnowledgeBaseService:
    def __init__(self, file_path: Path = KB_FILE_PATH):
        self.file_path = file_path
        self._entries: List[KnowledgeEntry] = []
        self._entries_by_id = {}
        self.load()

    def load(self) -> List[KnowledgeEntry]:
        """Loads and validates all records from the JSON knowledge base."""
        if not self.file_path.exists():
            logger.error(f"Knowledge base file not found at {self.file_path}")
            self._entries = []
            self._entries_by_id = {}
            return []

        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)

            valid_entries = []
            for item in raw_data:
                try:
                    entry = KnowledgeEntry(**item)
                    valid_entries.append(entry)
                except Exception as val_err:
                    logger.warning(f"Skipping malformed entry: {item.get('id', 'unknown')}: {val_err}")

            self._entries = valid_entries
            self._entries_by_id = {e.id: e for e in valid_entries}
            logger.info(f"Successfully loaded {len(self._entries)} entries from knowledge base.")
            return self._entries
        except Exception as e:
            logger.error(f"Error loading knowledge base: {e}")
            self._entries = []
            self._entries_by_id = {}
            return []

    def get_all(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        source_type: Optional[str] = None
    ) -> List[KnowledgeEntry]:
        """Filters entries by search query, category, and source_type."""
        results = self._entries
        if isinstance(category, str) and category.strip() and category.lower() != "all":
            results = [e for e in results if e.category.lower() == category.lower()]

        if isinstance(source_type, str) and source_type.strip() and source_type.lower() != "all":
            results = [e for e in results if e.source_type.lower() == source_type.lower()]

        if isinstance(query, str) and query.strip():
            q_norm = query.strip().lower()
            results = [
                e for e in results
                if q_norm in e.title.lower()
                or q_norm in e.content.lower()
                or any(q_norm in kw.lower() for kw in e.keywords)
                or q_norm in e.category.lower()
            ]

        return results

    def get_by_id(self, entry_id: str) -> Optional[KnowledgeEntry]:
        """Fetches a single entry by unique ID."""
        return self._entries_by_id.get(entry_id)

    def get_categories(self) -> List[str]:
        """Returns sorted unique categories."""
        return sorted(list(set(e.category for e in self._entries)))

    def get_source_types(self) -> List[str]:
        """Returns sorted unique source types."""
        return sorted(list(set(e.source_type for e in self._entries)))

    @property
    def count(self) -> int:
        return len(self._entries)

# Singleton instance
kb_service = KnowledgeBaseService()
