import {
  HealthStatus,
  KnowledgeEntry,
  EvaluationTestCase,
  EvaluationSummary,
  EvaluationResult,
  SourceCitation,
  RetrievalDiagnostics
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface ChatApiResponse {
  answer: string;
  status: 'answered' | 'clarification_needed' | 'insufficient_evidence' | 'out_of_scope';
  sources: SourceCitation[];
  evidence_strength: 'strong' | 'moderate' | 'weak' | 'none';
  needs_clarification: boolean;
  clarification_prompt?: string | null;
  execution_time_ms: number;
  query: string;
  diagnostics?: RetrievalDiagnostics;
}

export interface ChatContextPayload {
  role: string;
  text: string;
  source_ids?: string[];
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function sendChatMessage(
  query: string,
  context?: ChatContextPayload[]
): Promise<ChatApiResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      context: context && context.length > 0 ? context : null
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network communication failure' }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function sendFeedback(query: string, answer: string, helpful: boolean): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, answer, helpful })
  });
  if (!res.ok) {
    throw new Error('Failed to record feedback');
  }
  return res.json();
}

export async function getKnowledgeEntries(params?: {
  query?: string;
  category?: string;
  source_type?: string;
}): Promise<KnowledgeEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.append('query', params.query);
  if (params?.category && params.category !== 'all') searchParams.append('category', params.category);
  if (params?.source_type && params.source_type !== 'all') searchParams.append('source_type', params.source_type);

  const url = `${API_BASE_URL}/api/knowledge${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load knowledge entries: ${res.status}`);
  }
  return res.json();
}

export async function getKnowledgeCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/knowledge/categories`);
  if (!res.ok) return [];
  return res.json();
}

export async function getKnowledgeSourceTypes(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/knowledge/source-types`);
  if (!res.ok) return [];
  return res.json();
}

export async function getKnowledgeEntryById(id: string): Promise<KnowledgeEntry> {
  const res = await fetch(`${API_BASE_URL}/api/knowledge/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Knowledge entry '${id}' not found`);
  }
  return res.json();
}

export async function getEvaluationTests(): Promise<EvaluationTestCase[]> {
  const res = await fetch(`${API_BASE_URL}/api/evaluation/tests`);
  if (!res.ok) {
    throw new Error(`Failed to fetch evaluation tests: ${res.status}`);
  }
  return res.json();
}

export async function runEvaluationSuite(): Promise<EvaluationSummary> {
  const res = await fetch(`${API_BASE_URL}/api/evaluation/run`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Evaluation execution failed: ${res.status}`);
  }
  return res.json();
}

export async function runSingleEvaluationTest(testId: string): Promise<EvaluationResult> {
  const res = await fetch(`${API_BASE_URL}/api/evaluation/run/${encodeURIComponent(testId)}`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Test '${testId}' execution failed`);
  }
  return res.json();
}

export function getExportCsvUrl(): string {
  return `${API_BASE_URL}/api/evaluation/export-csv`;
}
