'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutItem {
  keys: string[];
  description: string;
  category?: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // General
  { keys: ['Ctrl', 'S'], description: 'Save presentation', category: 'General' },
  { keys: ['Ctrl', 'E'], description: 'Export presentation', category: 'General' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'General' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'General' },
  
  // Editing
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'Editing' },
  { keys: ['Ctrl', 'Y'], description: 'Redo', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternate)', category: 'Editing' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate slide', category: 'Editing' },
  { keys: ['Delete'], description: 'Delete slide', category: 'Editing' },
  { keys: ['Backspace'], description: 'Delete slide (alternate)', category: 'Editing' },
  
  // Navigation
  { keys: ['←'], description: 'Previous slide', category: 'Navigation' },
  { keys: ['→'], description: 'Next slide', category: 'Navigation' },
  { keys: ['Home'], description: 'First slide', category: 'Navigation' },
  { keys: ['End'], description: 'Last slide', category: 'Navigation' },
  
  // Slide Management
  { keys: ['Ctrl', 'N'], description: 'Add new slide', category: 'Slide Management' },
  
  // Presentation
  { keys: ['F5'], description: 'Start presentation mode', category: 'Presentation' },
  { keys: ['Esc'], description: 'Exit presentation mode', category: 'Presentation' },
];

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  // Group shortcuts by category
  const categories = SHORTCUTS.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] rounded-2xl border border-gray-700 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              KEYBOARD SHORTCUTS
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Speed up your workflow with these shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(categories).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-[#FEC00F] uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-gray-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <span key={j}>
                            <kbd className="px-2 py-1 text-xs font-medium text-white bg-gray-800 border border-gray-600 rounded shadow-sm">
                              {key}
                            </kbd>
                            {j < shortcut.keys.length - 1 && (
                              <span className="text-gray-500 mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 bg-[#141414]">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-800 border border-gray-600 rounded">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

export { SHORTCUTS };