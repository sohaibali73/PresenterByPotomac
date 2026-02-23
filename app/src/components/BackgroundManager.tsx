'use client';
import { useState } from 'react';

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'pattern';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  image?: {
    url: string;
    fit: 'cover' | 'contain' | 'tile';
    opacity: number;
    blur: number;
  };
  pattern?: {
    type: 'dots' | 'grid' | 'lines' | 'zigzag' | 'circles';
    color: string;
    size: number;
    opacity: number;
  };
}

const PATTERN_TYPES = [
  { id: 'dots', name: 'Dots', icon: '◉' },
  { id: 'grid', name: 'Grid', icon: '▦' },
  { id: 'lines', name: 'Lines', icon: '≡' },
  { id: 'zigzag', name: 'Zigzag', icon: '〰' },
  { id: 'circles', name: 'Circles', icon: '◯' },
];

const GRADIENT_PRESETS = [
  { name: 'Sunrise', colors: ['#FF6B6B', '#FF8E53', '#FFD93D'], angle: 135 },
  { name: 'Ocean', colors: ['#00CED1', '#0066CC', '#003366'], angle: 180 },
  { name: 'Forest', colors: ['#134E5E', '#71B280'], angle: 90 },
  { name: 'Purple Haze', colors: ['#7F00FF', '#E100FF'], angle: 135 },
  { name: 'Sunset', colors: ['#FF416C', '#FF4B2B'], angle: 90 },
  { name: 'Aurora', colors: ['#00C9FF', '#92FE9D'], angle: 45 },
  { name: 'Midnight', colors: ['#232526', '#414345'], angle: 180 },
  { name: 'Cherry', colors: ['#EB3349', '#F45C43'], angle: 90 },
];

interface BackgroundManagerProps {
  currentBackground: BackgroundConfig;
  onBackgroundChange: (background: BackgroundConfig) => void;
  onClose: () => void;
  assets?: { id: string; name: string; url: string }[];
}

