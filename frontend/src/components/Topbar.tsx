import React from 'react';
import { Menu, Wifi, WifiOff, Database } from 'lucide-react';
import { HealthStatus } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface TopbarProps {
  title: string;
  subtitle?: string;
  health: HealthStatus | null;
  backendError: boolean;
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  health,
  backendError,
  onOpenMobileMenu
}) => {
  return (
    <header className="h-16 bg-white dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 flex items-center justify-between shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Knowledge Base Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
          <Database className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          <span>
            {health?.knowledge_base_entries !== undefined
              ? `${health.knowledge_base_entries} KB Entries`
              : 'Connecting...'}
          </span>
        </div>

        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            backendError
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
          }`}
        >
          {backendError ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden xs:inline">Backend Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xs:inline">Connected</span>
            </>
          )}
        </div>

        {/* Animated Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};
