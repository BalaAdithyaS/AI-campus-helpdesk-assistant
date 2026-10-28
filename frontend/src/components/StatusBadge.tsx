import React from 'react';
import { CheckCircle2, HelpCircle, XCircle, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  status: 'answered' | 'clarification_needed' | 'insufficient_evidence' | 'out_of_scope' | 'error' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'answered':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Answered</span>
        </span>
      );
    case 'clarification_needed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Clarification Needed</span>
        </span>
      );
    case 'insufficient_evidence':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          <AlertOctagon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          <span>Insufficient Evidence</span>
        </span>
      );
    case 'out_of_scope':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Out of Scope</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {status}
        </span>
      );
  }
};
