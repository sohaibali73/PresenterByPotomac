'use client';
import { useState } from 'react';

export interface EffectsConfig {
  shadow: {
    enabled: boolean;
    type: 'drop' | 'inner' | 'none';
    color: string;
    opacity: number;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  reflection: {
    enabled: boolean;
    opacity: number;
    offset: number;
    blur: number;
    scale: number;
  };
  glow: {
    enabled: boolean;
    color: string;
    opacity: number;
    blur: number;
  };
  border: {
    enabled: boolean;
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted' | 'double';
    radius: number;
  };
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    hueRotate: number;
    blur: number;
    grayscale: number;
    sepia: number;
    invert: number;
  };
  transform: {
    rotate: number;
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
  };
}

const DEFAULT_EFFECTS: EffectsConfig = {
  shadow: { enabled: false, type: 'drop', color: '#000000', opacity: 0.5, blur: 10, offsetX: 4, offsetY: 4 },
  reflection: { enabled: false, opacity: 0.3, offset: 10, blur: 4, scale: 0.8 },
  glow: { enabled: false, color: '#FEC00F', opacity: 0.8, blur: 15 },
  border: { enabled: false, color: '#FEC00F', width: 2, style: 'solid', radius: 0 },
  filters: { brightness: 100, contrast: 100, saturation: 100, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 },
  transform: { rotate: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
};

interface EffectsManagerProps {
  currentEffects: Partial<EffectsConfig>;
  onEffectsChange: (effects: EffectsConfig) => void;
  onClose: () => void;
  selectedElementType?: 'text' | 'shape' | 'image' | 'container';
}

export default function EffectsManager({
  currentEffects,
  onEffectsChange,
  onClose,
  selectedElementType = 'shape',
}: EffectsManagerProps) {
  const [activeTab, setActiveTab] = useState<'shadow' | 'reflection' | 'glow' | 'border' | 'filters' | 'transform'>('shadow');
  const [effects, setEffects] = useState<EffectsConfig>({
    ...DEFAULT_EFFECTS,
    ...currentEffects,
    shadow: { ...DEFAULT_EFFECTS.shadow, ...currentEffects.shadow },
    reflection: { ...DEFAULT_EFFECTS.reflection, ...currentEffects.reflection },
    glow: { ...DEFAULT_EFFECTS.glow, ...currentEffects.glow },
    border: { ...DEFAULT_EFFECTS.border, ...currentEffects.border },
    filters: { ...DEFAULT_EFFECTS.filters, ...currentEffects.filters },
    transform: { ...DEFAULT_EFFECTS.transform, ...currentEffects.transform },
  });

  const updateEffects = (updates: Partial<EffectsConfig>) => {
    const newEffects = { ...effects, ...updates };
    setEffects(newEffects);
    onEffectsChange(newEffects);
  };

  const updateShadow = (updates: Partial<EffectsConfig['shadow']>) => {
    updateEffects({ shadow: { ...effects.shadow, ...updates } });
  };

  const updateReflection = (updates: Partial<EffectsConfig['reflection']>) => {
    updateEffects({ reflection: { ...effects.reflection, ...updates } });
  };

  const updateGlow = (updates: Partial<EffectsConfig['glow']>) => {
    updateEffects({ glow: { ...effects.glow, ...updates } });
  };

  const updateBorder = (updates: Partial<EffectsConfig['border']>) => {
    updateEffects({ border: { ...effects.border, ...updates } });
  };

  const updateFilters = (updates: Partial<EffectsConfig['filters']>) => {
    updateEffects({ filters: { ...effects.filters, ...updates } });
  };

  const updateTransform = (updates: Partial<EffectsConfig['transform']>) => {
    updateEffects({ transform: { ...effects.transform, ...updates } });
  };

  const getPreviewStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    // Shadow
    if (effects.shadow.enabled) {
      const shadowColor = effects.shadow.color.startsWith('#')
        ? `${effects.shadow.color}${Math.round(effects.shadow.opacity * 255).toString(16).padStart(2, '0')}`
        : effects.shadow.color;
      const shadow = `${effects.shadow.offsetX}px ${effects.shadow.offsetY}px ${effects.shadow.blur}px ${shadowColor}`;
      style.boxShadow = effects.shadow.type === 'inner' ? `inset ${shadow}` : shadow;
    }

    // Border
    if (effects.border.enabled) {
      style.border = `${effects.border.width}px ${effects.border.style} ${effects.border.color}`;
      style.borderRadius = effects.border.radius;
    }

    // Filters
    const filterParts: string[] = [];
    if (effects.filters.brightness !== 100) filterParts.push(`brightness(${effects.filters.brightness}%)`);
    if (effects.filters.contrast !== 100) filterParts.push(`contrast(${effects.filters.contrast}%)`);
    if (effects.filters.saturation !== 100) filterParts.push(`saturate(${effects.filters.saturation}%)`);
    if (effects.filters.hueRotate !== 0) filterParts.push(`hue-rotate(${effects.filters.hueRotate}deg)`);
    if (effects.filters.blur > 0) filterParts.push(`blur(${effects.filters.blur}px)`);
    if (effects.filters.grayscale > 0) filterParts.push(`grayscale(${effects.filters.grayscale}%)`);
    if (effects.filters.sepia > 0) filterParts.push(`sepia(${effects.filters.sepia}%)`);
    if (effects.filters.invert > 0) filterParts.push(`invert(${effects.filters.invert}%)`);
    if (filterParts.length > 0) style.filter = filterParts.join(' ');

    // Transform
    const transformParts: string[] = [];
    if (effects.transform.rotate !== 0) transformParts.push(`rotate(${effects.transform.rotate}deg)`);
    if (effects.transform.scaleX !== 1 || effects.transform.scaleY !== 1) transformParts.push(`scale(${effects.transform.scaleX}, ${effects.transform.scaleY})`);
    if (effects.transform.skewX !== 0) transformParts.push(`skewX(${effects.transform.skewX}deg)`);
    if (effects.transform.skewY !== 0) transformParts.push(`skewY(${effects.transform.skewY}deg)`);
    if (transformParts.length > 0) style.transform = transformParts.join(' ');

    return style;
  };

  const tabs = [
    { id: 'shadow', label: 'Shadow', icon: '▢' },
    { id: 'reflection', label: 'Reflection', icon: '⬓' },
    { id: 'glow', label: 'Glow', icon: '◉' },
    { id: 'border', label: 'Border', icon: '☐' },
    { id: 'filters', label: 'Filters', icon: '◐' },
    { id: 'transform', label: 'Transform', icon: '↻' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Effects & Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === tab.id ? 'text-[#FEC00F] border-b-2 border-[#FEC00F]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Shadow Tab */}
          {activeTab === 'shadow' && (
            <div className="space-y-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={effects.shadow.enabled}
                  onChange={e => updateShadow({ enabled: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white">Enable Drop Shadow</span>
              </label>

              {effects.shadow.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Shadow Type</label>
                      <select
                        value={effects.shadow.type}
                        onChange={e => updateShadow({ type: e.target.value as any })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="drop">Drop Shadow</option>
                        <option value="inner">Inner Shadow</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Color</label>
                      <input
                        type="color"
                        value={effects.shadow.color}
                        onChange={e => updateShadow({ color: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Opacity: {Math.round(effects.shadow.opacity * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={effects.shadow.opacity}
                      onChange={e => updateShadow({ opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Blur: {effects.shadow.blur}px</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={effects.shadow.blur}
                      onChange={e => updateShadow({ blur: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Offset X: {effects.shadow.offsetX}px</label>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={effects.shadow.offsetX}
                        onChange={e => updateShadow({ offsetX: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Offset Y: {effects.shadow.offsetY}px</label>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={effects.shadow.offsetY}
                        onChange={e => updateShadow({ offsetY: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reflection Tab */}
          {activeTab === 'reflection' && (
            <div className="space-y-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={effects.reflection.enabled}
                  onChange={e => updateReflection({ enabled: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white">Enable Reflection</span>
              </label>

              {effects.reflection.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Opacity: {Math.round(effects.reflection.opacity * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={effects.reflection.opacity}
                      onChange={e => updateReflection({ opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Offset: {effects.reflection.offset}px</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={effects.reflection.offset}
                      onChange={e => updateReflection({ offset: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Blur: {effects.reflection.blur}px</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={effects.reflection.blur}
                      onChange={e => updateReflection({ blur: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Scale: {effects.reflection.scale * 100}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={effects.reflection.scale}
                      onChange={e => updateReflection({ scale: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Glow Tab */}
          {activeTab === 'glow' && (
            <div className="space-y-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={effects.glow.enabled}
                  onChange={e => updateGlow({ enabled: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white">Enable Glow Effect</span>
              </label>

              {effects.glow.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Glow Color</label>
                    <input
                      type="color"
                      value={effects.glow.color}
                      onChange={e => updateGlow({ color: e.target.value })}
                      className="w-full h-12 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Opacity: {Math.round(effects.glow.opacity * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={effects.glow.opacity}
                      onChange={e => updateGlow({ opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Blur Radius: {effects.glow.blur}px</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={effects.glow.blur}
                      onChange={e => updateGlow({ blur: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Border Tab */}
          {activeTab === 'border' && (
            <div className="space-y-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={effects.border.enabled}
                  onChange={e => updateBorder({ enabled: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white">Enable Border</span>
              </label>

              {effects.border.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Border Color</label>
                      <input
                        type="color"
                        value={effects.border.color}
                        onChange={e => updateBorder({ color: e.target.value })}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Border Style</label>
                      <select
                        value={effects.border.style}
                        onChange={e => updateBorder({ style: e.target.value as any })}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Width: {effects.border.width}px</label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={effects.border.width}
                        onChange={e => updateBorder({ width: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Radius: {effects.border.radius}px</label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={effects.border.radius}
                        onChange={e => updateBorder({ radius: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="space-y-4">
              {[
                { key: 'brightness', label: 'Brightness', min: 0, max: 200, default: 100, unit: '%' },
                { key: 'contrast', label: 'Contrast', min: 0, max: 200, default: 100, unit: '%' },
                { key: 'saturation', label: 'Saturation', min: 0, max: 200, default: 100, unit: '%' },
                { key: 'hueRotate', label: 'Hue Rotate', min: -180, max: 180, default: 0, unit: '°' },
                { key: 'blur', label: 'Blur', min: 0, max: 20, default: 0, unit: 'px' },
                { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, default: 0, unit: '%' },
                { key: 'sepia', label: 'Sepia', min: 0, max: 100, default: 0, unit: '%' },
                { key: 'invert', label: 'Invert', min: 0, max: 100, default: 0, unit: '%' },
              ].map(({ key, label, min, max, default: def, unit }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">{label}</label>
                    <span className="text-xs text-gray-400">
                      {effects.filters[key as keyof EffectsConfig['filters']]}{unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={effects.filters[key as keyof EffectsConfig['filters']]}
                      onChange={e => updateFilters({ [key]: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <button
                      onClick={() => updateFilters({ [key]: def })}
                      className="text-xs text-gray-500 hover:text-white px-2"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => updateFilters(DEFAULT_EFFECTS.filters)}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 mt-4"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Transform Tab */}
          {activeTab === 'transform' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-gray-500">Rotation</label>
                  <span className="text-xs text-gray-400">{effects.transform.rotate}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={effects.transform.rotate}
                  onChange={e => updateTransform({ rotate: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">Scale X</label>
                    <span className="text-xs text-gray-400">{effects.transform.scaleX.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.05"
                    value={effects.transform.scaleX}
                    onChange={e => updateTransform({ scaleX: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">Scale Y</label>
                    <span className="text-xs text-gray-400">{effects.transform.scaleY.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.05"
                    value={effects.transform.scaleY}
                    onChange={e => updateTransform({ scaleY: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">Skew X</label>
                    <span className="text-xs text-gray-400">{effects.transform.skewX}°</span>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={effects.transform.skewX}
                    onChange={e => updateTransform({ skewX: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-500">Skew Y</label>
                    <span className="text-xs text-gray-400">{effects.transform.skewY}°</span>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={effects.transform.skewY}
                    onChange={e => updateTransform({ skewY: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <button
                onClick={() => updateTransform(DEFAULT_EFFECTS.transform)}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Reset Transform
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Preview</span>
            <button
              onClick={() => {
                setEffects(DEFAULT_EFFECTS);
                onEffectsChange(DEFAULT_EFFECTS);
              }}
              className="text-xs text-gray-500 hover:text-white"
            >
              Reset All
            </button>
          </div>
          <div className="flex justify-center p-4 bg-[#1a1a1a] rounded-lg min-h-[100px]">
            <div
              className="w-24 h-24 bg-[#FEC00F] flex items-center justify-center text-[#212121] font-bold"
              style={getPreviewStyle()}
            >
              Sample
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_EFFECTS };