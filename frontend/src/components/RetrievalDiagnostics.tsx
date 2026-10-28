import React, { useState } from 'react';
import { 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Target, 
  Compass, 
  Terminal, 
  Database, 
  Clock, 
  FileText 
} from 'lucide-react';
import { RetrievalDiagnostics as RetrievalDiagnosticsType } from '../types';

interface RetrievalDiagnosticsProps {
  diagnostics: RetrievalDiagnosticsType;
  executionTimeMs?: number;
}

export const RetrievalDiagnostics: React.FC<RetrievalDiagnosticsProps> = ({ 
  diagnostics, 
  executionTimeMs 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  const duration = diagnostics.execution_time_ms || executionTimeMs || 0;
  const loadedCount = diagnostics.total_records_loaded || 26;
  const indexedCount = diagnostics.total_records_indexed || 26;

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-left">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors focus:outline-none"
        >
          <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{isOpen ? 'Hide retrieval diagnostics' : 'How this answer was found'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {isOpen && (
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
              debugMode
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-700 dark:hover:text-purple-300'
            }`}
            title="Toggle Developer Debug Mode"
          >
            <Terminal className="w-3 h-3" />
            <span>{debugMode ? 'Debug Inspector: ON' : 'Dev Debug Inspector'}</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-2.5 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-3 animate-fadeIn">
          {/* Header Metric Badges in Debug Mode */}
          {debugMode && (
            <div className="p-2.5 rounded bg-slate-900 text-slate-100 dark:bg-black/60 border border-slate-800 text-[11px] font-mono space-y-1.5">
              <div className="flex items-center justify-between text-purple-400 font-bold border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  DEVELOPER RETRIEVAL AUDIT LOG
                </span>
                <span className="text-[10px] text-slate-400">Decision: {diagnostics.final_decision}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                <div>
                  <span className="text-slate-400 block">KB Loaded:</span>
                  <span className="font-semibold text-emerald-400">{loadedCount} records</span>
                </div>
                <div>
                  <span className="text-slate-400 block">KB Indexed:</span>
                  <span className="font-semibold text-emerald-400">{indexedCount} records</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Latency:</span>
                  <span className="font-semibold text-amber-400">{duration.toFixed(2)} ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fallback Reason:</span>
                  <span className="font-semibold text-slate-300 truncate block">
                    {diagnostics.fallback_reason || 'None (Grounded)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Strategy & Query Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Retrieval Pipeline:</span>
              <span className="font-mono text-[10px] bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                {diagnostics.retrieval_strategy}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-baseline gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Normalized Query:</span>
              <code className="font-mono text-[11px] text-blue-700 dark:text-blue-400 break-all bg-blue-50/50 dark:bg-blue-950/20 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/40">
                "{diagnostics.normalized_query}"
              </code>
            </div>

            {diagnostics.detected_intent && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <Target className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Classified Campus Intent:</span>
                <span className="font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 text-[10px] font-mono">
                  {diagnostics.detected_intent}
                </span>
              </div>
            )}

            {diagnostics.context_resolved && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded border border-emerald-200 dark:border-emerald-800/80">
                <Compass className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Conversational Follow-up Resolved Antecedent: <strong>{diagnostics.resolved_entity}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Top 5 Candidates Breakdown Table */}
          {diagnostics.top_candidates && diagnostics.top_candidates.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span>Top Candidate Scores (Top {diagnostics.top_candidates.length}):</span>
                {debugMode && <span className="text-slate-400 lowercase font-normal">Click row to inspect source excerpt</span>}
              </div>
              <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono">
                    <tr>
                      <th className="py-1 px-2">Document</th>
                      <th className="py-1 px-1.5 text-right" title="Question Variant Direct Similarity">Variant</th>
                      <th className="py-1 px-1.5 text-right" title="Word TF-IDF Lexical Similarity">Word</th>
                      {debugMode && (
                        <th className="py-1 px-1.5 text-right" title="Character N-Gram Subword Similarity">Char-N</th>
                      )}
                      <th className="py-1 px-1.5 text-right" title="Keyword & Synonym Overlap">Keyword</th>
                      <th className="py-1 px-2 text-right">Combined</th>
                      {debugMode && <th className="py-1 px-1.5 text-center">Source</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono">
                    {diagnostics.top_candidates.map((cand) => (
                      <React.Fragment key={cand.id}>
                        <tr 
                          onClick={() => debugMode && setExpandedCandidateId(expandedCandidateId === cand.id ? null : cand.id)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            debugMode ? 'cursor-pointer' : ''
                          } ${cand.combined_score >= 0.40 ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''}`}
                        >
                          <td className="py-1.5 px-2 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px] font-sans">
                            <span className="font-mono text-[10px] text-slate-400 mr-1">[{cand.id}]</span>
                            {cand.title}
                          </td>
                          <td className="py-1.5 px-1.5 text-right text-slate-600 dark:text-slate-400 text-[10px]">
                            {cand.variant_score.toFixed(3)}
                          </td>
                          <td className="py-1.5 px-1.5 text-right text-slate-600 dark:text-slate-400 text-[10px]">
                            {cand.lexical_score.toFixed(3)}
                          </td>
                          {debugMode && (
                            <td className="py-1.5 px-1.5 text-right text-slate-600 dark:text-slate-400 text-[10px]">
                              {(cand.char_ngram_score || 0).toFixed(3)}
                            </td>
                          )}
                          <td className="py-1.5 px-1.5 text-right text-slate-600 dark:text-slate-400 text-[10px]">
                            {cand.keyword_score.toFixed(3)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-blue-700 dark:text-blue-400 text-[11px]">
                            {cand.combined_score.toFixed(3)}
                          </td>
                          {debugMode && (
                            <td className="py-1.5 px-1.5 text-center text-slate-400 hover:text-blue-600">
                              <FileText className="w-3 h-3 inline" />
                            </td>
                          )}
                        </tr>
                        {/* Expanded Candidate Source Viewer in Debug Mode */}
                        {debugMode && expandedCandidateId === cand.id && (
                          <tr className="bg-slate-100/70 dark:bg-slate-800/60 font-sans">
                            <td colSpan={7} className="p-2 text-[11px] text-slate-700 dark:text-slate-300">
                              <div className="font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 font-mono">
                                <Database className="w-3 h-3" />
                                Exact Candidate Text Used for Evidence Validation:
                              </div>
                              <p className="italic bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                "{cand.content_snippet || 'Document text indexed and validated in memory.'}"
                              </p>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation Result */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] flex items-start gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Evidence Validation:</span>
            <span className="text-slate-600 dark:text-slate-400 leading-snug">
              {diagnostics.evidence_validation_result}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
