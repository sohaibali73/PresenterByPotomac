'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';

export default function LanguageSelector() {
  const { locale, setLocale, locales } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Change language"
      >
        <span className="text-lg">🌐</span>
        <span className="text-sm hidden sm:inline">{currentLocale.nativeName}</span>
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
          <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-20 min-w-[160px] overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700">
              <span className="text-xs text-gray-400">Select Language</span>
            </div>
            
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => {
                  setLocale(loc.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 flex items-center justify-between text-sm transition-colors ${
                  locale === loc.code
                    ? 'bg-[#FEC00F]/10 text-[#FEC00F]'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                <span>{loc.nativeName}</span>
                <span className="text-xs text-gray-500">{loc.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for mobile
export function LanguageSelectorCompact() {
  const { locale, setLocale, locales } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Change language"
      >
        🌐
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => {
                  setLocale(loc.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm ${
                  locale === loc.code
                    ? 'bg-[#FEC00F]/10 text-[#FEC00F]'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                {loc.nativeName}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}