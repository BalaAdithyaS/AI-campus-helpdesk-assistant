from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class KnowledgeEntry(BaseModel):
    id: str
    title: str
    category: str
    content: str
    keywords: List[str]
    question_variants: List[str] = Field(default_factory=list, description="Paraphrased and natural query variants")
    synonyms: List[str] = Field(default_factory=list, description="Domain-specific synonyms")
    source_type: str
    source_name: str
    verified: bool = False
    last_updated: str

class SourceCitation(BaseModel):
    id: str
    title: str
    source_name: str
    source_type: str = "FAQ"
    excerpt: str
    relevance_score: float
    verified: bool = False

class RetrievalCandidateDiagnostic(BaseModel):
    id: str
    title: str
    content_snippet: Optional[str] = None
    lexical_score: float
    char_ngram_score: float = 0.0
    variant_score: float
    keyword_score: float
    combined_score: float
    intent_match: bool

class RetrievalDiagnostics(BaseModel):
    normalized_query: str
    total_records_loaded: int = 0
    total_records_indexed: int = 0
    retrieval_strategy: str
    detected_intent: Optional[str] = None
    context_resolved: bool = False
    resolved_entity: Optional[str] = None
    top_candidates: List[RetrievalCandidateDiagnostic] = Field(default_factory=list)
    evidence_validation_result: str
    fallback_reason: Optional[str] = None
    final_decision: str
    execution_time_ms: float = 0.0

class ChatContextTurn(BaseModel):
    role: str  # 'student' or 'assistant'
    text: str
    source_ids: Optional[List[str]] = None

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="The user's campus helpdesk query")
    session_id: Optional[str] = None
    context: Optional[List[ChatContextTurn]] = Field(default=None, description="Previous conversation turns for context resolution")

class ChatResponse(BaseModel):
    answer: str
    status: str = Field(
        ...,
        description="One of: 'answered', 'clarification_needed', 'insufficient_evidence', 'out_of_scope'"
    )
    sources: List[SourceCitation] = Field(default_factory=list)
    evidence_strength: str = Field(
        ...,
        description="One of: 'strong', 'moderate', 'weak', 'none'"
    )
    needs_clarification: bool = False
    clarification_prompt: Optional[str] = None
    execution_time_ms: float = 0.0
    query: str
    diagnostics: Optional[RetrievalDiagnostics] = None

class FeedbackRequest(BaseModel):
    query: str
    answer: str
    helpful: bool
    feedback_text: Optional[str] = None

class FeedbackResponse(BaseModel):
    status: str
    message: str

class EvaluationTestCase(BaseModel):
    id: str
    query: str
    category: str
    expected_behavior: str
    expected_status: str
    expected_source_id: Optional[str] = None
    paraphrase_group: Optional[str] = None
    pass_criteria: str

class EvaluationResult(BaseModel):
    test_id: str
    query: str
    category: str
    expected_status: str
    actual_status: str
    expected_source_id: Optional[str] = None
    actual_source_ids: List[str] = Field(default_factory=list)
    paraphrase_group: Optional[str] = None
    passed: bool
    top1_correct: bool = False
    answer: str
    evidence_strength: str
    sources: List[SourceCitation] = Field(default_factory=list)
    failure_reason: Optional[str] = None
    execution_time_ms: float = 0.0

class EvaluationSummary(BaseModel):
    total_tests: int
    tests_passed: int
    tests_failed: int
    pass_rate: float
    answerable_success_rate: float
    unsupported_rejection_rate: float
    citation_coverage: float
    paraphrase_consistency_rate: float
    top1_accuracy: float
    results: List[EvaluationResult]
    timestamp: str

class HealthStatus(BaseModel):
    status: str
    app_name: str
    version: str
    knowledge_base_entries: int
    categories: List[str]
    retrieval_ready: bool
