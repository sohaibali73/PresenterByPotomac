'use client';

import { useState } from 'react';

interface Animation {
  id: string;
  elementId: string;
  type: 'entrance' | 'exit' | 'emphasis';
  effect: string;
  duration: number;
  delay: number;
}

interface AnimationEditorProps {
  open: boolean;
  onClose: () => void;
  onApply: (animation: Animation) => void;
}

const EFFECTS = {
  entrance: ['fade', 'fly-left', 'fly-right', 'zoom', 'spin'],
  exit: ['fade-out', 'fly-out', 'zoom-out'],
  emphasis: ['pulse', 'grow', 'shake', 'glow'],
};

export default function AnimationEditor({ open, onClose, onApply }: AnimationEditorProps) {
  const [type, setType] = useState<'entrance' | 'exit' | 'emphasis'>('entrance');
  const [effect, setEffect] = useState('fade');
  const [duration, setDuration] = useState(0.5);

  if (!open) return null;

  const handleApply = () => {
    onApply({
      id: `anim-${Date.now()}`,
      elementId: '',
      type,
      effect,
      duration,
      delay: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-80 bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-semibold">Animation</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white">×</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <div className="flex gap-1">
              {(['entrance', 'exit', 'emphasis'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 text-xs rounded ${
                    type === t ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Effect</label>
            <div className="grid grid-cols-2 gap-1">
              {EFFECTS[type].map(e => (
                <button
                  key={e}
                  onClick={() => setEffect(e)}
                  className={`py-1.5 text-xs rounded ${
                    effect === e ? 'bg-[#FEC00F]/20 text-[#FEC00F]' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Duration: {duration}s</label>
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={duration}
              onChange={e => setDuration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 text-xs text-gray-400">Cancel</button>
          <button onClick={handleApply} className="flex-1 py-2 bg-purple-500 text-white text-xs rounded">Apply</button>
        </div>
      </div>
    </div>
  );
}