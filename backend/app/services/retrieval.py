import re
import string
import logging
from typing import List, Tuple, Optional, Dict, Any, Set
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.config import (
    MIN_EVIDENCE_THRESHOLD,
    MODERATE_EVIDENCE_THRESHOLD,
    STRONG_EVIDENCE_THRESHOLD,
    MAX_SOURCES_RETURNED,
    MIN_QUERY_LENGTH,
    MAX_QUERY_LENGTH
)
from backend.app.models.schemas import (
    KnowledgeEntry,
    SourceCitation,
    RetrievalDiagnostics,
    RetrievalCandidateDiagnostic,
    ChatContextTurn
)
from backend.app.services.knowledge_base import kb_service

logger = logging.getLogger(__name__)

# Out-of-scope trigger patterns
OUT_OF_SCOPE_PATTERNS = [
    r"\b(capital of|president of|prime minister of|who is the king)\b",
    r"\b(write a poem|write code|write a script|quicksort|fibonacci|binary search)\b",
    r"\b(weather in|recipe for|bake a cake|how to cook)\b",
    r"\b(meaning of life|stock price|bitcoin|cryptocurrency)\b"
]

# Adversarial prompt injection or fabrication patterns
ADVERSARIAL_PATTERNS = [
    r"\b(ignore\s+(all\s+)?(previous\s+)?(rules|instructions|prompts))\b",
    r"\b(fabricate|invent|make up|hallucinate)\b",
    r"\b(personal\s+(mobile|phone|whatsapp)|private\s+number)\b",
    r"\b(system\s+prompt|jailbreak|bypass)\b"
]

# Common contraction expansions
CONTRACTIONS: Dict[str, str] = {
    r"\bhow'd\b": "how did",
    r"\bwhat's\b": "what is",
    r"\bwhere's\b": "where is",
    r"\bcan't\b": "cannot",
    r"\bdon't\b": "do not",
    r"\bi'm\b": "i am",
    r"\bi'd\b": "i would",
    r"\bhow's\b": "how is",
    r"\bthere's\b": "there is",
    r"\bwon't\b": "will not",
    r"\bit's\b": "it is",
    r"\bwho's\b": "who is"
}

# Common spelling mistakes and normalization
TYPO_CORRECTIONS: Dict[str, str] = {
    r"\bclasroom\b": "classroom",
    r"\bclasrooms\b": "classrooms",
    r"\btimngs\b": "timings",
    r"\btimimgs\b": "timings",
    r"\btimin\b": "timings",
    r"\bregester\b": "register",
    r"\bregestration\b": "registration",
    r"\bregistrtion\b": "registration",
    r"\bscedule\b": "schedule",
    r"\bskedule\b": "schedule",
    r"\bhostle\b": "hostel",
    r"\bhostal\b": "hostel",
    r"\boppening\b": "opening",
    r"\bloaction\b": "location",
    r"\blocaton\b": "location",
    r"\bsymposum\b": "symposium",
    r"\bhakathon\b": "hackathon",
    r"\bhackthon\b": "hackathon",
    r"\batendence\b": "attendance",
    r"\battendence\b": "attendance",
    r"\blibary\b": "library",
    r"\blibray\b": "library"
}

# Campus abbreviation expansions
CAMPUS_ABBREVIATIONS: Dict[str, str] = {
    r"\btt\b": "tt technology tower",
    r"\bsjt\b": "sjt silver jubilee tower",
    r"\bffcs\b": "ffcs course registration fully flexible credit system",
    r"\bcoe\b": "coe controller of examinations",
    r"\bod\b": "od on duty leave",
    r"\bsac\b": "sac student activity centre",
    r"\bcdc\b": "cdc career development center placement"
}

