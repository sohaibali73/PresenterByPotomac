'use client';

import { useState, useCallback } from 'react';

interface SmartGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (slides: any[], title: string) => void;
  onInsertSlide?: (slide: any, afterIndex: number) => void;
  currentSlideIndex?: number;
}

const PRESENTATION_TYPES = [
  { id: 'strategy', label: 'Strategy Overview', description: 'Investment strategy presentation' },
  { id: 'research', label: 'Research Report', description: 'Market or sector analysis' },
  { id: 'pitch', label: 'Pitch Deck', description: 'Client or investor pitch' },
  { id: 'outlook', label: 'Market Outlook', description: 'Quarterly or annual outlook' },
  { id: 'overview', label: 'General Overview', description: 'Topic introduction' },
];

const QUICK_PROMPTS = [
  'Create a slide about our risk management process',
  'Generate a three-pillar slide for investment strategy',
  'Add a performance chart slide',
  'Insert a section divider for portfolio allocation',
  'Create a comparison slide between two strategies',
];

export default function SmartGenerateModal({ 
  open, 
  onClose, 
  onGenerate,
  onInsertSlide,
  currentSlideIndex = 0
}: SmartGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [presentationType, setPresentationType] = useState('strategy');
  const [targetSlides, setTargetSlides] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'full' | 'single'>('single');

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'single' && onInsertSlide) {
        // Generate single slide
        const res = await fetch('/api/smart-generate', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            afterSlide: currentSlideIndex,
          }),
        });

        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          onInsertSlide(data.slide, data.insertAfter);
          onClose();
        }
      } else {
        // Generate full presentation
        const res = await fetch('/api/smart-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            presentationType,
            targetSlides,
          }),
        });

        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          onGenerate(data.slides, data.title);
          onClose();
        }
      }
    } catch (err) {
      setError('Failed to generate');
    } finally {
      setLoading(false);
    }
  }, [prompt, presentationType, targetSlides, mode, currentSlideIndex, onGenerate, onInsertSlide, onClose]);

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Smart Generate</h2>
              <p className="text-[10px] text-gray-500">AI-powered slide creation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('single')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                mode === 'single' 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
                  : 'bg-[#0a0a0a] text-gray-500 border border-gray-800 hover:border-gray-700'
              }`}
            >
              Add Slide
            </button>
            <button
              onClick={() => setMode('full')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                mode === 'full' 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
                  : 'bg-[#0a0a0a] text-gray-500 border border-gray-800 hover:border-gray-700'
              }`}
            >
              Full Presentation
            </button>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">
              {mode === 'single' ? 'Describe the slide' : 'What\'s the presentation about?'}
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={mode === 'single' 
                ? 'e.g., Create a three-pillar slide about our investment process' 
                : 'e.g., A strategy presentation about Bull Bear tactical approach'
              }
              rows={3}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Quick Prompts */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">
              Quick Prompts
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.slice(0, mode === 'single' ? 5 : 3).map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(qp)}
                  className="text-[10px] px-2 py-1 bg-[#0a0a0a] border border-gray-800 rounded text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
                >
                  {qp.length > 35 ? qp.substring(0, 35) + '...' : qp}
                </button>
              ))}
            </div>
          </div>

          {/* Full presentation options */}
          {mode === 'full' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">
                  Type
                </label>
                <select
                  value={presentationType}
                  onChange={e => setPresentationType(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {PRESENTATION_TYPES.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">
                  Slides
                </label>
                <select
                  value={targetSlides}
                  onChange={e => setTargetSlides(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {[3, 5, 7, 10, 12].map(n => (
                    <option key={n} value={n}>{n} slides</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800 bg-[#141414]">
          <p className="text-[10px] text-gray-500">
            {mode === 'single' ? 'Slide will be added after current slide' : 'Presentation will replace current slides'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg text-xs hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating action button for smart generate
export function SmartGenerateFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50"
      title="Smart Generate (AI)"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </button>
  );
}