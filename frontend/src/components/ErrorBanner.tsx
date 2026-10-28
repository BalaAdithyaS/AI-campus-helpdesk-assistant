import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = "Service Connection Disruption",
  message,
  onRetry
}) => {
  return (
    <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 text-left my-3 shadow-xs transition-colors">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">{title}</h4>
          <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-200 bg-rose-100/80 dark:bg-rose-900/50 hover:bg-rose-200/80 dark:hover:bg-rose-900/70 px-2.5 py-1 rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