# Context-dependent ambiguous query definitions
AMBIGUOUS_PATTERNS: List[Dict[str, Any]] = [
    {
        "patterns": [
            r"^where\s+(should\s+i\s+go|do\s+i\s+go)(\s+tomorrow)?\??$",
            r"^where\s+to\s+go\??$",
            r"^find\s+my\s+way\??$"
        ],
        "category_context_key": "navigation",
        "clarification": "To guide you to the right campus location, could you specify what you are looking for—such as a specific lecture hall, computing laboratory, library facility, or an administrative office?"
    },
    {
        "patterns": [
            r"^(tell\s+me\s+about\s+)?(the\s+)?timings\??$",
            r"^what\s+are\s+the\s+timings\??$",
            r"^operating\s+hours\??$",
            r"^when\s+does\s+it\s+open\??$"
        ],
        "category_context_key": "timing",
        "clarification": "Multiple campus facilities operate on different schedules. Could you specify whether you need timings for the Central Library, computing laboratories, the sports gymnasium, or campus shuttle buses?"
    },
    {
        "patterns": [
            r"^where\s+is\s+the\s+lab\??$",
            r"^lab\s+location\??$",
            r"^how\s+to\s+reach\s+the\s+lab\??$"
        ],
        "category_context_key": "lab",
        "clarification": "We have distinct laboratory wings on campus. Are you looking for the Computing and Data Science Labs (Technology Tower, 3rd Floor) or the Electronics and Hardware Prototyping Labs (Silver Jubilee Tower, 4th Floor)?"
    },
    {
        "patterns": [
            r"^(how\s+to\s+|how\s+do\s+i\s+|how\s+can\s+i\s+)?(register|sign\s+up|enrol)\??$",
            r"^registration\s+process\??$",
            r"^how\s+do\s+i\s+apply\??$",
            r"^i\s+want\s+to\s+(register|sign\s+up|enrol)\??$"
        ],
        "category_context_key": "registration",
        "clarification": "What would you like to sign up for: the Annual Campus Hackathon/Technical Symposium, a Student Club/chapter, or Semester Course Registration (FFCS)?"
    },
    {
        "patterns": [
            r"^where\s+is\s+it\??$",
            r"^what\s+floor\s+is\s+it\s+on\??$",
            r"^which\s+floor\s+(is\s+it\s+on|is\s+it)\??$",
            r"^how\s+do\s+i\s+get\s+there\??$",
            r"^how\s+to\s+reach\s+there\??$"
        ],
        "category_context_key": "location_followup",
        "clarification": "Could you clarify which classroom, laboratory, or campus building you are trying to locate?"
    },
    {
        "patterns": [
            r"^(how\s+do\s+i\s+|can\s+i\s+|what\s+if\s+i\s+want\s+to\s+|what\s+about\s+)?cancel\s+(it|this)\??$",
            r"^cancellation\s+process\??$"
        ],
        "category_context_key": "cancellation",
        "clarification": "What would you like to cancel: an event registration, a course add/drop enrollment, or an approved hostel leave pass?"
    }
]

