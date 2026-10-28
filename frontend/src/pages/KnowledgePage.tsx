import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Tag,
  ChevronDown,
  ChevronUp,
  Database
} from 'lucide-react';
import { KnowledgeEntry } from '../types';
import { getKnowledgeEntries, getKnowledgeCategories, getKnowledgeSourceTypes } from '../api/client';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';

export const KnowledgePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sourceTypes, setSourceTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [expandedId, setExpandedId] = useState<string | null>(initialQuery || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = async () => {
    try {
      const [catList, typeList] = await Promise.all([
        getKnowledgeCategories(),
        getKnowledgeSourceTypes()
      ]);
      setCategories(catList);
      setSourceTypes(typeList);
    } catch {
      // Non-blocking
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getKnowledgeEntries({
        query: searchQuery,
        category: selectedCategory,
        source_type: selectedSourceType
      });
      setEntries(data);
      if (initialQuery && data.some((e) => e.id === initialQuery)) {
        setExpandedId(initialQuery);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch knowledge base records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedSourceType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSourceType('all');
    setSearchParams({});
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 transition-colors duration-200">
      {/* Page Heading & Editorial Context */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-serif">
              Campus Knowledge Base Explorer
            </h2>
            <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Transparent repository of institutional guidelines, classroom directories, laboratory timings, and campus procedures. Each entry serves as the verifiable evidence source for the AI assistant.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {entries.length} Documents Available
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, buildings, departments, or procedures..."
              className="w-full pl-9 pr-3.5 py-2 text-xs md:text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-700 dark:focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <Filter className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium ml-2">
              <span>Source Type:</span>
            </div>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {sourceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedSourceType !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorBanner
          title="Failed to Load Knowledge Base"
          message={error}
          onRetry={loadData}
        />
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingIndicator message="Indexing knowledge base entries..." />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No Knowledge Entries Found"
          description="We couldn't find any campus documentation matching your search criteria. Try modifying your keywords or resetting filters."
          actionText="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        /* Entries List */
        <div className="space-y-3">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="p-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                        {entry.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {entry.id}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {entry.source_type}
                      </span>
                      {!entry.verified && (
                        <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded">
                          Synthetic Demo Data
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                      {entry.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 shrink-0 pt-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {isExpanded ? 'Collapse' : 'Details'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] mb-1">
                        Full Grounded Content:
                      </h4>
                      <div className="p-3 bg-white dark:bg-[#0B0F19] rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-[13px] font-serif whitespace-pre-line">
                        {entry.content}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Source Document & Authority:
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {entry.source_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Verification: {entry.verified ? 'Verified Institutional' : 'Curated Synthetic Prototype'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Indexed Retrieval Keywords:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {entry.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]"
                            >
                              <Tag className="w-2.5 h-2.5 text-blue-700 dark:text-blue-400" />
                              <span>{kw}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Question Variants Display */}
                    {entry.question_variants && entry.question_variants.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Trained Question Variants ({entry.question_variants.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.question_variants.map((qv, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-[11px]"
                            >
                              "{qv}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
                      <span>Last Updated: {entry.last_updated}</span>
                      <span>Format: Multi-Variant JSON Document</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
