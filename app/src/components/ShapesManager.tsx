'use client';
import { useState } from 'react';

export interface ShapeConfig {
  type: 'rect' | 'roundRect' | 'ellipse' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'star' | 'arrow' | 'chevron' | 'callout' | 'custom';
  fill: {
    type: 'solid' | 'gradient' | 'pattern' | 'none';
    color: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      angle?: number;
    };
    pattern?: {
      type: 'dots' | 'stripes' | 'grid';
      color: string;
    };
    opacity: number;
  };
  stroke: {
    enabled: boolean;
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
  corners: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };
  dimensions: {
    width: number;
    height: number;
    lockAspectRatio: boolean;
  };
}

export interface LineConfig {
  type: 'line' | 'arrow' | 'doubleArrow' | 'connector';
  start: { x: number; y: number };
  end: { x: number; y: number };
  stroke: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
    cap: 'butt' | 'round' | 'square';
  };
  arrowStart: {
    enabled: boolean;
    type: 'arrow' | 'circle' | 'square' | 'diamond';
    size: number;
  };
  arrowEnd: {
    enabled: boolean;
    type: 'arrow' | 'circle' | 'square' | 'diamond';
    size: number;
  };
  curve?: {
    enabled: boolean;
    curvature: number;
  };
}

const SHAPE_CATEGORIES = [
  {
    name: 'Basic Shapes',
    shapes: [
      { id: 'rect', name: 'Rectangle', icon: '▢' },
      { id: 'roundRect', name: 'Rounded Rectangle', icon: '▢' },
      { id: 'ellipse', name: 'Ellipse', icon: '○' },
      { id: 'triangle', name: 'Triangle', icon: '△' },
      { id: 'diamond', name: 'Diamond', icon: '◇' },
    ],
  },
  {
    name: 'Polygons',
    shapes: [
      { id: 'pentagon', name: 'Pentagon', icon: '⬠' },
      { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
      { id: 'star', name: 'Star', icon: '☆' },
    ],
  },
  {
    name: 'Arrows',
    shapes: [
      { id: 'arrow', name: 'Arrow', icon: '→' },
      { id: 'chevron', name: 'Chevron', icon: '»' },
    ],
  },
  {
    name: 'Callouts',
    shapes: [
      { id: 'callout', name: 'Callout', icon: '💬' },
    ],
  },
];

const LINE_STYLES = [
  { id: 'line', name: 'Simple Line', icon: '—' },
  { id: 'arrow', name: 'Arrow', icon: '→' },
  { id: 'doubleArrow', name: 'Double Arrow', icon: '↔' },
  { id: 'connector', name: 'Connector', icon: '⤢' },
];

const DEFAULT_SHAPE: ShapeConfig = {
  type: 'rect',
  fill: { type: 'solid', color: '#FEC00F', opacity: 1 },
  stroke: { enabled: false, color: '#000000', width: 1, style: 'solid' },
  corners: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
  dimensions: { width: 2.5, height: 2.5, lockAspectRatio: true },
};

const DEFAULT_LINE: LineConfig = {
  type: 'line',
  start: { x: 0, y: 0 },
  end: { x: 5, y: 0 },
  stroke: { color: '#FEC00F', width: 2, style: 'solid', cap: 'round' },
  arrowStart: { enabled: false, type: 'arrow', size: 10 },
  arrowEnd: { enabled: false, type: 'arrow', size: 10 },
  curve: { enabled: false, curvature: 0 },
};

interface ShapesManagerProps {
  onAddShape: (shape: ShapeConfig) => void;
  onAddLine: (line: LineConfig) => void;
  onClose: () => void;
}

export default function ShapesManager({ onAddShape, onAddLine, onClose }: ShapesManagerProps) {
  const [mode, setMode] = useState<'shapes' | 'lines'>('shapes');
  const [selectedShape, setSelectedShape] = useState<string>('rect');
  const [shapeConfig, setShapeConfig] = useState<ShapeConfig>(DEFAULT_SHAPE);
  const [lineConfig, setLineConfig] = useState<LineConfig>(DEFAULT_LINE);
  const [activeCategory, setActiveCategory] = useState(0);

  const updateShapeFill = (updates: Partial<ShapeConfig['fill']>) => {
    setShapeConfig(prev => ({
      ...prev,
      fill: { ...prev.fill, ...updates },
    }));
  };

  const updateShapeStroke = (updates: Partial<ShapeConfig['stroke']>) => {
    setShapeConfig(prev => ({
      ...prev,
      stroke: { ...prev.stroke, ...updates },
    }));
  };

  const updateLineStroke = (updates: Partial<LineConfig['stroke']>) => {
    setLineConfig(prev => ({
      ...prev,
      stroke: { ...prev.stroke, ...updates },
    }));
  };

  const getShapeClipPath = (type: string): string | undefined => {
    const paths: Record<string, string> = {
      triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
      hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
      star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      arrow: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
      chevron: 'polygon(75% 0%, 100% 50%, 75% 100%, 50% 50%)',
    };
    return paths[type];
  };

  const getShapePreviewStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      width: 80,
      height: 80,
      backgroundColor: shapeConfig.fill.type !== 'none' ? shapeConfig.fill.color : 'transparent',
      opacity: shapeConfig.fill.opacity,
      borderRadius: shapeConfig.type === 'ellipse' ? '50%' : shapeConfig.type === 'roundRect' ? 12 : 0,
      clipPath: getShapeClipPath(shapeConfig.type),
    };

    if (shapeConfig.stroke.enabled) {
      style.border = `${shapeConfig.stroke.width}px ${shapeConfig.stroke.style} ${shapeConfig.stroke.color}`;
    }

    return style;
  };

  const handleAddShape = () => {
    onAddShape({ ...shapeConfig, type: selectedShape as any });
  };

  const handleAddLine = () => {
    onAddLine(lineConfig);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Shapes & Lines</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setMode('shapes')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              mode === 'shapes' ? 'text-[#FEC00F] border-b-2 border-[#FEC00F]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Shapes
          </button>
          <button
            onClick={() => setMode('lines')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              mode === 'lines' ? 'text-[#FEC00F] border-b-2 border-[#FEC00F]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Lines & Arrows
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Left Panel - Shape/Line Selection */}
          <div className="w-64 border-r border-gray-700 overflow-y-auto p-4">
            {mode === 'shapes' ? (
              <div className="space-y-4">
                {SHAPE_CATEGORIES.map((category, catIdx) => (
                  <div key={category.name}>
                    <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">{category.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.shapes.map(shape => (
                        <button
                          key={shape.id}
                          onClick={() => {
                            setSelectedShape(shape.id);
                            setShapeConfig(prev => ({ ...prev, type: shape.id as any }));
                          }}
                          className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                            selectedShape === shape.id ? 'border-[#FEC00F] bg-[#FEC00F]/10' : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-2xl">{shape.icon}</span>
                          <span className="text-[8px] text-gray-400">{shape.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {LINE_STYLES.map(line => (
                  <button
                    key={line.id}
                    onClick={() => {
                      setLineConfig(prev => ({ ...prev, type: line.id as any }));
                    }}
                    className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                      lineConfig.type === line.id ? 'border-[#FEC00F] bg-[#FEC00F]/10' : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-2xl">{line.icon}</span>
                    <span className="text-sm text-white">{line.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Configuration */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {mode === 'shapes' ? (
              <>
                {/* Fill Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Fill</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {['solid', 'gradient', 'pattern', 'none'].map(fillType => (
                        <button
                          key={fillType}
                          onClick={() => updateShapeFill({ type: fillType as any })}
                          className={`py-2 text-xs rounded capitalize ${
                            shapeConfig.fill.type === fillType ? 'bg-[#FEC00F] text-black' : 'bg-gray-700 text-white'
                          }`}
                        >
                          {fillType}
                        </button>
                      ))}
                    </div>
                    {shapeConfig.fill.type === 'solid' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={shapeConfig.fill.color}
                          onChange={e => updateShapeFill({ color: e.target.value })}
                          className="w-12 h-12 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={shapeConfig.fill.color}
                          onChange={e => updateShapeFill({ color: e.target.value })}
                          className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Opacity: {Math.round(shapeConfig.fill.opacity * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={shapeConfig.fill.opacity}
                        onChange={e => updateShapeFill({ opacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Stroke Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Stroke</h4>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={shapeConfig.stroke.enabled}
                      onChange={e => updateShapeStroke({ enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-400">Enable Stroke</span>
                  </label>
                  {shapeConfig.stroke.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Color</label>
                        <input
                          type="color"
                          value={shapeConfig.stroke.color}
                          onChange={e => updateShapeStroke({ color: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Width</label>
                        <input
                          type="number"
                          value={shapeConfig.stroke.width}
                          onChange={e => updateShapeStroke({ width: parseInt(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white"
                          min="1"
                          max="20"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Corner Radius for roundRect */}
                {shapeConfig.type === 'roundRect' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Corner Radius</h4>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={shapeConfig.corners.topLeft}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setShapeConfig(prev => ({
                          ...prev,
                          corners: { topLeft: val, topRight: val, bottomRight: val, bottomLeft: val },
                        }));
                      }}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Preview */}
                <div className="flex justify-center py-6 bg-[#0a0a0a] rounded-lg">
                  <div style={getShapePreviewStyle()} />
                </div>
              </>
            ) : (
              <>
                {/* Line Stroke Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Line Style</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Color</label>
                        <input
                          type="color"
                          value={lineConfig.stroke.color}
                          onChange={e => updateLineStroke({ color: e.target.value })}
                          className="w-full h-12 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Width: {lineConfig.stroke.width}px</label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={lineConfig.stroke.width}
                          onChange={e => updateLineStroke({ width: parseInt(e.target.value) })}
                          className="w-full mt-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Style</label>
                        <select
                          value={lineConfig.stroke.style}
                          onChange={e => updateLineStroke({ style: e.target.value as any })}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white"
                        >
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Cap</label>
                        <select
                          value={lineConfig.stroke.cap}
                          onChange={e => updateLineStroke({ cap: e.target.value as any })}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white"
                        >
                          <option value="butt">Flat</option>
                          <option value="round">Round</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow Settings */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Arrows</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={lineConfig.arrowStart.enabled}
                          onChange={e => setLineConfig(prev => ({
                            ...prev,
                            arrowStart: { ...prev.arrowStart, enabled: e.target.checked },
                          }))}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-gray-400">Start Arrow</span>
                      </label>
                      {lineConfig.arrowStart.enabled && (
                        <select
                          value={lineConfig.arrowStart.type}
                          onChange={e => setLineConfig(prev => ({
                            ...prev,
                            arrowStart: { ...prev.arrowStart, type: e.target.value as any },
                          }))}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="arrow">Arrow</option>
                          <option value="circle">Circle</option>
                          <option value="square">Square</option>
                          <option value="diamond">Diamond</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={lineConfig.arrowEnd.enabled}
                          onChange={e => setLineConfig(prev => ({
                            ...prev,
                            arrowEnd: { ...prev.arrowEnd, enabled: e.target.checked },
                          }))}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-gray-400">End Arrow</span>
                      </label>
                      {lineConfig.arrowEnd.enabled && (
                        <select
                          value={lineConfig.arrowEnd.type}
                          onChange={e => setLineConfig(prev => ({
                            ...prev,
                            arrowEnd: { ...prev.arrowEnd, type: e.target.value as any },
                          }))}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="arrow">Arrow</option>
                          <option value="circle">Circle</option>
                          <option value="square">Square</option>
                          <option value="diamond">Diamond</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex justify-center items-center py-6 bg-[#0a0a0a] rounded-lg min-h-[100px]">
                  <svg width="200" height="40" viewBox="0 0 200 40">
                    <defs>
                      {lineConfig.arrowStart.enabled && (
                        <marker
                          id="arrowStart"
                          markerWidth="10"
                          markerHeight="10"
                          refX="5"
                          refY="5"
                          orient="auto-start-reverse"
                        >
                          <path
                            d={lineConfig.arrowStart.type === 'arrow' ? 'M0,5 L10,0 L10,10 Z' :
                               lineConfig.arrowStart.type === 'circle' ? 'M5,5 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0' :
                               lineConfig.arrowStart.type === 'diamond' ? 'M0,5 L5,0 L10,5 L5,10 Z' : 'M0,0 L10,5 L0,10 Z'}
                            fill={lineConfig.stroke.color}
                          />
                        </marker>
                      )}
                      {lineConfig.arrowEnd.enabled && (
                        <marker
                          id="arrowEnd"
                          markerWidth="10"
                          markerHeight="10"
                          refX="5"
                          refY="5"
                          orient="auto"
                        >
                          <path
                            d={lineConfig.arrowEnd.type === 'arrow' ? 'M0,0 L10,5 L0,10 Z' :
                               lineConfig.arrowEnd.type === 'circle' ? 'M5,5 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0' :
                               lineConfig.arrowEnd.type === 'diamond' ? 'M0,5 L5,0 L10,5 L5,10 Z' : 'M0,0 L10,5 L0,10 Z'}
                            fill={lineConfig.stroke.color}
                          />
                        </marker>
                      )}
                    </defs>
                    <line
                      x1="20"
                      y1="20"
                      x2="180"
                      y2="20"
                      stroke={lineConfig.stroke.color}
                      strokeWidth={lineConfig.stroke.width}
                      strokeDasharray={lineConfig.stroke.style === 'dashed' ? '8,4' : lineConfig.stroke.style === 'dotted' ? '2,4' : undefined}
                      strokeLinecap={lineConfig.stroke.cap}
                      markerStart={lineConfig.arrowStart.enabled ? 'url(#arrowStart)' : undefined}
                      markerEnd={lineConfig.arrowEnd.enabled ? 'url(#arrowEnd)' : undefined}
                    />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#0a0a0a] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={mode === 'shapes' ? handleAddShape : handleAddLine}
            className="px-6 py-2 bg-[#FEC00F] text-[#212121] font-bold rounded-lg hover:bg-yellow-400"
          >
            Add {mode === 'shapes' ? 'Shape' : 'Line'}
          </button>
        </div>
      </div>
    </div>
  );
}