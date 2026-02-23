'use client';

import { useState } from 'react';

interface ExportFormat {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

const FORMATS: ExportFormat[] = [
  { id: 'pptx', name: 'PowerPoint', icon: '📊', description: 'Native PPTX format', available: true },
  { id: 'pdf', name: 'PDF', icon: '📄', description: 'Portable Document Format', available: true },
  { id: 'images', name: 'Images', icon: '🖼️', description: 'PNG/JPG images of each slide', available: true },
  { id: 'html', name: 'HTML', icon: '🌐', description: 'Web presentation', available: true },
  { id: 'video', name: 'Video', icon: '🎬', description: 'MP4 video export', available: false },
];

interface ExportOptions {
  format: string;
  quality: 'low' | 'medium' | 'high';
  includeNotes: boolean;
  includeHidden: boolean;
  slideRange: 'all' | 'current' | 'custom';
  customRange?: string;
}

interface ExportManagerProps {
  open: boolean;
  onClose: () => void;
  slideCount: number;
  currentSlide?: number;
  onExport: (options: ExportOptions) => void;
}

export default function ExportManager({
  open,
  onClose,
  slideCount,
  currentSlide = 0,
  onExport,
}: ExportManagerProps) {
  const [format, setFormat] = useState('pptx');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [slideRange, setSlideRange] = useState<'all' | 'current' | 'custom'>('all');
  const [customRange, setCustomRange] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        quality,
        includeNotes,
        includeHidden,
        slideRange,
        customRange,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Export Presentation</h2>
            <p className="text-sm text-gray-500">{slideCount} slides</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-3 block">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => f.available && setFormat(f.id)}
                  disabled={!f.available}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    format === f.id
                      ? 'bg-[#FEC00F]/20 border-2 border-[#FEC00F]'
                      : f.available
                        ? 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                        : 'bg-gray-900 border border-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-xs text-white">{f.name}</div>
                  {!f.available && (
                    <div className="text-[10px] text-gray-500">Coming soon</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-3 block">Quality</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    quality === q
                      ? 'bg-[#FEC00F] text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Slide Range */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-3 block">Slides</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSlideRange('all')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  slideRange === 'all'
                    ? 'bg-[#FEC00F] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                All {slideCount}
              </button>
              <button
                onClick={() => setSlideRange('current')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  slideRange === 'current'
                    ? 'bg-[#FEC00F] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Current ({currentSlide + 1})
              </button>
              <button
                onClick={() => setSlideRange('custom')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  slideRange === 'custom'
                    ? 'bg-[#FEC00F] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Custom
              </button>
            </div>
            {slideRange === 'custom' && (
              <input
                type="text"
                value={customRange}
                onChange={e => setCustomRange(e.target.value)}
                placeholder="e.g., 1-3, 5, 7-9"
                className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FEC00F]"
              />
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={e => setIncludeNotes(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#FEC00F] focus:ring-[#FEC00F]"
              />
              <span className="text-sm text-gray-300">Include speaker notes</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHidden}
                onChange={e => setIncludeHidden(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#FEC00F] focus:ring-[#FEC00F]"
              />
              <span className="text-sm text-gray-300">Include hidden slides</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-2.5 bg-[#FEC00F] text-black font-semibold rounded-lg text-sm hover:bg-yellow-400 disabled:opacity-50"
          >
            {isExporting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Exporting...
              </span>
            ) : (
              'Export'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}