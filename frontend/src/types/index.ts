export interface SourceCitation {
  id: string;
  title: string;
  source_name: string;
  source_type: string;
  excerpt: string;
  relevance_score: number;
  verified: boolean;
}

export interface RetrievalCandidateDiagnostic {
  id: string;
  title: string;
  content_snippet?: string | null;
  lexical_score: number;
  char_ngram_score?: number;
  variant_score: number;
  keyword_score: number;
  combined_score: number;
  intent_match: boolean;
}

export interface RetrievalDiagnostics {
  normalized_query: string;
  total_records_loaded?: number;
  total_records_indexed?: number;
  retrieval_strategy: string;
  detected_intent?: string | null;
  context_resolved: boolean;
  resolved_entity?: string | null;
  top_candidates: RetrievalCandidateDiagnostic[];
  evidence_validation_result: string;
  fallback_reason?: string | null;
  final_decision: string;
  execution_time_ms?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'assistant';
  text: string;
  timestamp: string;
  status?: 'answered' | 'clarification_needed' | 'insufficient_evidence' | 'out_of_scope' | 'error';
  sources?: SourceCitation[];
  evidence_strength?: 'strong' | 'moderate' | 'weak' | 'none';
  needs_clarification?: boolean;
  execution_time_ms?: number;
  diagnostics?: RetrievalDiagnostics;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  question_variants?: string[];
  synonyms?: string[];
  source_type: string;
  source_name: string;
  verified: boolean;
  last_updated: string;
}

export interface EvaluationTestCase {
  id: string;
  query: string;
  category: string;
  expected_behavior: string;
  expected_status: string;
  expected_source_id: string | null;
  paraphrase_group?: string | null;
  pass_criteria: string;
}

export interface EvaluationResult {
  test_id: string;
  query: string;
  category: string;
  expected_status: string;
  actual_status: string;
  expected_source_id: string | null;
  actual_source_ids: string[];
  paraphrase_group?: string | null;
  passed: boolean;
  top1_correct: boolean;
  answer: string;
  evidence_strength: string;
  sources: SourceCitation[];
  failure_reason: string | null;
  execution_time_ms: number;
}

export interface EvaluationSummary {
  total_tests: number;
  tests_passed: number;
  tests_failed: number;
  pass_rate: number;
  answerable_success_rate: number;
  unsupported_rejection_rate: number;
  citation_coverage: number;
  paraphrase_consistency_rate: number;
  top1_accuracy: number;
  results: EvaluationResult[];
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  knowledge_base_entries: number;
  categories: string[];
  retrieval_ready: boolean;
}
