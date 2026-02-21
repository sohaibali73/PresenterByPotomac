'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'table' | 'chart';
  x: number;
  y: number;
  w: number;
  h: number;
  style?: Record<string, any>;
  content?: string | Record<string, any>;
  options?: Record<string, any>;
}

interface SlideConfig {
  background: { color?: string; image?: string; gradient?: any };
  elements: SlideElement[];
  master?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  layout_type: string;
  slide_config: SlideConfig;
  is_public: boolean;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
}

const SLIDE_WIDTH = 13.33;
const SLIDE_HEIGHT = 7.5;
const SCALE = 100;

const LAYOUT_TYPES = [
  { value: 'cover', label: 'Cover Slide' },
  { value: 'section_divider', label: 'Section Divider' },
  { value: 'content', label: 'Content Slide' },
  { value: 'chart', label: 'Chart Slide' },
  { value: 'table', label: 'Table Slide' },
  { value: 'three_column', label: 'Three Column' },
  { value: 'two_column', label: 'Two Column' },
  { value: 'full_image', label: 'Full Image' },
  { value: 'quote', label: 'Quote Slide' },
  { value: 'thank_you', label: 'Thank You' },
];

const PRESET_COLORS = [
  '#FEC00F', '#212121', '#FFFFFF', '#737373', '#C6C6C6', '#F5F5F5',
  '#1A2744', '#4CAF50', '#FF6B35', '#2D2D3D', '#1B2E1B', '#333333',
];

function generateId() {
  return 'el_' + Math.random().toString(36).substr(2, 9);
}

