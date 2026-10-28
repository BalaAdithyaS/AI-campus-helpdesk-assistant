import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { checkHealth } from '../api/client';
import { HealthStatus } from '../types';
import { X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [backendError, setBackendError] = useState(false);
  const location = useLocation();

  const fetchHealth = async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
      setBackendError(false);
    } catch (err) {
      setBackendError(true);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute page title & subtitle based on pathname
  let pageTitle = 'Campus Assistant';
  let pageSubtitle = 'Answers grounded strictly in the campus knowledge base';

  if (location.pathname === '/knowledge') {
    pageTitle = 'Knowledge Base Explorer';
    pageSubtitle = 'Search, filter, and inspect verified and demonstration campus documentation';
  } else if (location.pathname === '/evaluation') {
    pageTitle = 'Evaluation Lab';
    pageSubtitle = 'Execution suite for testing evidence grounding, ambiguity, and fallback safety';
  } else if (location.pathname === '/about') {
    pageTitle = 'Architecture & Methodology';
    pageSubtitle = 'System design, retrieval pipeline, safety guardrails, and limitations';
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar health={health} backendError={backendError} />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-white dark:bg-[#0B0F19] shadow-xl z-10 transition-colors">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              health={health}
              backendError={backendError}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          title={pageTitle}
          subtitle={pageSubtitle}
          health={health}
          backendError={backendError}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-200">
          <Outlet context={{ health, backendError, onRetryBackend: fetchHealth }} />
        </main>
      </div>
    </div>
  );
};
