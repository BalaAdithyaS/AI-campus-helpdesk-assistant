import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Info,
  GraduationCap,
  Activity,
  Layers
} from 'lucide-react';
import { HealthStatus } from '../types';

interface SidebarProps {
  health: HealthStatus | null;
  backendError: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ health, backendError, onCloseMobile }) => {
  const navItems = [
    {
      to: '/',
      label: 'Campus Assistant',
      badge: 'Helpdesk',
      icon: MessageSquare
    },
    {
      to: '/knowledge',
      label: 'Knowledge Base',
      badge: health?.knowledge_base_entries ? `${health.knowledge_base_entries}` : undefined,
      icon: BookOpen
    },
    {
      to: '/evaluation',
      label: 'Evaluation Lab',
      badge: '42 Tests',
      icon: CheckCircle2
    },
    {
      to: '/about',
      label: 'System Architecture',
      badge: 'About',
      icon: Info
    }
  ];

  return (
    <aside className="w-64 h-full bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none transition-colors duration-200">
      {/* Top Wordmark & Header */}
      <div>
        <div className="h-16 border-b border-slate-100 dark:border-slate-800/80 flex items-center px-5 gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-700 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base font-serif">CampusIQ</span>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1 py-0.2 rounded uppercase">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">University AI Helpdesk</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-semibold shadow-xs border border-blue-100 dark:border-blue-800/60'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent dark:border-slate-700/60">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom System Status & Grounding Notice */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backendError
                  ? 'bg-rose-500'
                  : health?.retrieval_ready
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {backendError ? 'Backend Disconnected' : 'Retrieval Engine'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
            {backendError ? 'OFFLINE' : 'ONLINE'}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-0.5">
            <Layers className="w-3 h-3 text-blue-700 dark:text-blue-400" />
            <span>Hybrid Grounding Active</span>
          </div>
          Indexed with multi-variant TF-IDF, char n-grams, and synonym resolution.
        </div>
      </div>
    </aside>
  );
};
