import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import { SourceCitation as SourceCitationType } from '../types';

interface SourceCitationProps {
  citation: SourceCitationType;
  onViewInKnowledgeBase?: (id: string) => void;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ citation, onViewInKnowledgeBase }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 overflow-hidden text-left transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {citation.title}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <span>{citation.source_name}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                Score: {(citation.relevance_score * 100).toFixed(0)}%
              </span>
              {!citation.verified && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded font-sans">
                    Synthetic Demo
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {expanded ? 'Hide evidence' : 'Inspect excerpt'}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] space-y-2 text-xs">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              Retrieved Grounding Excerpt:
            </span>
            <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-2.5 rounded border border-slate-200/80 dark:border-slate-800 font-serif text-[13px]">
              "{citation.excerpt}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Source Record ID: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">{citation.id}</code>
            </span>
            {onViewInKnowledgeBase && (
              <button
                onClick={() => onViewInKnowledgeBase(citation.id)}
                className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1 hover:underline"
              >
                <span>View full document</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
