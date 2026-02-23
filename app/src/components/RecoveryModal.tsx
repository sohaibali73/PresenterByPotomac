'use client';

import { useEffect, useState } from 'react';
import { DraftData } from '@/hooks/useAutoSave';

interface RecoveryModalProps {
  draft: DraftData | null;
  onRecover: (data: any) => void;
  onDismiss: () => void;
}

export default function RecoveryModal({ draft, onRecover, onDismiss }: RecoveryModalProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!draft) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - draft.timestamp) / 1000);
      
      if (seconds < 60) {
        setTimeAgo('just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      } else {
        const days = Math.floor(seconds / 86400);
        setTimeAgo(`${days} day${days > 1 ? 's' : ''} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [draft]);

  if (!draft) return null;

  const handleRecover = () => {
    onRecover(draft.data);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-[#1a1a1a] rounded-2xl border border-yellow-500/50 shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Warning Header */}
        <div className="px-6 py-4 bg-yellow-500/10 border-b border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                UNSAVED WORK FOUND
              </h2>
              <p className="text-sm text-gray-400">
                We found an unsaved draft from {timeAgo}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#FEC00F]/20 flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {draft.title || 'Untitled Presentation'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {draft.data?.slides?.length || 0} slides • Last edited {timeAgo}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-4">
            Would you like to recover this draft? Any unsaved changes in your current session will be replaced.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-[#141414] border-t border-gray-700 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Discard Draft
          </button>
          <button
            onClick={handleRecover}
            className="flex-1 px-4 py-2.5 bg-[#FEC00F] hover:bg-yellow-400 text-[#212121] font-bold rounded-lg transition-colors"
          >
            Recover Draft
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-save status indicator component
 */
interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: Error | null;
  onManualSave?: () => void;
}

export function AutoSaveIndicator({
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  error,
  onManualSave,
}: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      
      if (seconds < 60) {
        setTimeAgo('just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      } else {
        setTimeAgo(lastSaved.toLocaleDateString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (error) {
    return (
      <button
        onClick={onManualSave}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Save failed — Retry
      </button>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        Saving...
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <button
        onClick={onManualSave}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition-colors"
      >
        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        Unsaved changes
      </button>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Saved {timeAgo}
      </div>
    );
  }

  return null;
}