export default function BackgroundManager({
  currentBackground,
  onBackgroundChange,
  onClose,
  assets = [],
}: BackgroundManagerProps) {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient' | 'image' | 'pattern'>(
    currentBackground.type || 'solid'
  );
  const [config, setConfig] = useState<BackgroundConfig>(currentBackground);
  const [imageUrl, setImageUrl] = useState(config.image?.url || '');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const updateConfig = (updates: Partial<BackgroundConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onBackgroundChange(newConfig);
  };

  const getBackgroundStyle = (bg: BackgroundConfig): React.CSSProperties => {
    switch (bg.type) {
      case 'solid':
        return { backgroundColor: bg.color || '#212121' };
      case 'gradient':
        if (bg.gradient) {
          const gradientStr = bg.gradient.type === 'linear'
            ? `linear-gradient(${bg.gradient.angle || 0}deg, ${bg.gradient.colors.join(', ')})`
            : `radial-gradient(circle, ${bg.gradient.colors.join(', ')})`;
          return { background: gradientStr };
        }
        return {};
      case 'image':
        return {
          backgroundImage: bg.image?.url ? `url(${bg.image.url})` : undefined,
          backgroundSize: bg.image?.fit === 'tile' ? 'auto' : bg.image?.fit || 'cover',
          backgroundRepeat: bg.image?.fit === 'tile' ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center',
          filter: bg.image?.blur ? `blur(${bg.image.blur}px)` : undefined,
          opacity: bg.image?.opacity ?? 1,
        };
      case 'pattern':
        return { backgroundColor: bg.color || '#212121' };
      default:
        return {};
    }
  };

  const generatePatternSVG = (pattern: BackgroundConfig['pattern']): string => {
    if (!pattern) return '';
    const { type, color, size, opacity } = pattern;
    const encodedColor = encodeURIComponent(color || '#FEC00F');
    
    switch (type) {
      case 'dots':
        return `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/4}' fill='${encodedColor}' fill-opacity='${opacity}'/%3E%3C/svg%3E")`;
      case 'grid':
        return `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M ${size} 0 L 0 0 0 ${size}' fill='none' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
      case 'lines':
        return `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='${size}' x2='${size}' y2='0' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
      case 'circles':
        return `url("data:image/svg+xml,%3Csvg width='${size * 2}' height='${size * 2}' viewBox='0 0 ${size * 2} ${size * 2}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${size}' cy='${size}' r='${size * 0.8}' fill='none' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
      case 'zigzag':
        return `url("data:image/svg+xml,%3Csvg width='${size * 2}' height='${size}' viewBox='0 0 ${size * 2} ${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 ${size/2} L${size/2} 0 L${size} ${size/2} L${size * 1.5} 0 L${size * 2} ${size/2}' fill='none' stroke='${encodedColor}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Background Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(['solid', 'gradient', 'image', 'pattern'] as const).map(type => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                updateConfig({ type });
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === type ? 'text-[#FEC00F] border-b-2 border-[#FEC00F]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Solid Color */}
          {activeTab === 'solid' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.color || '#212121'}
                    onChange={e => updateConfig({ color: e.target.value })}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-600"
                  />
                  <input
                    type="text"
                    value={config.color || '#212121'}
                    onChange={e => updateConfig({ color: e.target.value })}
                    className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white font-mono"
                  />
                </div>
              </div>
              
              {/* Quick Colors */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Quick Colors</label>
                <div className="flex flex-wrap gap-2">
                  {['#212121', '#1A2744', '#1B2E1B', '#2D2D3D', '#FFFFFF', '#F5F5F5', '#0A2F3F', '#2D1B2D', '#FEC00F', '#0066CC'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateConfig({ color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        config.color === color ? 'border-[#FEC00F] ring-2 ring-[#FEC00F]/30' : 'border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gradient */}
          {activeTab === 'gradient' && (
            <div className="space-y-6">
              {/* Preset Gradients */}
              <div>
                <label className="text-sm text-gray-400 block mb-3">Preset Gradients</label>
                <div className="grid grid-cols-4 gap-3">
                  {GRADIENT_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => updateConfig({
                        gradient: { type: 'linear', colors: preset.colors, angle: preset.angle },
                      })}
                      className="aspect-video rounded-lg border-2 border-gray-600 hover:border-[#FEC00F] transition-all overflow-hidden"
                      style={{
                        background: `linear-gradient(${preset.angle}deg, ${preset.colors.join(', ')})`,
                      }}
                    >
                      <span className="sr-only">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Gradient */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Custom Gradient</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Type</label>
                    <select
                      value={config.gradient?.type || 'linear'}
                      onChange={e => updateConfig({
                        gradient: { ...config.gradient, type: e.target.value as 'linear' | 'radial', colors: config.gradient?.colors || ['#212121', '#FEC00F'], angle: config.gradient?.angle || 0 },
                      })}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="linear">Linear</option>
                      <option value="radial">Radial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Angle</label>
                    <input
                      type="number"
                      value={config.gradient?.angle || 0}
                      onChange={e => updateConfig({
                        gradient: { ...config.gradient, angle: parseInt(e.target.value), type: config.gradient?.type || 'linear', colors: config.gradient?.colors || ['#212121', '#FEC00F'] },
                      })}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      disabled={config.gradient?.type === 'radial'}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-2">Colors</label>
                  <div className="flex gap-2">
                    {(config.gradient?.colors || ['#212121', '#FEC00F']).map((color, i) => (
                      <div key={i} className="flex-1">
                        <input
                          type="color"
                          value={color}
                          onChange={e => {
                            const newColors = [...(config.gradient?.colors || ['#212121', '#FEC00F'])];
                            newColors[i] = e.target.value;
                            updateConfig({
                              gradient: { ...config.gradient, colors: newColors, type: config.gradient?.type || 'linear', angle: config.gradient?.angle || 0 },
                            });
                          }}
                          className="w-full h-12 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => updateConfig({
                        gradient: {
                          ...config.gradient,
                          colors: [...(config.gradient?.colors || ['#212121', '#FEC00F']), '#FFFFFF'],
                          type: config.gradient?.type || 'linear',
                          angle: config.gradient?.angle || 0,
                        },
                      })}
                      className="px-4 py-2 bg-gray-700 rounded text-white hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {activeTab === 'image' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    onClick={() => updateConfig({
                      image: { ...config.image, url: imageUrl, fit: config.image?.fit || 'cover', opacity: config.image?.opacity ?? 1, blur: config.image?.blur || 0 },
                    })}
                    className="px-4 py-2 bg-[#FEC00F] text-black font-medium rounded-lg hover:bg-yellow-400"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Or Choose from Assets</label>
                <button
                  onClick={() => setShowAssetPicker(true)}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-[#FEC00F] transition-colors"
                >
                  📁 Browse Asset Library
                </button>
              </div>

              {/* Image Settings */}
              {config.image?.url && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Fit</label>
                      <select
                        value={config.image?.fit || 'cover'}
                        onChange={e => updateConfig({
                          image: { ...config.image, fit: e.target.value as 'cover' | 'contain' | 'tile', url: config.image?.url || '', opacity: config.image?.opacity ?? 1, blur: config.image?.blur || 0 },
                        })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="tile">Tile</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.image?.opacity ?? 1}
                        onChange={e => updateConfig({
                          image: { ...config.image, opacity: parseFloat(e.target.value), url: config.image?.url || '', fit: config.image?.fit || 'cover', blur: config.image?.blur || 0 },
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{Math.round((config.image?.opacity ?? 1) * 100)}%</span>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Blur</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={config.image?.blur || 0}
                        onChange={e => updateConfig({
                          image: { ...config.image, blur: parseInt(e.target.value), url: config.image?.url || '', fit: config.image?.fit || 'cover', opacity: config.image?.opacity ?? 1 },
                        })}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{config.image?.blur || 0}px</span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    className="h-32 rounded-lg overflow-hidden"
                    style={{
                      backgroundImage: `url(${config.image.url})`,
                      backgroundSize: config.image.fit === 'tile' ? 'auto' : config.image.fit,
                      backgroundRepeat: config.image.fit === 'tile' ? 'repeat' : 'no-repeat',
                      backgroundPosition: 'center',
                      filter: config.image.blur ? `blur(${config.image.blur}px)` : undefined,
                      opacity: config.image.opacity,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Pattern */}
          {activeTab === 'pattern' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 block mb-3">Pattern Type</label>
                <div className="grid grid-cols-5 gap-3">
                  {PATTERN_TYPES.map(pattern => (
                    <button
                      key={pattern.id}
                      onClick={() => updateConfig({
                        pattern: { type: pattern.id as any, color: config.pattern?.color || '#FEC00F', size: config.pattern?.size || 20, opacity: config.pattern?.opacity ?? 0.3 },
                      })}
                      className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        config.pattern?.type === pattern.id ? 'border-[#FEC00F] bg-[#FEC00F]/10' : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-2xl">{pattern.icon}</span>
                      <span className="text-[10px] text-gray-400">{pattern.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern Settings */}
              {config.pattern && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Color</label>
                    <input
                      type="color"
                      value={config.pattern.color}
                      onChange={e => updateConfig({
                        pattern: { type: config.pattern!.type, color: e.target.value, size: config.pattern!.size, opacity: config.pattern!.opacity },
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Size</label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={config.pattern.size}
                      onChange={e => updateConfig({
                        pattern: { type: config.pattern!.type, color: config.pattern!.color, size: parseInt(e.target.value), opacity: config.pattern!.opacity },
                      })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{config.pattern.size}px</span>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.pattern.opacity}
                      onChange={e => updateConfig({
                        pattern: { type: config.pattern!.type, color: config.pattern!.color, size: config.pattern!.size, opacity: parseFloat(e.target.value) },
                      })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{Math.round(config.pattern.opacity * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Pattern Preview */}
              <div
                className="h-32 rounded-lg relative"
                style={{
                  backgroundColor: config.color || '#212121',
                  backgroundImage: generatePatternSVG(config.pattern),
                }}
              />
            </div>
          )}
        </div>

        {/* Preview Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Preview</span>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#FEC00F] text-[#212121] font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}