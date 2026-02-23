'use client';
import { useState } from 'react';

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundAlt: string;
    text: string;
    textAlt: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  effects: {
    shadowColor: string;
    shadowBlur: number;
    borderRadius: number;
  };
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
}

const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'classic',
    name: 'Classic Potomac',
    colors: {
      primary: '#FEC00F',
      secondary: '#212121',
      accent: '#FFFFFF',
      background: '#212121',
      backgroundAlt: '#1a1a1a',
      text: '#FFFFFF',
      textAlt: '#FEC00F',
      border: '#333333',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, borderRadius: 8 },
  },
  {
    id: 'navy',
    name: 'Navy Blue',
    colors: {
      primary: '#FEC00F',
      secondary: '#1A2744',
      accent: '#FFFFFF',
      background: '#1A2744',
      backgroundAlt: '#0F1A2E',
      text: '#FFFFFF',
      textAlt: '#8899AA',
      border: '#2A3754',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 12, borderRadius: 8 },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      primary: '#4CAF50',
      secondary: '#1B2E1B',
      accent: '#FFFFFF',
      background: '#1B2E1B',
      backgroundAlt: '#0F1A0F',
      text: '#FFFFFF',
      textAlt: '#6B8E6B',
      border: '#2B4E2B',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, borderRadius: 8 },
  },
  {
    id: 'slate',
    name: 'Slate Modern',
    colors: {
      primary: '#FF6B35',
      secondary: '#2D2D3D',
      accent: '#FFFFFF',
      background: '#2D2D3D',
      backgroundAlt: '#1F1F2D',
      text: '#FFFFFF',
      textAlt: '#8E8E9E',
      border: '#3D3D4D',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, borderRadius: 12 },
  },
  {
    id: 'minimal',
    name: 'Minimal Light',
    colors: {
      primary: '#333333',
      secondary: '#1A1A1A',
      accent: '#FFFFFF',
      background: '#FFFFFF',
      backgroundAlt: '#F8F8F8',
      text: '#1A1A1A',
      textAlt: '#666666',
      border: '#E0E0E0',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.1)', shadowBlur: 8, borderRadius: 4 },
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    colors: {
      primary: '#0066CC',
      secondary: '#003366',
      accent: '#FFFFFF',
      background: '#003366',
      backgroundAlt: '#002244',
      text: '#FFFFFF',
      textAlt: '#99CCFF',
      border: '#004488',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, borderRadius: 6 },
  },
  {
    id: 'sunset',
    name: 'Sunset Gradient',
    colors: {
      primary: '#FF6B6B',
      secondary: '#2D1B2D',
      accent: '#FFFFFF',
      background: '#2D1B2D',
      backgroundAlt: '#1A0F1A',
      text: '#FFFFFF',
      textAlt: '#FFB3B3',
      border: '#4D2D4D',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, borderRadius: 8 },
    gradient: { type: 'linear', colors: ['#FF6B6B', '#FF8E53'], angle: 135 },
  },
  {
    id: 'ocean',
    name: 'Ocean Depths',
    colors: {
      primary: '#00CED1',
      secondary: '#0A2F3F',
      accent: '#FFFFFF',
      background: '#0A2F3F',
      backgroundAlt: '#061A24',
      text: '#FFFFFF',
      textAlt: '#7FDFDF',
      border: '#1A4F5F',
    },
    fonts: { heading: 'Rajdhani', body: 'Rajdhani' },
    effects: { shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 12, borderRadius: 10 },
    gradient: { type: 'linear', colors: ['#00CED1', '#0066CC'], angle: 180 },
  },
];

interface ThemeManagerProps {
  currentTheme: ThemeConfig;
  onThemeChange: (theme: ThemeConfig) => void;
  onClose: () => void;
}

