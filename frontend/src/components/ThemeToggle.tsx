import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../utils/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={(e) => toggleTheme(e)}
      className="relative flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all cursor-pointer group"
      aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={`Theme: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'} (Click to toggle)`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`w-4 h-4 text-amber-500 transition-all duration-300 transform ${
            resolvedTheme === 'dark'
              ? 'rotate-90 scale-0 opacity-0 pointer-events-none absolute'
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4 h-4 text-blue-400 transition-all duration-300 transform ${
            resolvedTheme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0 pointer-events-none absolute'
          }`}
        />
      </div>

      <span className="sr-only">
        {resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </button>
  );
};
