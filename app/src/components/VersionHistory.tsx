'use client';

import { useState, useEffect, useCallback } from 'react';

interface Version {
  id: string;
  name: string;
  timestamp: string;
  slide_count: number;
  thumbnail?: string;
  created_by?: string;
  is_auto?: boolean;
}

interface VersionHistoryProps {
  presentationId: string;
  currentVersionId?: string;
  onRestore: (versionId: string) => void;
  onCompare?: (versionId: string) => void;
  onCreateVersion?: (name: string) => void;
  onClose?: () => void;
}

export default function VersionHistory({
  presentationId,
  currentVersionId,
  onRestore,
  onCompare,
  onCreateVersion,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');

  // Fetch versions
  useEffect(() => {
    fetchVersions();
  }, [presentationId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/presentations/${presentationId}/versions`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
      // Mock versions for demo
      setVersions([
        {
          id: 'v1',
          name: 'Initial Version',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          slide_count: 8,
          is_auto: false,
        },
        {
          id: 'v2',
          name: 'Auto-save',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          slide_count: 9,
          is_auto: true,
        },
        {
          id: 'v3',
          name: 'Added new slides',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          slide_count: 10,
          is_auto: false,
        },
        {
          id: 'current',
          name: 'Current',
          timestamp: new Date().toISOString(),
          slide_count: 10,
          is_auto: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionName.trim() || !onCreateVersion) return;
    
    onCreateVersion(newVersionName);
    setNewVersionName('');
    setShowNameInput(false);
    
    // Add to local list
    const newVersion: Version = {
      id: `v${Date.now()}`,
      name: newVersionName,
      timestamp: new Date().toISOString(),
      slide_count: versions[0]?.slide_count || 0,
    };
    setVersions([newVersion, ...versions]);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="w-72 bg-[#1a1a1a] border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-300">Version History</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Create Version */}
      {onCreateVersion && (
        <div className="px-4 py-3 border-b border-gray-800">
          {showNameInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newVersionName}
                onChange={e => setNewVersionName(e.target.value)}
                placeholder="Version name..."
                className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]"
                autoFocus
              />
              <button
                onClick={handleCreateVersion}
                className="px-2 py-1.5 bg-[#FEC00F] text-black text-xs font-bold rounded hover:bg-yellow-400"
              >
                Save
              </button>
              <button
                onClick={() => setShowNameInput(false)}
                className="px-2 py-1.5 bg-gray-800 text-gray-400 text-xs rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNameInput(true)}
              className="w-full py-2 border border-dashed border-gray-700 rounded text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              + Save New Version
            </button>
          )}
        </div>
      )}

      {/* Version List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-500">No versions saved</p>
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((version, index) => {
              const isSelected = selectedVersion === version.id;
              const isCurrent = version.id === currentVersionId || index === 0;

              return (
                <div
                  key={version.id}
                  onClick={() => setSelectedVersion(version.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#FEC00F]/10 border border-[#FEC00F]/30'
                      : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-white truncate">
                          {version.name}
                        </span>
                        {version.is_auto && (
                          <span className="text-[8px] px-1 py-0.5 bg-gray-700 text-gray-400 rounded">
                            AUTO
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[8px] px-1 py-0.5 bg-[#FEC00F]/20 text-[#FEC00F] rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {formatTimestamp(version.timestamp)}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {version.slide_count} slides
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {isSelected && !isCurrent && (
                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-800">
                      <button
                        onClick={e => { e.stopPropagation(); onRestore(version.id); }}
                        className="flex-1 py-1.5 bg-[#FEC00F] text-black text-[10px] font-bold rounded hover:bg-yellow-400"
                      >
                        Restore
                      </button>
                      {onCompare && (
                        <button
                          onClick={e => { e.stopPropagation(); onCompare(version.id); }}
                          className="px-2 py-1.5 bg-gray-800 text-gray-400 text-[10px] rounded hover:text-white hover:bg-gray-700"
                        >
                          Compare
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-800 text-[9px] text-gray-500">
        {versions.length} versions • Click to preview
      </div>
    </div>
  );
}

// Version comparison component
export function VersionDiff({
  currentSlides,
  previousSlides,
  onClose,
}: {
  currentSlides: any[];
  previousSlides: any[];
  onClose: () => void;
}) {
  const changes = compareVersions(currentSlides, previousSlides);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Version Comparison</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Changes */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {changes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No differences found
            </div>
          ) : (
            <div className="space-y-3">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    change.type === 'added'
                      ? 'bg-green-500/10 border-green-500/30'
                      : change.type === 'removed'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase ${
                      change.type === 'added' ? 'text-green-400' :
                      change.type === 'removed' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {change.type}
                    </span>
                    <span className="text-xs text-gray-400">Slide {change.slideIndex + 1}</span>
                  </div>
                  <p className="text-xs text-gray-300">{change.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function compareVersions(current: any[], previous: any[]): any[] {
  const changes: any[] = [];

  // Check for added slides
  if (current.length > previous.length) {
    for (let i = previous.length; i < current.length; i++) {
      changes.push({
        type: 'added',
        slideIndex: i,
        description: `New slide: ${current[i].title || current[i].layout}`,
      });
    }
  }

  // Check for removed slides
  if (previous.length > current.length) {
    for (let i = current.length; i < previous.length; i++) {
      changes.push({
        type: 'removed',
        slideIndex: i,
        description: `Removed slide: ${previous[i].title || previous[i].layout}`,
      });
    }
  }

  // Check for modified slides
  const minLen = Math.min(current.length, previous.length);
  for (let i = 0; i < minLen; i++) {
    if (JSON.stringify(current[i]) !== JSON.stringify(previous[i])) {
      changes.push({
        type: 'modified',
        slideIndex: i,
        description: `Modified: ${current[i].title || current[i].layout}`,
      });
    }
  }

  return changes;
}