export default function TemplateEditor({ templateId, onSave, initialTemplate }: { templateId?: string; onSave?: (template: Template) => void; initialTemplate?: any }) {
  const [template, setTemplate] = useState<Partial<Template>>(initialTemplate || {
    name: 'New Template',
    category: 'custom',
    layout_type: 'content',
    slide_config: {
      background: { color: '#212121' },
      elements: []
    }
  });

  // Load initial template only once on mount
  const initialLoadedRef = useRef(false);
  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    
    if (initialTemplate) {
      setTemplate(initialTemplate);
    } else {
      const config = window.sessionStorage.getItem('new_template_config');
      if (config && !templateId) {
        try {
          const parsed = JSON.parse(config);
          setTemplate(parsed);
          window.sessionStorage.removeItem('new_template_config');
        } catch (e) {
          console.error('Failed to parse template config:', e);
        }
      }
    }
  }, []);
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elementX: number; elementY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: string; startX: number; startY: number; elementW: number; elementH: number; elementX: number; elementY: number } | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then(res => res.json())
        .then(data => {
          if (data.template) setTemplate(data.template);
        });
    }
  }, [templateId]);

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => setAssets(data.assets || []));
  }, []);

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    const element = template.slide_config?.elements.find(el => el.id === elementId);
    if (!element) return;
    setDragging({
      id: elementId,
      startX: e.clientX,
      startY: e.clientY,
      elementX: element.x,
      elementY: element.y
    });
  };

  const handleResizeStart = (e: React.MouseEvent, elementId: string, corner: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    const element = template.slide_config?.elements.find(el => el.id === elementId);
    if (!element) return;
    setResizing({
      id: elementId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      elementW: element.w,
      elementH: element.h,
      elementX: element.x,
      elementY: element.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / SCALE;
      const dy = (e.clientY - dragging.startY) / SCALE;
      setTemplate(prev => ({
        ...prev,
        slide_config: {
          ...prev.slide_config!,
          elements: prev.slide_config!.elements.map(el =>
            el.id === dragging.id
              ? { ...el, x: Math.max(0, Math.min(SLIDE_WIDTH - el.w, dragging.elementX + dx)), y: Math.max(0, Math.min(SLIDE_HEIGHT - el.h, dragging.elementY + dy)) }
              : el
          )
        }
      }));
    }
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / SCALE;
      const dy = (e.clientY - resizing.startY) / SCALE;
      let newW = resizing.elementW;
      let newH = resizing.elementH;
      let newX = resizing.elementX;
      let newY = resizing.elementY;
      
      if (resizing.corner.includes('e')) newW = Math.max(0.5, resizing.elementW + dx);
      if (resizing.corner.includes('w')) { newW = Math.max(0.5, resizing.elementW - dx); newX = resizing.elementX + dx; }
      if (resizing.corner.includes('s')) newH = Math.max(0.5, resizing.elementH + dy);
      if (resizing.corner.includes('n')) { newH = Math.max(0.5, resizing.elementH - dy); newY = resizing.elementY + dy; }
      
      setTemplate(prev => ({
        ...prev,
        slide_config: {
          ...prev.slide_config!,
          elements: prev.slide_config!.elements.map(el =>
            el.id === resizing.id ? { ...el, w: newW, h: newH, x: newX, y: newY } : el
          )
        }
      }));
    }
  }, [dragging, resizing]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const addElement = (type: SlideElement['type']) => {
    const newElement: SlideElement = {
      id: generateId(),
      type,
      x: 1,
      y: 1,
      w: type === 'text' ? 4 : type === 'chart' || type === 'table' ? 6 : 2,
      h: type === 'text' ? 1 : type === 'chart' || type === 'table' ? 4 : 2,
      style: { 
        color: '#FFFFFF',
        fontSize: 24,
        fontFace: 'Arial'
      },
      content: type === 'text' ? 'Double-click to edit' : undefined,
      options: type === 'shape' ? { shape: 'rect', fill: '#FEC00F' } : undefined
    };
    
    setTemplate(prev => ({
      ...prev,
      slide_config: {
        ...prev.slide_config!,
        elements: [...prev.slide_config!.elements, newElement]
      }
    }));
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<SlideElement>) => {
    setTemplate(prev => ({
      ...prev,
      slide_config: {
        ...prev.slide_config!,
        elements: prev.slide_config!.elements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        )
      }
    }));
  };

  const deleteElement = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      slide_config: {
        ...prev.slide_config!,
        elements: prev.slide_config!.elements.filter(el => el.id !== id)
      }
    }));
    setSelectedElement(null);
  };

  const addImageElement = (asset: Asset) => {
    const newElement: SlideElement = {
      id: generateId(),
      type: 'image',
      x: 1,
      y: 1,
      w: 3,
      h: 2,
      content: asset.url,
      options: { sizing: 'contain' }
    };
    setTemplate(prev => ({
      ...prev,
      slide_config: {
        ...prev.slide_config!,
        elements: [...prev.slide_config!.elements, newElement]
      }
    }));
    setShowAssetPicker(false);
    setSelectedElement(newElement.id);
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      const method = template.id ? 'PUT' : 'POST';
      const url = template.id ? `/api/templates/${template.id}` : '/api/templates';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      const data = await res.json();
      if (data.template) {
        setTemplate(data.template);
        onSave?.(data.template);
        alert('Template saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const selectedEl = template.slide_config?.elements.find(el => el.id === selectedElement);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] bg-gray-100 rounded-xl overflow-hidden">
      {/* Left Toolbar */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 gap-2">
        <button onClick={() => addElement('text')} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Add Text">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <button onClick={() => addElement('shape')} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Add Shape">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
          </svg>
        </button>
        <button onClick={() => setShowAssetPicker(true)} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Add Image">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button onClick={() => addElement('chart')} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Add Chart">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button onClick={() => addElement('table')} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Add Table">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
        <div
          ref={canvasRef}
          className="relative bg-white shadow-2xl"
          style={{
            width: SLIDE_WIDTH * SCALE,
            height: SLIDE_HEIGHT * SCALE,
            backgroundColor: template.slide_config?.background?.color || '#212121',
            backgroundImage: template.slide_config?.background?.image ? `url(${template.slide_config.background.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={() => setSelectedElement(null)}
        >
          {template.slide_config?.elements.map(el => (
            <div
              key={el.id}
              className={`absolute cursor-move ${selectedElement === el.id ? 'ring-2 ring-yellow-400' : ''}`}
              style={{
                left: el.x * SCALE,
                top: el.y * SCALE,
                width: el.w * SCALE,
                height: el.h * SCALE
              }}
              onMouseDown={(e) => handleMouseDown(e, el.id)}
            >
              {/* Render element based on type */}
              {el.type === 'text' && (
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  style={{
                    color: el.style?.color || '#FFFFFF',
                    fontSize: (el.style?.fontSize || 24) * (SCALE / 72),
                    fontFamily: el.style?.fontFace || 'Arial',
                    fontWeight: el.style?.bold ? 'bold' : 'normal',
                    textAlign: el.style?.align || 'center'
                  }}
                >
                  {el.content as string}
                </div>
              )}
              
              {el.type === 'shape' && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: el.options?.fill || '#FEC00F',
                    borderRadius: el.options?.shape === 'ellipse' ? '50%' : el.options?.shape === 'roundRect' ? '8px' : 0,
                    border: el.options?.line ? `2px solid ${el.options.line}` : undefined
                  }}
                />
              )}
              
              {el.type === 'image' && (
                <img
                  src={el.content as string}
                  alt=""
                  className="w-full h-full object-contain"
                />
              )}
              
              {el.type === 'chart' && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  [Chart Placeholder]
                </div>
              )}
              
              {el.type === 'table' && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  [Table Placeholder]
                </div>
              )}
              
              {/* Resize handles */}
              {selectedElement === el.id && (
                <>
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 cursor-nw-resize" onMouseDown={(e) => handleResizeStart(e, el.id, 'nw')} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 cursor-ne-resize" onMouseDown={(e) => handleResizeStart(e, el.id, 'ne')} />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, el.id, 'sw')} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, el.id, 'se')} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-4">Template Settings</h3>
        
        {/* Template Info */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={template.name || ''}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Layout Type</label>
            <select
              value={template.layout_type || 'content'}
              onChange={(e) => setTemplate(prev => ({ ...prev, layout_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {LAYOUT_TYPES.map(lt => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Background */}
        <h4 className="font-semibold text-gray-900 mb-2">Background</h4>
        <div className="flex flex-wrap gap-2 mb-6">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setTemplate(prev => ({
                ...prev,
                slide_config: { ...prev.slide_config!, background: { color } }
              }))}
              className={`w-8 h-8 rounded-lg border-2 ${
                template.slide_config?.background?.color === color ? 'border-yellow-400' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Selected Element Properties */}
        {selectedEl && (
          <>
            <h4 className="font-semibold text-gray-900 mb-2">Element Properties</h4>
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">X</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedEl.x.toFixed(1)}
                    onChange={(e) => updateElement(selectedEl.id, { x: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Y</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedEl.y.toFixed(1)}
                    onChange={(e) => updateElement(selectedEl.id, { y: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Width</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedEl.w.toFixed(1)}
                    onChange={(e) => updateElement(selectedEl.id, { w: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Height</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedEl.h.toFixed(1)}
                    onChange={(e) => updateElement(selectedEl.id, { h: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              
              {selectedEl.type === 'text' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500">Text</label>
                    <input
                      type="text"
                      value={selectedEl.content as string || ''}
                      onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Font Size</label>
                    <input
                      type="number"
                      value={selectedEl.style?.fontSize || 24}
                      onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style, fontSize: parseInt(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Color</label>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => updateElement(selectedEl.id, { style: { ...selectedEl.style, color } })}
                          className={`w-6 h-6 rounded ${
                            selectedEl.style?.color === color ? 'ring-2 ring-yellow-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {selectedEl.type === 'shape' && (
                <div>
                  <label className="block text-xs text-gray-500">Fill Color</label>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateElement(selectedEl.id, { options: { ...selectedEl.options, fill: color } })}
                        className={`w-6 h-6 rounded ${
                          selectedEl.options?.fill === color ? 'ring-2 ring-yellow-400' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => deleteElement(selectedEl.id)}
                className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                Delete Element
              </button>
            </div>
          </>
        )}

        {/* Save Button */}
        <button
          onClick={saveTemplate}
          disabled={saving}
          className="w-full mt-6 px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAssetPicker(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Select Image</h3>
            {assets.length === 0 ? (
              <p className="text-gray-500">No assets uploaded yet. Upload some in the Asset Library.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {assets.filter(a => a.type === 'image' || a.type === 'logo' || a.type === 'icon').map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => addImageElement(asset)}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 ring-yellow-400"
                  >
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}