export default function ThemeManager({ currentTheme, onThemeChange, onClose }: ThemeManagerProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(currentTheme);

  const updateCustomColor = (key: string, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const updateGradient = (updates: Partial<ThemeConfig['gradient']>) => {
    setCustomTheme(prev => ({
      ...prev,
      gradient: { ...prev.gradient, type: 'linear', colors: [], ...updates } as ThemeConfig['gradient'],
    }));
  };

  const applyCustomTheme = () => {
    onThemeChange({ ...customTheme, id: 'custom-' + Date.now() });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Theme Manager</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'presets' ? 'text-[#FEC00F] border-b-2 border-[#FEC00F]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pre-Designed Themes
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'custom' ? 'text-[#FEC00F] border-b-2 border-[#FEC00F]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Custom Theme
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PRESET_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                    currentTheme.id === theme.id ? 'border-[#FEC00F] ring-2 ring-[#FEC00F]/30' : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  {/* Theme Preview */}
                  <div
                    className="aspect-video relative"
                    style={{
                      background: theme.gradient
                        ? `linear-gradient(${theme.gradient.angle || 135}deg, ${theme.gradient.colors.join(', ')})`
                        : theme.colors.background,
                    }}
                  >
                    <div
                      className="absolute top-2 left-2 w-8 h-8 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div className="absolute top-3 left-12 w-16 h-2 rounded" style={{ backgroundColor: theme.colors.text }} />
                    <div className="absolute top-6 left-12 w-12 h-1.5 rounded" style={{ backgroundColor: theme.colors.textAlt }} />
                    <div
                      className="absolute bottom-2 right-2 w-10 h-6 rounded"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                  </div>
                  {/* Theme Name */}
                  <div className="px-3 py-2 bg-[#0a0a0a]">
                    <p className="text-xs font-medium text-white truncate">{theme.name}</p>
                  </div>
                  {/* Selected Indicator */}
                  {currentTheme.id === theme.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#FEC00F] rounded-full flex items-center justify-center">
                      <span className="text-black text-sm">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Theme Name */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Theme Name</label>
                <input
                  type="text"
                  value={customTheme.name}
                  onChange={e => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="My Custom Theme"
                />
              </div>

              {/* Color Palette */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Color Palette</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'primary', label: 'Primary' },
                    { key: 'secondary', label: 'Secondary' },
                    { key: 'accent', label: 'Accent' },
                    { key: 'background', label: 'Background' },
                    { key: 'backgroundAlt', label: 'Alt Background' },
                    { key: 'text', label: 'Text' },
                    { key: 'textAlt', label: 'Alt Text' },
                    { key: 'border', label: 'Border' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 block mb-1">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customTheme.colors[key as keyof typeof customTheme.colors]}
                          onChange={e => updateCustomColor(key, e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={customTheme.colors[key as keyof typeof customTheme.colors]}
                          onChange={e => updateCustomColor(key, e.target.value)}
                          className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient Options */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Gradient Background</h3>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!customTheme.gradient}
                      onChange={e => setCustomTheme(prev => ({
                        ...prev,
                        gradient: e.target.checked ? { type: 'linear', colors: [prev.colors.primary, prev.colors.secondary], angle: 135 } : undefined,
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-400">Enable Gradient</span>
                  </label>
                </div>
                {customTheme.gradient && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Gradient Type</label>
                      <select
                        value={customTheme.gradient.type}
                        onChange={e => updateGradient({ type: e.target.value as 'linear' | 'radial' })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Angle (deg)</label>
                      <input
                        type="number"
                        value={customTheme.gradient.angle || 0}
                        onChange={e => updateGradient({ angle: parseInt(e.target.value) })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
                        disabled={customTheme.gradient.type === 'radial'}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Colors</label>
                      <div className="flex gap-1">
                        {customTheme.gradient.colors.map((color, i) => (
                          <input
                            key={i}
                            type="color"
                            value={color}
                            onChange={e => {
                              const newColors = [...customTheme.gradient!.colors];
                              newColors[i] = e.target.value;
                              updateGradient({ colors: newColors });
                            }}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Effects */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Effects</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Border Radius</label>
                    <input
                      type="number"
                      value={customTheme.effects.borderRadius}
                      onChange={e => setCustomTheme(prev => ({
                        ...prev,
                        effects: { ...prev.effects, borderRadius: parseInt(e.target.value) },
                      }))}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Shadow Blur</label>
                    <input
                      type="number"
                      value={customTheme.effects.shadowBlur}
                      onChange={e => setCustomTheme(prev => ({
                        ...prev,
                        effects: { ...prev.effects, shadowBlur: parseInt(e.target.value) },
                      }))}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Shadow Color</label>
                    <input
                      type="color"
                      value={customTheme.effects.shadowColor.replace(/[^#\w]/g, '').slice(0, 7) || '#000000'}
                      onChange={e => setCustomTheme(prev => ({
                        ...prev,
                        effects: { ...prev.effects, shadowColor: e.target.value },
                      }))}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Preview</h3>
                <div
                  className="h-32 rounded-xl relative overflow-hidden"
                  style={{
                    background: customTheme.gradient
                      ? `${customTheme.gradient.type}-gradient(${customTheme.gradient.type === 'linear' ? `${customTheme.gradient.angle}deg, ` : ''}${customTheme.gradient.colors.join(', ')})`
                      : customTheme.colors.background,
                  }}
                >
                  <div className="p-4">
                    <div className="w-24 h-4 rounded mb-2" style={{ backgroundColor: customTheme.colors.text }} />
                    <div className="w-16 h-2 rounded mb-4" style={{ backgroundColor: customTheme.colors.textAlt }} />
                    <div className="flex gap-2">
                      <div className="w-12 h-6 rounded" style={{ backgroundColor: customTheme.colors.primary }} />
                      <div className="w-12 h-6 rounded" style={{ backgroundColor: customTheme.colors.secondary, border: `1px solid ${customTheme.colors.primary}` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={applyCustomTheme}
                className="w-full py-3 bg-[#FEC00F] text-[#212121] font-bold rounded-xl hover:bg-yellow-400 transition-colors"
              >
                Apply Custom Theme
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { PRESET_THEMES };
export type { ThemeConfig as ThemeConfigType };