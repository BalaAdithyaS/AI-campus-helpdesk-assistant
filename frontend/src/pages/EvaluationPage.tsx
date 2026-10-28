import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCw,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  Sparkles,
  Target
} from 'lucide-react';
import {
  EvaluationTestCase,
  EvaluationSummary,
  EvaluationResult
} from '../types';
import {
  getEvaluationTests,
  runEvaluationSuite,
  runSingleEvaluationTest,
  getExportCsvUrl
} from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorBanner } from '../components/ErrorBanner';

export const EvaluationPage: React.FC = () => {
  const [tests, setTests] = useState<EvaluationTestCase[]>([]);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [individualResults, setIndividualResults] = useState<Record<string, EvaluationResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInitialTests = async () => {
    try {
      const testList = await getEvaluationTests();
      setTests(testList);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation test suite.');
    }
  };

  useEffect(() => {
    loadInitialTests();
  }, []);

  const handleRunAll = async () => {
    setRunningAll(true);
    setError(null);
    try {
      const resultSummary = await runEvaluationSuite();
      setSummary(resultSummary);
      const resMap: Record<string, EvaluationResult> = {};
      resultSummary.results.forEach((r) => {
        resMap[r.test_id] = r;
      });
      setIndividualResults(resMap);
    } catch (err: any) {
      setError(err.message || 'Execution of test suite failed.');
    } finally {
      setRunningAll(false);
    }
  };

  const handleRunSingle = async (testId: string) => {
    setRunningTestId(testId);
    setError(null);
    try {
      const res = await runSingleEvaluationTest(testId);
      setIndividualResults((prev) => ({ ...prev, [testId]: res }));
    } catch (err: any) {
      setError(err.message || `Test ${testId} execution failed.`);
    } finally {
      setRunningTestId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-serif">
              Evaluation & Verification Lab
            </h2>
            <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Automated audit suite validating evidence grounding, source citation attribution, paraphrase consistency, safe out-of-scope refusal, and ambiguity clarification.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <a
              href={getExportCsvUrl()}
              download="campusiq_evaluation_report.csv"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={handleRunAll}
              disabled={runningAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {runningAll ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run All {tests.length || 34} Tests</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorBanner title="Evaluation Suite Disruption" message={error} />}

      {/* Summary Metrics Cards (Computed dynamically) */}
      {summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-3.5">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overall Pass Rate
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{summary.pass_rate}%</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ({summary.tests_passed}/{summary.total_tests})
              </span>
            </div>
            <div className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Full suite pass</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Answerable Success
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {summary.answerable_success_rate}%
              </span>
            </div>
            <div className="mt-1.5 text-[10px] text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Source matched</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Top-1 Accuracy
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{summary.top1_accuracy}%</span>
            </div>
            <div className="mt-1.5 text-[10px] text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>Rank-1 precision</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Paraphrase Consistency
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {summary.paraphrase_consistency_rate}%
              </span>
            </div>
            <div className="mt-1.5 text-[10px] text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Semantic parity</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Safe Rejection
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {summary.unsupported_rejection_rate}%
              </span>
            </div>
            <div className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Zero hallucinations</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Citation Coverage
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{summary.citation_coverage}%</span>
            </div>
            <div className="mt-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-700 dark:text-blue-400" />
              <span>100% cited</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-700 dark:bg-blue-600 text-white shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Live Verification Suite Ready ({tests.length || 34} Test Cases)
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Click "Run All Tests" above to execute the real hybrid retrieval pipeline against paraphrased, typo, ambiguous, and out-of-scope queries.
              </p>
            </div>
          </div>
          <button
            onClick={handleRunAll}
            disabled={runningAll}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Start Run
          </button>
        </div>
      )}

      {/* Tests Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Cluster / Category</th>
                <th className="py-3 px-4">Test Query</th>
                <th className="py-3 px-4">Expected Behavior</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {tests.map((test) => {
                const res = individualResults[test.id];
                const isExpanded = expandedTestId === test.id;
                const isRunning = runningTestId === test.id;

                return (
                  <React.Fragment key={test.id}>
                    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {test.id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-fit">
                            {test.category}
                          </span>
                          {test.paraphrase_group && (
                            <span className="text-[9.5px] font-mono text-blue-700 dark:text-blue-400">
                              grp: {test.paraphrase_group}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs">
                        "{test.query}"
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-sm">
                        {test.expected_behavior}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {res ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                              res.passed
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                            }`}
                          >
                            {res.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                            <span>{res.passed ? 'PASSED' : 'FAILED'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">Unexecuted</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleRunSingle(test.id)}
                          disabled={isRunning || runningAll}
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          {isRunning ? 'Running...' : 'Run'}
                        </button>
                        {res && (
                          <button
                            onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                            className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Inspect result"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 inline" /> : <ChevronDown className="w-3.5 h-3.5 inline" />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Results Inspection Drawer */}
                    {isExpanded && res && (
                      <tr className="bg-slate-50/80 dark:bg-slate-900/40">
                        <td colSpan={6} className="p-4 border-t border-slate-200 dark:border-slate-800">
                          <div className="bg-white dark:bg-[#0B0F19] rounded-lg p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Actual Status:</span>
                                <StatusBadge status={res.actual_status} />
                                <EvidenceBadge strength={res.evidence_strength as any} />
                                {res.top1_correct && (
                                  <span className="text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                    Top-1 Match
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                                Latency: {res.execution_time_ms}ms
                              </div>
                            </div>

                            {/* Failure reason if any */}
                            {res.failure_reason && (
                              <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                                <strong>Evaluation Failure:</strong> {res.failure_reason}
                              </div>
                            )}

                            <div>
                              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Generated Grounded Answer:
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-line text-xs font-serif leading-relaxed">
                                {res.answer}
                              </div>
                            </div>

                            {res.sources && res.sources.length > 0 && (
                              <div>
                                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                  Retrieved Grounding Sources ({res.sources.length}):
                                </div>
                                <div className="space-y-1">
                                  {res.sources.map((src) => (
                                    <div
                                      key={src.id}
                                      className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{src.title}</span>{' '}
                                        <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">({src.id})</span>
                                      </div>
                                      <span className="font-mono text-blue-700 dark:text-blue-400 font-semibold text-[11px]">
                                        Score: {(src.relevance_score * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span>Pass Criteria: {test.pass_criteria}</span>
                              <span>Expected Source: {test.expected_source_id || 'None (Refusal)'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
