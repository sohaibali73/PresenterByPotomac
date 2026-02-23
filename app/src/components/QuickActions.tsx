'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

interface Action {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  icon?: string;
  action: () => void;
}

interface QuickActionsProps {
  open: boolean;
  onClose: () => void;
  actions: Action[];
}

export default function QuickActions({ open, onClose, actions }: QuickActionsProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: Record<string, Action[]> = {};
    actions.forEach(action => {
      if (!groups[action.category]) groups[action.category] = [];
      groups[action.category].push(action);
    });
    return groups;
  }, [actions]);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(a => 
      a.label.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.shortcut?.toLowerCase().includes(q)
    );
  }, [actions, query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredActions, selectedIndex, onClose]);

  // Execute action
  const executeAction = useCallback((action: Action) => {
    action.action();
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-500"
          />
          <kbd className="px-2 py-0.5 text-[10px] text-gray-500 bg-gray-800 rounded">ESC</kbd>
        </div>

        {/* Actions List */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filteredActions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No actions found for "{query}"
            </div>
          ) : (
            Object.entries(groupedActions).map(([category, categoryActions]) => {
              const filtered = categoryActions.filter(a => filteredActions.includes(a));
              if (filtered.length === 0) return null;

              return (
                <div key={category}>
                  <div className="px-4 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    {category}
                  </div>
                  {filtered.map((action, idx) => {
                    const globalIdx = filteredActions.indexOf(action);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          isSelected ? 'bg-[#FEC00F]/10 text-[#FEC00F]' : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {action.icon && (
                          <span className="w-6 h-6 flex items-center justify-center text-sm bg-gray-800 rounded">
                            {action.icon}
                          </span>
                        )}
                        <span className="flex-1 text-sm">{action.label}</span>
                        {action.shortcut && (
                          <kbd className="px-2 py-0.5 text-[10px] text-gray-500 bg-gray-800 rounded font-mono">
                            {action.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-800 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1 bg-gray-800 rounded">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 bg-gray-800 rounded">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 bg-gray-800 rounded">ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}

// Hook to use quick actions
export function useQuickActions(actions: Action[]) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    open,
    setOpen,
    toggle: () => setOpen(prev => !prev),
    close: () => setOpen(false),
  };
}