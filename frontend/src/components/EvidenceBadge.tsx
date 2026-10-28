import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, AlertTriangle } from 'lucide-react';

interface EvidenceBadgeProps {
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  score?: number;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ strength, score }) => {
  switch (strength) {
    case 'strong':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Strong Evidence</span>
          {score !== undefined && <span className="opacity-75 font-mono text-[11px]">({(score * 100).toFixed(0)}%)</span>}
        </span>
      );
    case 'moderate':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
          <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Moderate Evidence</span>
          {score !== undefined && <span className="opacity-75 font-mono text-[11px]">({(score * 100).toFixed(0)}%)</span>}
        </span>
      );
    case 'weak':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Low Evidence</span>
          {score !== undefined && <span className="opacity-75 font-mono text-[11px]">({(score * 100).toFixed(0)}%)</span>}
        </span>
      );
    case 'none':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>No Documented Evidence</span>
        </span>
      );
  }
};
