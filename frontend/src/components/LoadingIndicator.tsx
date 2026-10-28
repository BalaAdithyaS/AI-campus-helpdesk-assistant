import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = "Searching verified campus knowledge...",
  size = 'md'
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  return (
    <div className="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 animate-pulse">
      <Loader2 className={`${iconSizes[size]} animate-spin text-blue-700 dark:text-blue-400`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
