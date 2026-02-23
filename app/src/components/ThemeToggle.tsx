'use client';

import { useState } from 'react';
import { useTheme, Theme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark', label: 'Dark', icon: 'D' },
    { value: 'light', label: 'Light', icon: 'L' },
    { value: 'system', label: 'System', icon: 'S' },
  ];

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Toggle theme"
      >
        {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-20 min-w-[140px] overflow-hidden">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                  theme === t.value
                    ? 'bg-[#FEC00F]/10 text-[#FEC00F]'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {theme === t.value && (
                  <span className="ml-auto text-[#FEC00F]">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Simple toggle button without dropdown
export function ThemeToggleSimple() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}