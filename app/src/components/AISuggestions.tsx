'use client';

import { useState, useCallback, useEffect } from 'react';

interface Suggestion {
  id: string;
  type: string;
  original: string;
  suggestion: string;
  reason: string;
}

interface AISuggestionsProps {
  content: string;
  context?: string;
  onApply: (suggestion: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const SUGGESTION_TYPES = [
  { id: 'title', label: 'Title', icon: 'T' },
  { id: 'bullet', label: 'Bullet', icon: '•' },
  { id: 'rephrase', label: 'Rephrase', icon: '↻' },
  { id: 'extract', label: 'Extract', icon: '≡' },
  { id: 'tone', label: 'Tone', icon: '♪' },
] as const;

export default function AISuggestions({ 
  content, 
  context, 
  onApply, 
  onClose,
  isOpen = true 
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>('rephrase');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (type: string) => {
    if (!content?.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, context }),
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setSuggestions([]);
      } else {
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      setError('Failed to get suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [content, context]);

  // Fetch suggestions when type or content changes
  useEffect(() => {
    if (isOpen && content?.trim()) {
      fetchSuggestions(activeType);
    }
  }, [activeType, isOpen]);

  const handleApply = (suggestion: Suggestion) => {
    onApply(suggestion.suggestion);
    setAppliedId(suggestion.id);
    setTimeout(() => setAppliedId(null), 1500);
  };

  const handleRefresh = () => {
    fetchSuggestions(activeType);
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 bg-[#1a1a1a] border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">AI</span>
          </div>
          <span className="text-xs font-semibold text-gray-300">Suggestions</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 text-gray-500 hover:text-white disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-gray-800/50 overflow-x-auto">
        {SUGGESTION_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
              activeType === type.id
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-gray-500 hover:text-white hover:bg-gray-800'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Original content preview */}
        {content && (
          <div className="bg-[#0a0a0a] rounded-lg p-2 mb-3">
            <p className="text-[9px] text-gray-500 uppercase mb-1">Original</p>
            <p className="text-xs text-gray-400 line-clamp-2">{content}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Analyzing...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-[10px] text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Suggestions */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500">No suggestions available</p>
            <p className="text-[10px] text-gray-600 mt-1">Select text to get suggestions</p>
          </div>
        )}

        {!loading && !error && suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`bg-[#0a0a0a] border rounded-lg p-3 transition-all cursor-pointer hover:border-purple-500/40 ${
              appliedId === suggestion.id 
                ? 'border-green-500 bg-green-500/10' 
                : 'border-gray-800'
            }`}
            onClick={() => handleApply(suggestion)}
          >
            <p className="text-xs text-white mb-2">{suggestion.suggestion}</p>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500">{suggestion.reason}</p>
              {appliedId === suggestion.id ? (
                <span className="text-[10px] text-green-400 font-medium">✓ Applied</span>
              ) : (
                <span className="text-[10px] text-purple-400">Click to apply</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-800 text-[9px] text-gray-500 text-center">
        Powered by AI • Click to apply suggestion
      </div>
    </div>
  );
}

// Compact inline suggestion button for toolbars
export function AISuggestionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
      title="AI Suggestions"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>AI Suggest</span>
    </button>
  );
}

// Hook for AI suggestions
export function useAISuggestions() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');

  const open = useCallback((text: string, ctx?: string) => {
    setContent(text);
    setContext(ctx || '');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    content,
    context,
    open,
    close,
    toggle,
    setContent,
    setContext,
  };
}