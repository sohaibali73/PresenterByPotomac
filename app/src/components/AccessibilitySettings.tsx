'use client';

import { useState } from 'react';

interface AccessibilityOptions {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderMode: boolean;
  keyboardOnly: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface AccessibilitySettingsProps {
  open: boolean;
  onClose: () => void;
  onApply: (options: AccessibilityOptions) => void;
}

export default function AccessibilitySettings({
  open,
  onClose,
  onApply,
}: AccessibilitySettingsProps) {
  const [options, setOptions] = useState<AccessibilityOptions>({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReaderMode: false,
    keyboardOnly: false,
    colorBlindMode: 'none',
  });

  const handleToggle = (key: keyof AccessibilityOptions) => {
    const newOptions = { ...options, [key]: !options[key] };
    setOptions(newOptions);
    onApply(newOptions);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Accessibility</h2>
            <p className="text-sm text-gray-500">Adjust presentation settings</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* High Contrast */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white">High Contrast</h3>
              <p className="text-xs text-gray-500">Increase color contrast for better visibility</p>
            </div>
            <button
              onClick={() => handleToggle('highContrast')}
              className={`w-12 h-6 rounded-full transition-colors ${
                options.highContrast ? 'bg-[#FEC00F]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  options.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Large Text */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white">Large Text</h3>
              <p className="text-xs text-gray-500">Increase text size throughout the app</p>
            </div>
            <button
              onClick={() => handleToggle('largeText')}
              className={`w-12 h-6 rounded-full transition-colors ${
                options.largeText ? 'bg-[#FEC00F]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  options.largeText ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white">Reduce Motion</h3>
              <p className="text-xs text-gray-500">Minimize animations and transitions</p>
            </div>
            <button
              onClick={() => handleToggle('reduceMotion')}
              className={`w-12 h-6 rounded-full transition-colors ${
                options.reduceMotion ? 'bg-[#FEC00F]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  options.reduceMotion ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Screen Reader Mode */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white">Screen Reader Mode</h3>
              <p className="text-xs text-gray-500">Optimize for screen readers</p>
            </div>
            <button
              onClick={() => handleToggle('screenReaderMode')}
              className={`w-12 h-6 rounded-full transition-colors ${
                options.screenReaderMode ? 'bg-[#FEC00F]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  options.screenReaderMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Keyboard Only */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-white">Keyboard Navigation Only</h3>
              <p className="text-xs text-gray-500">Enhance keyboard focus indicators</p>
            </div>
            <button
              onClick={() => handleToggle('keyboardOnly')}
              className={`w-12 h-6 rounded-full transition-colors ${
                options.keyboardOnly ? 'bg-[#FEC00F]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  options.keyboardOnly ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Color Blind Mode */}
          <div className="p-3 bg-[#0a0a0a] rounded-lg">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-white">Color Blind Mode</h3>
              <p className="text-xs text-gray-500">Adjust colors for color vision deficiency</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'None' },
                { id: 'protanopia', label: 'Protanopia' },
                { id: 'deuteranopia', label: 'Deuteranopia' },
                { id: 'tritanopia', label: 'Tritanopia' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => {
                    const newOptions = { ...options, colorBlindMode: mode.id as any };
                    setOptions(newOptions);
                    onApply(newOptions);
                  }}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    options.colorBlindMode === mode.id
                      ? 'bg-[#FEC00F] text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-800 bg-[#141414]">
          <p className="text-xs text-gray-500 text-center">
            These settings help make presentations more accessible for all audiences.
          </p>
        </div>
      </div>
    </div>
  );
}