class HybridRetrievalEngine:
    def __init__(self):
        self.doc_vectorizer: Optional[TfidfVectorizer] = None
        self.char_vectorizer: Optional[TfidfVectorizer] = None
        self.variant_vectorizer: Optional[TfidfVectorizer] = None
        
        self.doc_vectors = None
        self.char_vectors = None
        
        # Flattened question variant index
        self.variant_entries_map: List[str] = []  # maps variant idx to entry id
        self.variant_vectors = None
        
        self.entries: List[KnowledgeEntry] = []
        self._build_index()

    def _build_index(self):
        """Builds multi-representation hybrid indices across all knowledge base records."""
        self.entries = kb_service.get_all()
        if not self.entries:
            logger.warning("No entries in knowledge base to index.")
            return

        corpus = []
        variant_texts = []
        self.variant_entries_map = []

        for entry in self.entries:
            # Multi-field enriched corpus representation
            kw_str = " ".join(entry.keywords)
            variants_str = " ".join(getattr(entry, "question_variants", []))
            synonyms_str = " ".join(getattr(entry, "synonyms", []))
            
            # Weighted repetition of high-value metadata
            enriched_text = (
                f"{entry.title} {entry.title} {entry.title} "
                f"{variants_str} {variants_str} "
                f"{synonyms_str} {synonyms_str} "
                f"{kw_str} {kw_str} "
                f"{entry.category} "
                f"{entry.content}"
            )
            corpus.append(enriched_text)

            # Build variant corpus
            for variant in getattr(entry, "question_variants", []):
                variant_texts.append(variant)
                self.variant_entries_map.append(entry.id)

        # 1. Word-level TF-IDF Vectorizer
        self.doc_vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True
        )
        self.doc_vectors = self.doc_vectorizer.fit_transform(corpus)

        # 2. Subword Character N-Gram Vectorizer (typographical & morphological resilience)
        self.char_vectorizer = TfidfVectorizer(
            lowercase=True,
            analyzer="char_wb",
            ngram_range=(3, 5),
            sublinear_tf=True
        )
        self.char_vectors = self.char_vectorizer.fit_transform(corpus)

        # 3. Question Variant Direct Matcher
        if variant_texts:
            self.variant_vectorizer = TfidfVectorizer(
                lowercase=True,
                stop_words="english",
                ngram_range=(1, 2),
                sublinear_tf=True
            )
            self.variant_vectors = self.variant_vectorizer.fit_transform(variant_texts)

        logger.info(f"Hybrid retrieval indices built: {len(self.entries)} entries, {len(variant_texts)} question variants.")

    def normalize_query(self, query: str) -> str:
        """
        Stage A: Advanced Query Normalization.
        Expands contractions, corrects common spelling mistakes, normalizes abbreviations,
        standardizes wi-fi/wifi, and preserves important identifiers and negations.
        """
        q = query.strip()
        q_lower = q.lower()

        # Expand contractions
        for pattern, replacement in CONTRACTIONS.items():
            q_lower = re.sub(pattern, replacement, q_lower)

        # Normalize wi-fi / wifi variations
        q_lower = re.sub(r"\bwi[- ]?fi\b", "wifi", q_lower)

        # Correct common campus typos
        for typo, fix in TYPO_CORRECTIONS.items():
            q_lower = re.sub(typo, fix, q_lower)

        # Expand campus abbreviations
        for abbr, full_text in CAMPUS_ABBREVIATIONS.items():
            q_lower = re.sub(abbr, full_text, q_lower)

        # Clean punctuation while keeping alphanumeric, hyphens for room codes (TT-305), and percent signs
        q_clean = re.sub(r"[^\w\s\-%]", " ", q_lower)
        return " ".join(q_clean.split())

    def check_adversarial(self, query: str) -> bool:
        """Detects prompt injection or attempts to fabricate private/personal info."""
        q_lower = query.lower()
        for pattern in ADVERSARIAL_PATTERNS:
            if re.search(pattern, q_lower):
                return True
        return False

    def check_out_of_scope(self, query: str) -> bool:
        """Detects queries clearly outside university campus domain."""
        q_lower = query.lower()
        for pattern in OUT_OF_SCOPE_PATTERNS:
            if re.search(pattern, q_lower):
                return True
        return False

    def detect_intent(self, norm_query: str) -> Optional[str]:
        """Stage B: Classifies common campus helpdesk intents."""
        q = norm_query.lower()
        if any(w in q for w in ["hackathon", "symposium", "tech fest", "competition", "participants list", "college event", "campus programme"]):
            return "event_registration"
        if any(w in q for w in ["club", "sac", "chapter", "audition", "cultural"]):
            return "club_recruitment"
        if any(w in q for w in ["classroom", "lecture hall", "find my class", "locate room", "tt 305", "sjt 401", "room number", "which building"]):
            return "classroom_navigation"
        if any(w in q for w in ["lab timing", "laboratory schedule", "computing lab", "computer lab", "electronics lab", "hardware lab"]):
            return "lab_schedule"
        if any(w in q for w in ["library", "borrow book", "renew book", "webopac", "reading room", "ieee", "sciencedirect"]):
            return "library_info"
        if any(w in q for w in ["lost id", "replace id", "smart card", "reissue", "rfid badge", "identification cell"]):
            return "id_card_procedure"
        if any(w in q for w in ["hostel leave", "outing", "curfew", "gate pass", "parent otp"]):
            return "hostel_rules"
        if any(w in q for w in ["wifi", "wireless internet", "ssid", "connect laptop", "captive portal", "mac address"]):
            return "wifi_access"
        if any(w in q for w in ["transcript", "gradesheet", "marksheet", "coe window", "official records"]):
            return "academic_transcripts"
        if any(w in q for w in ["ffcs", "course registration", "add drop", "credit limit", "minimum credits"]):
            return "course_registration"
        if any(w in q for w in ["75 percent", "attendance", "debar", "medical leave", "on duty"]):
            return "attendance_rules"
        if any(w in q for w in ["tuition", "fee payment", "late fine", "late fee", "due date"]):
            return "fee_payment"
        if any(w in q for w in ["shuttle bus", "green liner", "campus transport", "bus schedule"]):
            return "shuttle_bus"
        if any(w in q for w in ["gym", "gymnasium", "fitness", "badminton", "sports complex"]):
            return "sports_gym"
        if any(w in q for w in ["lost and found", "lost item", "misplaced wallet", "misplaced laptop", "security gatehouse"]):
            return "lost_and_found"
        if any(w in q for w in ["facility", "facilities", "amenit", "amenities", "campus infrastructure", "campus resources", "services and facilities", "available on campus", "university provide"]):
            return "campus_facilities"
        if any(w in q for w in ["cancel event", "cancellation", "withdraw", "deregister", "drop out", "cancel registration"]):
            return "event_cancellation"
        return None

    def resolve_context(
        self,
        query: str,
        context: Optional[List[ChatContextTurn]]
    ) -> Tuple[str, bool, Optional[str]]:
        """
        Stage C: Resolves context-dependent follow-up queries using previous turns.
        Returns: (augmented_query, was_resolved, resolved_entity)
        """
        if not context:
            return query, False, None

        q_lower = query.strip().lower()

        # Check if current query is a follow-up ("How do I sign up?", "Where is it?", "What time does it open?", "What floor is it on?", "What if I want to cancel it?")
        is_signup_followup = bool(re.search(r"\b(how\s+to\s+|how\s+do\s+i\s+|how\s+can\s+i\s+)?(sign\s+up|register|enrol|participate)(\s+for\s+(it|this))?\??$", q_lower))
        is_location_followup = bool(re.search(r"\b(where\s+is\s+(it|that|this)|what\s+floor\s+is\s+(it|that|this)\s+on|which\s+floor\s+(is\s+it\s+on|is\s+it|is\s+this)|how\s+to\s+reach\s+(there|it|this)|how\s+do\s+i\s+get\s+there)\??$", q_lower))
        is_timing_followup = bool(re.search(r"\b(what\s+are\s+the\s+timings|when\s+does\s+it\s+open|what\s+time\s+does\s+it\s+(close|open)|when\s+is\s+it\s+open)\??$", q_lower))
        is_cancel_followup = bool(re.search(r"\b(how\s+to\s+|what\s+if\s+i\s+want\s+to\s+|can\s+i\s+|how\s+do\s+i\s+|what\s+about\s+)?(cancel|withdraw|deregister)(\s+(it|my\s+registration|my\s+team))?\??$", q_lower))

        if not (is_signup_followup or is_location_followup or is_timing_followup or is_cancel_followup):
            return query, False, None

        # Look back through recent turns
        for turn in reversed(context):
            turn_text = turn.text.lower()
            source_ids = turn.source_ids or []

            if is_cancel_followup:
                if any(w in turn_text for w in ["hackathon", "symposium", "event", "registration"]) or "kb_evt_001" in source_ids or "kb_evt_003" in source_ids:
                    return f"{query} event registration cancellation team withdrawal policy", True, "event registration cancellation"

            if is_signup_followup:
                if "hackathon" in turn_text or "symposium" in turn_text or "kb_evt_001" in source_ids:
                    return f"{query} for the annual technical symposium hackathon", True, "hackathon event"
                if "club" in turn_text or "kb_evt_002" in source_ids:
                    return f"{query} for student clubs", True, "student clubs"
                if "course" in turn_text or "ffcs" in turn_text or "kb_acad_001" in source_ids:
                    return f"{query} for ffcs semester courses", True, "FFCS course registration"

            if is_location_followup:
                room_match = re.search(r"\b(tt\s*\d+|sjt\s*\d+|gdn\s*\d+|mb\s*\d+)\b", turn_text)
                room_tag = f" {room_match.group(1)}" if room_match else ""
                if "technology tower" in turn_text or "tt" in turn_text or "kb_nav_001" in source_ids:
                    return f"{query} Technology Tower TT block{room_tag}", True, f"Technology Tower{room_tag}"
                if "silver jubilee" in turn_text or "sjt" in turn_text or "kb_nav_002" in source_ids:
                    return f"{query} Silver Jubilee Tower SJT{room_tag}", True, f"Silver Jubilee Tower{room_tag}"
                if "library" in turn_text or "kb_lib_001" in source_ids:
                    return f"{query} Central Library", True, "Central Library"

            if is_timing_followup:
                if "computer" in turn_text or "data science" in turn_text or "kb_lab_001" in source_ids:
                    return f"{query} computing laboratory hours", True, "Computing Lab"
                if "library" in turn_text or "kb_lib_001" in source_ids:
                    return f"{query} Central Library timings", True, "Central Library"
                if "gym" in turn_text or "sports" in turn_text or "kb_nav_005" in source_ids:
                    return f"{query} Gymnasium sports complex hours", True, "Gymnasium"

        return query, False, None

    def check_ambiguity(
        self,
        query: str,
        context: Optional[List[ChatContextTurn]] = None
    ) -> Optional[str]:
        """Detects underspecified queries that have no resolving context."""
        q_lower = query.strip().lower()
        for rule in AMBIGUOUS_PATTERNS:
            for pat in rule["patterns"]:
                if re.search(pat, q_lower):
                    # Check if context can resolve it
                    _, resolved, _ = self.resolve_context(query, context)
                    if not resolved:
                        return rule["clarification"]
        return None

    def _extract_excerpt(self, query: str, content: str) -> str:
        """Extracts the 1-2 most informative sentences matching query keywords."""
        sentences = re.split(r"(?<=[.!?])\s+", content)
        if not sentences:
            return content[:200]

        norm_q = self.normalize_query(query)
        q_tokens = set(re.findall(r"\w+", norm_q.lower()))
        stopwords = {"what", "is", "the", "are", "how", "do", "i", "can", "where", "a", "an", "for", "to", "in", "of"}
        meaningful_tokens = q_tokens - stopwords

        if not meaningful_tokens:
            return sentences[0]

        scored_sentences = []
        for s in sentences:
            s_tokens = set(re.findall(r"\w+", s.lower()))
            overlap = len(meaningful_tokens & s_tokens)
            scored_sentences.append((overlap, s))

        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        top_sentences = [s for score, s in scored_sentences[:2] if score > 0]
        if top_sentences:
            return " ".join(top_sentences)
        return sentences[0]

    def _score_variants(self, norm_query: str) -> Dict[str, float]:
        """Computes max similarity between query and each entry's question variants."""
        scores: Dict[str, float] = {e.id: 0.0 for e in self.entries}
        if self.variant_vectorizer is None or self.variant_vectors is None or not self.variant_entries_map:
            return scores

        try:
            q_vec = self.variant_vectorizer.transform([norm_query])
            sims = cosine_similarity(q_vec, self.variant_vectors).flatten()
            for idx, sim in enumerate(sims):
                entry_id = self.variant_entries_map[idx]
                if sim > scores[entry_id]:
                    scores[entry_id] = float(sim)
        except Exception as e:
            logger.error(f"Variant scoring failed: {e}")

        return scores

    def _keyword_and_synonym_score(self, norm_query: str, entry: KnowledgeEntry) -> float:
        """Calculates keyword, synonym, and entity overlap bonuses."""
        q_tokens = set(re.findall(r"\w+", norm_query.lower()))
        score = 0.0

        # Synonyms
        for syn in getattr(entry, "synonyms", []):
            syn_tokens = set(re.findall(r"\w+", syn.lower()))
            if syn_tokens and syn_tokens.issubset(q_tokens):
                score += 0.40
            elif any(t in q_tokens for t in syn_tokens):
                score += 0.20

        # Keywords
        for kw in entry.keywords:
            kw_tokens = set(re.findall(r"\w+", kw.lower()))
            if kw_tokens and kw_tokens.issubset(q_tokens):
                score += 0.35
            elif any(t in q_tokens for t in kw_tokens):
                score += 0.15

        # Acronyms & Identifiers (TT, SJT, FFCS, COE, OD, TT-305, etc.)
        acronyms = ["tt", "sjt", "ffcs", "coe", "od", "wifi", "sac", "ieee", "rfid"]
        for acr in acronyms:
            if acr in q_tokens:
                entry_text = f"{entry.title} {entry.content} {' '.join(entry.keywords)}".lower()
                if acr in entry_text:
                    score += 0.35

        # Room codes (e.g. 305, 401, 101)
        numbers = re.findall(r"\b\d{3}\b", norm_query)
        for num in numbers:
            if num in entry.title or num in entry.content:
                score += 0.45

        # Title token overlap
        title_tokens = set(re.findall(r"\w+", entry.title.lower())) - {"and", "the", "for", "of", "in", "a", "to", "or"}
        if title_tokens:
            overlap = len(title_tokens & q_tokens) / len(title_tokens)
            score += overlap * 0.40

        # Cross-domain synonyms
        if any(w in q_tokens for w in ["facility", "facilities", "amenity", "amenities", "services", "infrastructure"]) and ("facilities" in entry.title.lower() or "facilities" in entry.category.lower()):
            score += 0.40
        if any(w in q_tokens for w in ["cancel", "cancellation", "withdraw", "deregister", "drop"]) and ("cancellation" in entry.title.lower() or "cancellation" in " ".join(entry.keywords)):
            score += 0.40

        return min(1.0, score)

    def retrieve(
        self,
        query: str,
        context: Optional[List[ChatContextTurn]] = None
    ) -> Tuple[List[SourceCitation], str, float, RetrievalDiagnostics]:
        """
        Full 6-Stage Hybrid Retrieval Pipeline:
        Stage A: Normalization
        Stage B: Intent Detection
        Stage C: Context Resolution
        Stage D: Multi-Representation Scoring (Word TF-IDF, Subword Char N-grams, Question Variants, Synonyms)
        Stage E: Hybrid Ranking & Conflict Penalties
        Stage F: Evidence Validation & Diagnostics
        """
        if not self.entries or self.doc_vectorizer is None or self.doc_vectors is None:
            self._build_index()
            if not self.entries:
                diag = RetrievalDiagnostics(
                    normalized_query=query,
                    retrieval_strategy="uninitialized",
                    evidence_validation_result="No knowledge base index available",
                    final_decision="insufficient_evidence"
                )
                return [], "none", 0.0, diag

        # Stage A & C: Normalization and Context Resolution
        norm_query = self.normalize_query(query)
        augmented_query, context_resolved, resolved_entity = self.resolve_context(norm_query, context)
        detected_intent = self.detect_intent(augmented_query)

        # Stage D: Multi-representation vector similarities
        try:
            q_word_vec = self.doc_vectorizer.transform([augmented_query])
            word_sims = cosine_similarity(q_word_vec, self.doc_vectors).flatten()
        except Exception:
            word_sims = np.zeros(len(self.entries))

        try:
            q_char_vec = self.char_vectorizer.transform([augmented_query])
            char_sims = cosine_similarity(q_char_vec, self.char_vectors).flatten()
        except Exception:
            char_sims = np.zeros(len(self.entries))

        variant_scores = self._score_variants(augmented_query)

        # Stage E: Hybrid Ranking
        scored_candidates = []
        diagnostics_candidates: List[RetrievalCandidateDiagnostic] = []

        for idx, entry in enumerate(self.entries):
            w_score = float(word_sims[idx])
            c_score = float(char_sims[idx])
            v_score = float(variant_scores.get(entry.id, 0.0))
            kw_score = self._keyword_and_synonym_score(augmented_query, entry)

            # Intent compatibility bonus or penalty
            intent_match = False
            intent_boost = 0.0
            if detected_intent:
                category_lower = entry.category.lower()
                title_lower = entry.title.lower()

                if detected_intent == "event_registration" and ("event" in category_lower or "hackathon" in title_lower):
                    intent_boost = 0.35
                    intent_match = True
                elif detected_intent == "classroom_navigation" and "classroom" in category_lower:
                    intent_boost = 0.35
                    intent_match = True
                elif detected_intent == "lab_schedule" and "laboratory" in category_lower:
                    intent_boost = 0.35
                    intent_match = True
                elif detected_intent == "library_info" and "library" in category_lower:
                    intent_boost = 0.35
                    intent_match = True
                elif detected_intent == "id_card_procedure" and "id card" in title_lower:
                    intent_boost = 0.35
                    intent_match = True
                elif detected_intent == "wifi_access" and "wi-fi" in title_lower:
                    intent_boost = 0.35
                    intent_match = True
                elif detected_intent == "sports_gym" and "sports" in category_lower:
                    intent_boost = 0.35
                    intent_match = True
                elif detected_intent == "campus_facilities" and ("facilities" in category_lower or "kb_fac_001" == entry.id):
                    intent_boost = 0.40
                    intent_match = True
                elif detected_intent == "event_cancellation" and ("cancellation" in title_lower or "kb_evt_003" == entry.id):
                    intent_boost = 0.40
                    intent_match = True

            # Hybrid score composition:
            # 35% Question Variant direct match
            # 25% Word TF-IDF
            # 15% Char N-Gram subword match (typo & stem resilience)
            # 15% Keyword & Synonym overlap
            # 10% Intent boost
            combined = (0.35 * v_score) + (0.25 * w_score) + (0.15 * c_score) + (0.15 * kw_score) + (0.10 * intent_boost)
            
            # Boost if genuine variant alignment is supported by either keyword overlap or intent match
            if v_score >= 0.40 and (intent_match or kw_score >= 0.25 or w_score >= 0.25):
                combined += 0.10
            elif (not intent_match) and kw_score == 0.0 and w_score < 0.15 and v_score < 0.20 and c_score < 0.15:
                # Syntactic frame match without entity grounding (e.g. asking about unsupported 'robotics' in a computing lab)
                combined *= 0.50

            combined_score = round(min(1.0, float(combined)), 4)

            scored_candidates.append((combined_score, entry, w_score, v_score, kw_score, c_score, intent_match))

        # Sort descending by combined score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        # Build candidate diagnostics for top 5 (as required by Section 8 & 9)
        for score, entry, w_sc, v_sc, kw_sc, c_sc, int_match in scored_candidates[:5]:
            snippet = re.sub(r"\[Synthetic demonstration record[^\]]*\]", "", entry.content).strip()[:140] + "..."
            diagnostics_candidates.append(
                RetrievalCandidateDiagnostic(
                    id=entry.id,
                    title=entry.title,
                    content_snippet=snippet,
                    lexical_score=round(w_sc, 3),
                    char_ngram_score=round(c_sc, 3),
                    variant_score=round(v_sc, 3),
                    keyword_score=round(kw_sc, 3),
                    combined_score=round(score, 3),
                    intent_match=int_match
                )
            )

        top_score = scored_candidates[0][0] if scored_candidates else 0.0

        # Stage F: Evidence Validation
        valid_candidates = [
            (cand[0], cand[1]) for cand in scored_candidates
            if cand[0] >= MIN_EVIDENCE_THRESHOLD
        ][:MAX_SOURCES_RETURNED]

        citations: List[SourceCitation] = []
        for score, entry in valid_candidates:
            excerpt = self._extract_excerpt(augmented_query, entry.content)
            citations.append(
                SourceCitation(
                    id=entry.id,
                    title=entry.title,
                    source_name=entry.source_name,
                    source_type=entry.source_type,
                    excerpt=excerpt,
                    relevance_score=score,
                    verified=entry.verified
                )
            )

        if not citations or top_score < MIN_EVIDENCE_THRESHOLD:
            evidence_strength = "none"
            final_decision = "insufficient_evidence"
            validation_result = f"Top retrieval score ({top_score}) below required threshold ({MIN_EVIDENCE_THRESHOLD}). Abstaining."
        elif top_score < MODERATE_EVIDENCE_THRESHOLD:
            evidence_strength = "weak"
            final_decision = "answered"
            validation_result = f"Evidence passes minimum threshold ({top_score}). Citing supporting excerpt."
        elif top_score < STRONG_EVIDENCE_THRESHOLD:
            evidence_strength = "moderate"
            final_decision = "answered"
            validation_result = f"Moderate evidence confidence ({top_score}) supported by multi-field alignment."
        else:
            evidence_strength = "strong"
            final_decision = "answered"
            validation_result = f"Strong evidence grounding ({top_score}) matching question variants and document authority."

        diagnostics = RetrievalDiagnostics(
            normalized_query=augmented_query,
            total_records_loaded=len(self.entries),
            total_records_indexed=len(self.entries),
            retrieval_strategy="Hybrid (Multi-Variant TF-IDF + Char N-Grams + Synonym Expansion + Context)",
            detected_intent=detected_intent,
            context_resolved=context_resolved,
            resolved_entity=resolved_entity,
            top_candidates=diagnostics_candidates,
            evidence_validation_result=validation_result,
            fallback_reason=validation_result if final_decision != "answered" else None,
            final_decision=final_decision
        )

        return citations, evidence_strength, top_score, diagnostics

    def rebuild_index(self):
        """Forces a reload from disk and rebuilds indices."""
        kb_service.load()
        self._build_index()

# Singleton instance
retrieval_engine = HybridRetrievalEngine()
