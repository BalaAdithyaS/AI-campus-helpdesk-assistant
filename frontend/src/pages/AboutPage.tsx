import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  GitBranch
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 transition-colors duration-200">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-3">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Hackathon System Architecture v2.0</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-serif">
          About VIT CampusIQ
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
          An evidence-grounded university helpdesk assistant built for reliability, multi-variant paraphrase resilience, and safe fallback handling without hallucination risk.
        </p>
      </div>

      {/* Problem & Approach */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>The Paraphrase Challenge</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Students ask the same question in countless different ways: "How do I register for an event?", "Where can I enrol?", "How can I sign up?", or "Get my name on the participants list". Traditional keyword systems fail on semantic variants, while ungrounded LLMs hallucinate false dates and non-existent room numbers.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Hybrid Grounding Solution</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            CampusIQ implements a 6-stage hybrid retrieval pipeline combining multi-variant cosine matching, word TF-IDF, character n-gram subwords, synonym expansion, and conversational context resolution. Every answer cites verified document excerpts and refuses to fabricate information when evidence is absent.
          </p>
        </div>
      </div>

      {/* 6-Stage Pipeline */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>6-Stage Hybrid Retrieval Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-blue-800 dark:text-blue-300">
              1. Normalization & Typo Shield
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Expands contractions ("how'd", "can't"), corrects typos ("clasroom", "timngs", "regester"), expands acronyms, and preserves negations.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-blue-800 dark:text-blue-300">
              2. Intent & Scope Classification
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Classifies queries into campus categories (Event Registration, Navigation, Lab Schedules, Library, Wi-Fi) and guards against adversarial prompts.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-blue-800 dark:text-blue-300">
              3. Conversational Context Resolution
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Follow-ups ("How do I sign up?", "Where is it?") resolve against previous turns. In the absence of context, the system prompts for clarification.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-blue-800 dark:text-blue-300">
              4. Multi-Variant & Char N-Grams
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Matches queries against 8-15 trained question variants per FAQ, combined with character n-grams (3-5) for morphological stem resilience.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-blue-800 dark:text-blue-300">
              5. Hybrid Ranking & Penalty
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Combines lexical, variant, subword, synonym, and intent scores with normalized weights. Applies penalties to conflicting domains.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-blue-800 dark:text-blue-300">
              6. Evidence Validation & Citation
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Validates whether the candidate document answers the specific inquiry. Attaches inspectable source citations and diagnostic metadata.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations & Data Integrity */}
      <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3 transition-colors">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-sm">
          <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span>Hackathon Prototype Limitations & Data Integrity</span>
        </div>
        <ul className="text-xs text-amber-900/90 dark:text-amber-300/90 space-y-1.5 list-disc pl-5 leading-relaxed">
          <li>
            <strong>Synthetic Demonstration Records:</strong> In strict compliance with competition rules, all 26 knowledge base entries are synthetic prototype records clearly labeled with `verified: false`. They do not represent real VIT personnel, phone numbers, or unverified campus hours.
          </li>
          <li>
            <strong>Static Documentation Scope:</strong> The system reflects documented institutional guidelines and does not integrate real-time classroom occupancy sensors or dynamic schedule cancellations.
          </li>
          <li>
            <strong>Zero External Cloud Dependence:</strong> The entire platform runs completely locally without requiring paid third-party LLM API keys or internet connectivity.
          </li>
        </ul>
      </div>
    </div>
  );
};
