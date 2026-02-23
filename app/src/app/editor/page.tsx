'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
const AssetPicker = dynamic(() => import('@/components/AssetPicker'), { ssr: false });
import InteractiveCanvas, { CanvasElement, generateId } from '@/components/InteractiveCanvas';
import QuickActions, { useQuickActions } from '@/components/QuickActions';
import AlignmentTools, { alignElements, distributeElements } from '@/components/AlignmentTools';
import SlideThumbnails, { SlideNavArrows } from '@/components/SlideThumbnails';
import AISuggestions, { useAISuggestions } from '@/components/AISuggestions';
import SmartGenerateModal, { SmartGenerateFAB } from '@/components/SmartGenerateModal';
import AnimationEditor from '@/components/AnimationEditor';
import { useKeyboardShortcuts, getEditorShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import ShortcutsModal from '@/components/ShortcutsModal';
import RecoveryModal from '@/components/RecoveryModal';
import ChartBuilder from '@/components/ChartBuilder';
import ThemeManager, { ThemeConfig, PRESET_THEMES } from '@/components/ThemeManager';
import BackgroundManager, { BackgroundConfig } from '@/components/BackgroundManager';
import EffectsManager, { EffectsConfig, DEFAULT_EFFECTS } from '@/components/EffectsManager';
import ShapesManager, { ShapeConfig, LineConfig } from '@/components/ShapesManager';
import MasterSlideEditor, { MasterSlideConfig } from '@/components/MasterSlideEditor';
import { layoutToElements, getSlideBackground, THEMES } from '@/lib/layout-to-elements';
import { syncElementsToSlide } from '@/lib/elements-to-layout';

const LAYOUT_OPTIONS = [
  'cover', 'section_divider', 'three_pillars', 'chart', 'composite_three',
  'composite_four', 'five_component_diagram', 'strategy_table', 'risk_statistics',
  'use_cases', 'thank_you', 'disclosures', 'definitions'
];

const SHAPES: { id: string; label: string; icon: string }[] = [
  { id: 'rect', label: 'Rectangle', icon: '▢' },
  { id: 'roundRect', label: 'Rounded', icon: '▢' },
  { id: 'ellipse', label: 'Circle', icon: '○' },
  { id: 'triangle', label: 'Triangle', icon: '△' },
  { id: 'diamond', label: 'Diamond', icon: '◇' },
  { id: 'star', label: 'Star', icon: '☆' },
  { id: 'arrow', label: 'Arrow', icon: '→' },
];

const COLORS = ['#FEC00F', '#212121', '#FFFFFF', '#737373', '#C6C6C6', '#F5F5F5', '#1A2744', '#4CAF50', '#FF6B35', '#2D2D3D'];

interface EditorSlide {
  layout: string;
  _positions?: Record<string, { x: number; y: number; w: number; h: number }>;
  _customElements?: CanvasElement[];
  [key: string]: any;
}

export default function EditorPage() {
  const [outline, setOutline] = useState<any>(null);
  const [slides, setSlides] = useState<EditorSlide[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editJson, setEditJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pptx_base64: string; filename: string } | null>(null);
  const [theme, setTheme] = useState('classic');
  const [dirty, setDirty] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [savedPresentations, setSavedPresentations] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Interactive canvas state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(75);
  const [showShapePicker, setShowShapePicker] = useState(false);
  
  // Phase 1 features
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  
  // Phase 2 features - Advanced editing
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [showBackgroundManager, setShowBackgroundManager] = useState(false);
  const [showEffectsManager, setShowEffectsManager] = useState(false);
  const [showShapesManager, setShowShapesManager] = useState(false);
  const [showMasterEditor, setShowMasterEditor] = useState(false);
  
  // Extended theme and styling state
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(PRESET_THEMES[0]);
  const [slideBackground, setSlideBackground] = useState<BackgroundConfig>({ type: 'solid', color: '#212121' });
  const [elementEffects, setElementEffects] = useState<EffectsConfig>(DEFAULT_EFFECTS);
  const [masterConfig, setMasterConfig] = useState<MasterSlideConfig>({
    logo: { enabled: false, position: 'top-left', width: 1.5, height: 0.5, opacity: 1 },
    footer: { enabled: true, text: 'Potomac Fund Management', position: 'left', includeSlideNumber: true, includeDate: false, fontSize: 8, color: '#737373' },
    background: { applyToAll: false },
    fonts: { headingFont: 'Rajdhani', bodyFont: 'Rajdhani', headingSize: 32, bodySize: 14, headingColor: '#FFFFFF', bodyColor: '#FFFFFF' },
    accentBar: { enabled: true, position: 'top', height: 0.08, color: '#FEC00F' },
    slideNumber: { enabled: true, position: 'bottom-right', format: 'number-of-total', fontSize: 9, color: '#737373' },
  });
  
  // Undo/Redo with history
  const {
    state: slidesHistory,
    pushState: pushSlidesHistory,
    undo: undoSlides,
    redo: redoSlides,
    canUndo,
    canRedo,
  } = useUndoRedo<EditorSlide[]>([]);
  
  // Auto-save hook
  const {
    state: autoSaveState,
    save: manualSave,
    markDirty,
    markClean,
    recoverDraft,
  } = useAutoSave(
    { outline, slides, theme, presentationId },
    {
      key: 'editor_autosave',
      type: 'editor',
      title: outline?.title || 'Untitled Presentation',
      interval: 30000,
      enabled: slides.length > 0,
    }
  );
  
  // Recovery modal state
  const [recoverableDraft, setRecoverableDraft] = useState<any>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Load from sessionStorage or fetch saved presentations
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('editor_presentation');
      if (stored) {
        const data = JSON.parse(stored);
        setOutline(data.outline);
        setSlides(data.outline?.slides || []);
        setTheme(data.theme || 'classic');
        if (data.pptx_base64) {
          setResult({ pptx_base64: data.pptx_base64, filename: data.filename || 'presentation.pptx' });
        }
        return;
      }
    } catch (e) {
      console.error('Failed to load editor data:', e);
    }
    // No sessionStorage data — fetch saved presentations
    fetchSavedPresentations();
  }, []);

  const fetchSavedPresentations = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/presentations');
      const data = await res.json();
      setSavedPresentations(data.presentations || []);
    } catch (e) {
      console.error('Failed to fetch presentations:', e);
    } finally {
      setLoadingList(false);
    }
  };

  const loadPresentationById = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/presentations/${id}`);
      const data = await res.json();
      if (data.presentation) {
        const p = data.presentation;
        setOutline(p.outline);
        setSlides(p.outline?.slides || []);
        setTheme(p.theme || 'classic');
        if (p.pptx_base64) {
          setResult({ pptx_base64: p.pptx_base64, filename: p.title || 'presentation.pptx' });
        }
      }
    } catch (e) {
      console.error('Failed to load presentation:', e);
    } finally {
      setLoading(false);
    }
  };

  // Update JSON editor when slide selection changes
  useEffect(() => {
    if (slides[selectedIdx]) {
      setEditJson(JSON.stringify(slides[selectedIdx], null, 2));
      setJsonError(null);
    }
  }, [selectedIdx, slides]);

  const handleJsonChange = (value: string) => {
    setEditJson(value);
    setDirty(true);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const applyJsonEdit = () => {
    try {
      const parsed = JSON.parse(editJson);
      const newSlides = [...slides];
      newSlides[selectedIdx] = parsed;
      setSlides(newSlides);
      setJsonError(null);
      setDirty(true);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const handleAddSlide = (layout: string) => {
    const newSlide: EditorSlide = { layout };
    if (layout === 'cover') newSlide.title = 'NEW SLIDE';
    else if (layout === 'section_divider') newSlide.section_title = 'NEW SECTION';
    else if (layout === 'chart') { newSlide.chart_title = 'CHART TITLE'; newSlide.chart_caption = ''; }
    else if (layout === 'three_pillars') { newSlide.title = 'THREE PILLARS'; newSlide.pillars = [{ label: 'PILLAR 1', description: '' }, { label: 'PILLAR 2', description: '' }, { label: 'PILLAR 3', description: '' }]; }
    else newSlide.title = layout.toUpperCase().replace(/_/g, ' ');

    const newSlides = [...slides];
    newSlides.splice(selectedIdx + 1, 0, newSlide);
    setSlides(newSlides);
    setSelectedIdx(selectedIdx + 1);
    setDirty(true);
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);
    if (selectedIdx >= newSlides.length) setSelectedIdx(newSlides.length - 1);
    setDirty(true);
  };

  const handleMoveSlide = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[idx], newSlides[newIdx]] = [newSlides[newIdx], newSlides[idx]];
    setSlides(newSlides);
    setSelectedIdx(newIdx);
    setDirty(true);
  };

  const handleDuplicate = (idx: number) => {
    const newSlides = [...slides];
    newSlides.splice(idx + 1, 0, JSON.parse(JSON.stringify(slides[idx])));
    setSlides(newSlides);
    setSelectedIdx(idx + 1);
    setDirty(true);
  };

  const handleRebuild = async () => {
    if (slides.length === 0) return;
    setLoading(true);
    try {
      const fullOutline = { ...outline, slides };
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline: fullOutline, theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ pptx_base64: data.pptx_base64, filename: data.filename });
      setOutline(fullOutline);
      setDirty(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Rebuild failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([Uint8Array.from(atob(result.pptx_base64), c => c.charCodeAt(0))],
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Convert current slide to canvas elements
  const canvasElements = useMemo(() => {
    const slide = slides[selectedIdx];
    if (!slide) return [];
    
    // Get base elements from layout
    const baseElements = layoutToElements(slide, theme);
    
    // Add custom elements if any
    const customElements = slide._customElements || [];
    
    return [...baseElements, ...customElements];
  }, [slides, selectedIdx, theme]);

  // Get background for current slide
  const canvasBackground = useMemo(() => {
    const slide = slides[selectedIdx];
    if (!slide) return { color: '#212121' };
    return getSlideBackground(slide, theme);
  }, [slides, selectedIdx, theme]);

  // Handle canvas element changes
  const handleCanvasChange = useCallback((newElements: CanvasElement[]) => {
    const currentSlide = slides[selectedIdx];
    if (!currentSlide) return;
    
    // Sync changes back to slide data
    const updatedSlide = syncElementsToSlide(newElements, currentSlide);
    
    // Extract custom elements (those that don't match standard IDs)
    const customElements = newElements.filter(el => {
      const standardIds = getStandardElementIdsForLayout(currentSlide.layout);
      return !standardIds.includes(el.id);
    });
    
    updatedSlide._customElements = customElements;
    
    const newSlides = [...slides];
    newSlides[selectedIdx] = updatedSlide;
    setSlides(newSlides);
    setDirty(true);
  }, [slides, selectedIdx]);

  // Add element functions
  const addTextElement = useCallback(() => {
    const currentSlide = slides[selectedIdx];
    if (!currentSlide) return;
    
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'text',
      x: 1.5,
      y: 1.5,
      w: 5,
      h: 1.2,
      content: 'Click to edit',
      style: { fontSize: 24, color: '#FFFFFF', fontFace: "'Rajdhani', sans-serif", bold: false, align: 'center' },
    };
    
    const customElements = currentSlide._customElements || [];
    const updatedSlide = {
      ...currentSlide,
      _customElements: [...customElements, newElement],
    };
    
    const newSlides = [...slides];
    newSlides[selectedIdx] = updatedSlide;
    setSlides(newSlides);
    setSelectedElementId(newElement.id);
    setDirty(true);
  }, [slides, selectedIdx]);

  const addShapeElement = useCallback((shapeId: string) => {
    const currentSlide = slides[selectedIdx];
    if (!currentSlide) return;
    
    const C = THEMES[theme] || THEMES.classic;
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'shape',
      x: 1.5,
      y: 1.5,
      w: 2.5,
      h: 2.5,
      options: { shape: shapeId, fill: C.YELLOW },
    };
    
    const customElements = currentSlide._customElements || [];
    const updatedSlide = {
      ...currentSlide,
      _customElements: [...customElements, newElement],
    };
    
    const newSlides = [...slides];
    newSlides[selectedIdx] = updatedSlide;
    setSlides(newSlides);
    setSelectedElementId(newElement.id);
    setDirty(true);
    setShowShapePicker(false);
  }, [slides, selectedIdx, theme]);

  const addImageElement = useCallback((url: string) => {
    const currentSlide = slides[selectedIdx];
    if (!currentSlide) return;
    
    const newElement: CanvasElement = {
      id: generateId(),
      type: 'image',
      x: 1,
      y: 1,
      w: 4,
      h: 3,
      content: url,
    };
    
    const customElements = currentSlide._customElements || [];
    const updatedSlide = {
      ...currentSlide,
      _customElements: [...customElements, newElement],
    };
    
    const newSlides = [...slides];
    newSlides[selectedIdx] = updatedSlide;
    setSlides(newSlides);
    setSelectedElementId(newElement.id);
    setDirty(true);
  }, [slides, selectedIdx]);

  // Handle chart insertion
  const handleChartReady = (config: any, imageUrl: string) => {
    const newSlides = [...slides];
    newSlides[selectedIdx] = { 
      ...newSlides[selectedIdx], 
      image_url: imageUrl,
      chart_config: config,
    };
    setSlides(newSlides);
    setDirty(true);
    setShowChartBuilder(false);
  };

  // Keyboard shortcuts
  const keyboardShortcuts = getEditorShortcuts({
    onSave: () => manualSave(),
    onUndo: () => { if (canUndo) undoSlides(); },
    onRedo: () => { if (canRedo) redoSlides(); },
    onPrevSlide: () => setSelectedIdx(Math.max(0, selectedIdx - 1)),
    onNextSlide: () => setSelectedIdx(Math.min(slides.length - 1, selectedIdx + 1)),
    onDeleteSlide: () => { if (slides.length > 1) handleDeleteSlide(selectedIdx); },
    onDuplicateSlide: () => handleDuplicate(selectedIdx),
    onExport: () => handleDownload(),
    onHelp: () => setShowShortcutsModal(true),
  });
  
  useKeyboardShortcuts(keyboardShortcuts, slides.length > 0);

  const currentSlide = slides[selectedIdx];
  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    return canvasElements.find(el => el.id === selectedElementId);
  }, [selectedElementId, canvasElements]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-3">
              <img src="/potomac-logo.png" alt="Potomac" className="h-7 object-contain" />
              <span className="text-gray-400 text-sm font-light hidden sm:block">Presenter</span>
            </a>
            <nav className="hidden md:flex items-center gap-1">
              <a href="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Generate</a>
              <a href="/editor" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium rounded-lg bg-[#FEC00F]/10">Editor</a>
              <a href="/templates" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Templates</a>
              <a href="/assets" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Assets</a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <select value={theme} onChange={e => { setTheme(e.target.value); setDirty(true); }}
              className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]">
              <option value="classic">Classic</option>
              <option value="navy">Navy</option>
              <option value="forest">Forest</option>
              <option value="slate">Slate</option>
              <option value="minimal">Minimal</option>
            </select>
            {dirty && (
              <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Unsaved</span>
            )}
            <button onClick={handleRebuild} disabled={loading || slides.length === 0}
              className="px-4 py-1.5 bg-[#FEC00F] text-[#212121] font-bold rounded-lg text-xs hover:bg-yellow-400 disabled:opacity-40 transition-all">
              {loading ? 'Building...' : 'Rebuild PPTX'}
            </button>
            {result && (
              <button onClick={handleDownload}
                className="px-4 py-1.5 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-500 transition-all">
                Download
              </button>
            )}
          </div>
        </div>
      </header>

      {/* No data state — show presentation picker */}
      {slides.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <img src="/potomac-icon.png" alt="" className="w-14 h-14 mx-auto mb-4 opacity-40 object-contain" />
              <p className="text-gray-400 text-lg font-semibold mb-1">Open a Presentation</p>
              <p className="text-gray-600 text-sm">Choose a saved presentation to edit, or generate a new one</p>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : savedPresentations.length > 0 ? (
              <div className="space-y-2 mb-6">
                {savedPresentations.map((p: any) => (
                  <button key={p.id} onClick={() => loadPresentationById(p.id)}
                    className="w-full bg-[#1a1a1a] hover:bg-[#212121] border border-gray-800 hover:border-[#FEC00F]/40 rounded-xl p-4 flex items-center gap-4 transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-[#FEC00F]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#FEC00F] text-lg font-bold">P</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-[#FEC00F] transition-colors truncate">{p.title}</p>
                      <p className="text-[10px] text-gray-500">{p.slide_count || '?'} slides · {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-gray-600 group-hover:text-[#FEC00F] text-sm transition-colors">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#1a1a1a] rounded-xl border border-gray-800 mb-6">
                <p className="text-gray-500 text-sm">No saved presentations yet</p>
              </div>
            )}

            <div className="text-center">
              <a href="/" className="px-6 py-3 bg-[#FEC00F] text-[#212121] font-bold rounded-xl hover:bg-yellow-400 transition-all inline-block">
                Generate New Presentation
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Layout */}
      {slides.length > 0 && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Slide List */}
          <div className="w-48 bg-[#141414] border-r border-gray-800 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-gray-800/50 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Slides ({slides.length})</span>
              <div className="relative group">
                <button className="text-[10px] text-[#FEC00F] hover:text-yellow-300 font-medium">+ Add</button>
                <div className="absolute left-0 top-full mt-1 bg-[#212121] border border-gray-700 rounded-lg p-1 hidden group-hover:block z-20 w-40 shadow-xl">
                  {LAYOUT_OPTIONS.map(layout => (
                    <button key={layout} onClick={() => handleAddSlide(layout)}
                      className="block w-full text-left px-2 py-1 text-[10px] text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors">
                      {layout.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {slides.map((slide, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedIdx(i); setSelectedElementId(null); }}
                  className={`mx-1.5 mb-1 rounded-lg px-2 py-2 cursor-pointer transition-all group relative ${
                    selectedIdx === i ? 'bg-[#FEC00F]/15 border border-[#FEC00F]/40' : 'hover:bg-[#1a1a1a] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#0a0a0a] rounded text-[9px] font-bold text-gray-400 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-300 truncate">
                        {slide.title || slide.section_title || slide.headline || slide.chart_title || slide.layout}
                      </p>
                      <p className="text-[9px] text-gray-600">{slide.layout?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute right-1 top-1 hidden group-hover:flex items-center gap-0.5">
                    <button onClick={e => { e.stopPropagation(); handleMoveSlide(i, -1); }} className="text-[9px] text-gray-500 hover:text-white p-0.5" title="Move up">↑</button>
                    <button onClick={e => { e.stopPropagation(); handleMoveSlide(i, 1); }} className="text-[9px] text-gray-500 hover:text-white p-0.5" title="Move down">↓</button>
                    <button onClick={e => { e.stopPropagation(); handleDuplicate(i); }} className="text-[9px] text-gray-500 hover:text-white p-0.5" title="Duplicate">⧉</button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteSlide(i); }} className="text-[9px] text-gray-500 hover:text-red-400 p-0.5" title="Delete">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Interactive Canvas */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mr-2">Insert</span>
              
              <button onClick={addTextElement} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Add Text">
                <span className="font-bold text-sm">T</span>
                <span>Text</span>
              </button>
              
              <div className="relative">
                <button onClick={() => setShowShapePicker(!showShapePicker)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Add Shape">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2}/></svg>
                  <span>Shape</span>
                  <span className="text-[8px]">▼</span>
                </button>
                {showShapePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-[#2a2a2a] border border-gray-700 rounded-lg p-2 grid grid-cols-4 gap-1 z-50 shadow-xl w-56">
                    {SHAPES.map(sh => (
                      <button key={sh.id} onClick={() => addShapeElement(sh.id)} className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded text-center">
                        <div className="w-6 h-6 bg-[#FEC00F]" style={{
                          borderRadius: sh.id === 'ellipse' ? '50%' : sh.id === 'roundRect' ? '4px' : 0,
                          clipPath: getClipPath(sh.id),
                        }}/>
                        <span className="text-[9px] text-gray-400">{sh.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button onClick={() => setShowAssetPicker(true)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Add Image">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>Image</span>
              </button>
              
              <button onClick={() => setShowChartBuilder(true)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Add Chart">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m4 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4"/></svg>
                <span>Chart</span>
              </button>
              
              <div className="h-3 w-px bg-gray-700 mx-1"/>
              
              <button onClick={() => handleDuplicate(selectedIdx)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded" title="Duplicate Slide">Duplicate Slide</button>
              <button onClick={() => handleDeleteSlide(selectedIdx)} disabled={slides.length<=1} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded disabled:opacity-30" title="Delete Slide">Delete Slide</button>
              
              <div className="h-3 w-px bg-gray-700 mx-1"/>
              
              {/* Design Tools */}
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mr-1">Design</span>
              
              <button onClick={() => setShowThemeManager(true)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Theme Manager">
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-gray-700 rounded">T</span>
                <span className="hidden lg:inline">Themes</span>
              </button>
              
              <button onClick={() => setShowBackgroundManager(true)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Background Settings">
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-gray-700 rounded">B</span>
                <span className="hidden lg:inline">Background</span>
              </button>
              
              <button onClick={() => setShowEffectsManager(true)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Effects & Filters">
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-gray-700 rounded">E</span>
                <span className="hidden lg:inline">Effects</span>
              </button>
              
              <button onClick={() => setShowShapesManager(true)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Shapes & Lines">
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-gray-700 rounded">S</span>
                <span className="hidden lg:inline">Shapes+</span>
              </button>
              
              <button onClick={() => setShowMasterEditor(true)} className="px-2 py-1.5 text-[10px] text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Master Slide Editor">
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-gray-700 rounded">M</span>
                <span className="hidden lg:inline">Master</span>
              </button>
              
              <div className="flex-1"/>
              
              {/* Zoom controls */}
              <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="px-1.5 py-1 text-xs bg-[#0a0a0a] hover:bg-gray-800 rounded text-gray-400">−</button>
              <select value={zoom} onChange={e => setZoom(Number(e.target.value))} className="text-[10px] bg-[#0a0a0a] border border-gray-700 rounded px-1 py-1 text-gray-300">
                {[25, 50, 75, 100, 125, 150].map(z => <option key={z} value={z}>{z}%</option>)}
              </select>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="px-1.5 py-1 text-xs bg-[#0a0a0a] hover:bg-gray-800 rounded text-gray-400">+</button>
              
              <span className="text-[10px] text-gray-600 ml-2">{slides.length} slides</span>
            </div>

            {/* Canvas area */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              {currentSlide && (
                <InteractiveCanvas
                  elements={canvasElements}
                  background={canvasBackground}
                  zoom={zoom}
                  onChange={handleCanvasChange}
                  onSelectElement={setSelectedElementId}
                  selectedId={selectedElementId}
                  showGuides={true}
                />
              )}
            </div>
            
            {/* Element count bar */}
            <div className="px-4 py-1.5 bg-[#141414] border-t border-gray-800 flex items-center gap-3">
              <span className="text-[10px] text-gray-500">{canvasElements.length} elements</span>
              {selectedElementId && <span className="text-[10px] text-[#FEC00F]">1 selected</span>}
              <div className="flex-1"/>
              <span className="text-[10px] text-gray-600">Slide {selectedIdx + 1}/{slides.length}</span>
            </div>
          </div>

          {/* Right: Properties Panel */}
          <div className="w-72 bg-[#141414] border-l border-gray-800 flex flex-col overflow-hidden shrink-0">
            <div className="px-4 py-2.5 border-b border-gray-800">
              <span className="text-xs font-semibold text-[#FEC00F]">Properties</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Selected Element Properties */}
              {selectedElement && (
                <div className="p-4 space-y-3 border-b border-gray-800/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Selected Element</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {['x', 'y', 'w', 'h'].map(field => (
                      <div key={field}>
                        <label className="text-[9px] text-gray-500 uppercase">{field}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={(selectedElement as any)[field]?.toFixed(2) || '0'}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const newElements = canvasElements.map(el =>
                              el.id === selectedElement.id ? { ...el, [field]: val } : el
                            );
                            handleCanvasChange(newElements);
                          }}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>

                  {selectedElement.type === 'text' && (
                    <>
                      <div>
                        <label className="text-[9px] text-gray-500">Text</label>
                        <input
                          value={typeof selectedElement.content === 'string' ? selectedElement.content : ''}
                          onChange={e => {
                            const newElements = canvasElements.map(el =>
                              el.id === selectedElement.id ? { ...el, content: e.target.value } : el
                            );
                            handleCanvasChange(newElements);
                          }}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500">Font Size</label>
                        <input
                          type="number"
                          value={selectedElement.style?.fontSize || 24}
                          onChange={e => {
                            const newElements = canvasElements.map(el =>
                              el.id === selectedElement.id ? { ...el, style: { ...el.style, fontSize: parseInt(e.target.value) } } : el
                            );
                            handleCanvasChange(newElements);
                          }}
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500">Color</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => {
                                const newElements = canvasElements.map(el =>
                                  el.id === selectedElement.id ? { ...el, style: { ...el.style, color: c } } : el
                                );
                                handleCanvasChange(newElements);
                              }}
                              className={`w-5 h-5 rounded ${selectedElement.style?.color === c ? 'ring-2 ring-[#FEC00F]' : ''}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'shape' && (
                    <div>
                      <label className="text-[9px] text-gray-500">Fill Color</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => {
                              const newElements = canvasElements.map(el =>
                                el.id === selectedElement.id ? { ...el, options: { ...el.options, fill: c } } : el
                              );
                              handleCanvasChange(newElements);
                            }}
                            className={`w-5 h-5 rounded ${selectedElement.options?.fill === c ? 'ring-2 ring-[#FEC00F]' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const newElements = canvasElements.filter(el => el.id !== selectedElement.id);
                      handleCanvasChange(newElements);
                      setSelectedElementId(null);
                    }}
                    className="w-full px-3 py-2 bg-red-900/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-900/50 border border-red-800/50"
                  >
                    Delete Element
                  </button>
                </div>
              )}

              {/* Quick Edit Fields */}
              {currentSlide && (
                <div className="p-4 space-y-3 border-b border-gray-800/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Slide Data</h4>
                  
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Layout</label>
                    <select
                      value={currentSlide.layout}
                      onChange={e => {
                        const newSlides = [...slides];
                        newSlides[selectedIdx] = { ...currentSlide, layout: e.target.value };
                        setSlides(newSlides);
                        setDirty(true);
                      }}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]"
                    >
                      {LAYOUT_OPTIONS.map(l => <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>

                  {getEditableFields(currentSlide.layout).map(field => (
                    <div key={field}>
                      <label className="text-[10px] text-gray-500 block mb-1">{field.replace(/_/g, ' ')}</label>
                      <input
                        type="text"
                        value={currentSlide[field] || ''}
                        onChange={e => {
                          const newSlides = [...slides];
                          newSlides[selectedIdx] = { ...currentSlide, [field]: e.target.value };
                          setSlides(newSlides);
                          setDirty(true);
                        }}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Pillars Editor */}
              {currentSlide?.pillars && (
                <div className="p-4 space-y-2 border-b border-gray-800/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Pillars</h4>
                  {currentSlide.pillars.map((p: any, i: number) => (
                    <div key={i} className="bg-[#0a0a0a] rounded p-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#FEC00F] font-bold w-4">{i+1}</span>
                        <input value={p.label || ''} onChange={e => {
                          const newPillars = [...currentSlide.pillars];
                          newPillars[i] = { ...newPillars[i], label: e.target.value };
                          const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, pillars: newPillars }; setSlides(ns); setDirty(true);
                        }} placeholder="Label" className="flex-1 bg-transparent border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-[#FEC00F]" />
                      </div>
                      <input value={p.description || ''} onChange={e => {
                        const newPillars = [...currentSlide.pillars];
                        newPillars[i] = { ...newPillars[i], description: e.target.value };
                        const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, pillars: newPillars }; setSlides(ns); setDirty(true);
                      }} placeholder="Description" className="w-full bg-transparent border border-gray-800 rounded px-1.5 py-0.5 text-[10px] text-gray-400 focus:outline-none focus:border-[#FEC00F]" />
                    </div>
                  ))}
                </div>
              )}

              {/* Components Editor */}
              {currentSlide?.components && (
                <div className="p-4 space-y-2 border-b border-gray-800/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Components</h4>
                  {currentSlide.components.map((c: any, i: number) => (
                    <div key={i} className={`rounded p-2 space-y-1 ${c.is_result ? 'bg-[#FEC00F]/10 border border-[#FEC00F]/30' : 'bg-[#0a0a0a]'}`}>
                      <div className="flex items-center gap-1">
                        <input value={c.title || ''} onChange={e => {
                          const newComps = [...currentSlide.components];
                          newComps[i] = { ...newComps[i], title: e.target.value };
                          const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, components: newComps }; setSlides(ns); setDirty(true);
                        }} placeholder="Title" className="flex-1 bg-transparent border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-[#FEC00F]" />
                        <label className="flex items-center gap-0.5 text-[9px] text-gray-500">
                          <input type="checkbox" checked={!!c.is_result} onChange={e => {
                            const newComps = [...currentSlide.components];
                            newComps[i] = { ...newComps[i], is_result: e.target.checked };
                            const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, components: newComps }; setSlides(ns); setDirty(true);
                          }} className="w-3 h-3" /> Result
                        </label>
                      </div>
                      <textarea value={c.body || ''} onChange={e => {
                        const newComps = [...currentSlide.components];
                        newComps[i] = { ...newComps[i], body: e.target.value };
                        const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, components: newComps }; setSlides(ns); setDirty(true);
                      }} placeholder="Body text" rows={2} className="w-full bg-transparent border border-gray-800 rounded px-1.5 py-0.5 text-[10px] text-gray-400 resize-none focus:outline-none focus:border-[#FEC00F]" />
                    </div>
                  ))}
                  <button onClick={() => {
                    const newComps = [...(currentSlide.components || []), { title: 'NEW', body: '', is_result: false }];
                    const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, components: newComps }; setSlides(ns); setDirty(true);
                  }} className="text-[10px] text-[#FEC00F] hover:text-yellow-300">+ Add Component</button>
                </div>
              )}

              {/* JSON Editor */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">JSON Editor</h4>
                  <button
                    onClick={applyJsonEdit}
                    disabled={!!jsonError}
                    className="text-[10px] px-2 py-0.5 bg-[#FEC00F] text-black font-bold rounded disabled:opacity-40 hover:bg-yellow-400 transition-all"
                  >
                    Apply
                  </button>
                </div>
                {jsonError && (
                  <p className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded">{jsonError}</p>
                )}
                <textarea
                  value={editJson}
                  onChange={e => handleJsonChange(e.target.value)}
                  className="w-full h-48 bg-[#0a0a0a] border border-gray-700 rounded-lg p-2 text-[10px] text-green-400 font-mono resize-none focus:outline-none focus:border-[#FEC00F]"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Asset Picker Modal */}
      <AssetPicker
        open={showAssetPicker}
        onClose={() => setShowAssetPicker(false)}
        onSelect={(assets) => {
          if (assets.length > 0) {
            addImageElement(assets[0].url);
          }
          setShowAssetPicker(false);
        }}
        multiple={false}
      />
      
      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
      
      {/* Recovery Modal */}
      {showRecoveryModal && recoverableDraft && (
        <RecoveryModal
          draft={recoverableDraft}
          onRecover={(data) => {
            setOutline(data.outline);
            setSlides(data.slides || []);
            setTheme(data.theme || 'classic');
            setShowRecoveryModal(false);
            setRecoverableDraft(null);
          }}
          onDismiss={() => {
            setShowRecoveryModal(false);
            setRecoverableDraft(null);
          }}
        />
      )}
      
      {/* Chart Builder Modal */}
      {showChartBuilder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowChartBuilder(false)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <ChartBuilder
              onChartReady={handleChartReady}
              onCancel={() => setShowChartBuilder(false)}
            />
          </div>
        </div>
      )}
      
      {/* Theme Manager Modal */}
      {showThemeManager && (
        <ThemeManager
          currentTheme={activeTheme}
          onThemeChange={(theme) => {
            setActiveTheme(theme);
            setTheme(theme.id === 'custom' ? 'classic' : theme.id);
            setShowThemeManager(false);
          }}
          onClose={() => setShowThemeManager(false)}
        />
      )}
      
      {/* Background Manager Modal */}
      {showBackgroundManager && (
        <BackgroundManager
          currentBackground={slideBackground}
          onBackgroundChange={(bg) => {
            setSlideBackground(bg);
            setShowBackgroundManager(false);
          }}
          onClose={() => setShowBackgroundManager(false)}
        />
      )}
      
      {/* Effects Manager Modal */}
      {showEffectsManager && (
        <EffectsManager
          currentEffects={elementEffects}
          onEffectsChange={(effects) => {
            setElementEffects(effects);
            setShowEffectsManager(false);
          }}
          onClose={() => setShowEffectsManager(false)}
        />
      )}
      
      {/* Shapes Manager Modal */}
      {showShapesManager && (
        <ShapesManager
          onAddShape={(shape) => {
            addShapeElement(shape.type);
            setShowShapesManager(false);
          }}
          onAddLine={(line) => {
            // Add line as a shape element
            const currentSlide = slides[selectedIdx];
            if (currentSlide) {
              const newElement: CanvasElement = {
                id: generateId(),
                type: 'shape',
                x: 1.5,
                y: 2,
                w: 5,
                h: 0.05,
                options: { 
                  shape: 'rect', 
                  fill: line.stroke.color,
                  strokeColor: line.stroke.color,
                  strokeWidth: line.stroke.width,
                },
              };
              const customElements = currentSlide._customElements || [];
              const updatedSlide = {
                ...currentSlide,
                _customElements: [...customElements, newElement],
              };
              const newSlides = [...slides];
              newSlides[selectedIdx] = updatedSlide;
              setSlides(newSlides);
              setSelectedElementId(newElement.id);
              setDirty(true);
            }
            setShowShapesManager(false);
          }}
          onClose={() => setShowShapesManager(false)}
        />
      )}
      
      {/* Master Slide Editor Modal */}
      {showMasterEditor && (
        <MasterSlideEditor
          currentMaster={masterConfig}
          onMasterChange={(master) => {
            setMasterConfig(master);
            // Apply master background to all slides if enabled
            if (master.background.applyToAll && master.background.color) {
              const newSlides = slides.map(slide => ({
                ...slide,
                _bgColor: master.background.color,
              }));
              setSlides(newSlides);
              setDirty(true);
            }
            setShowMasterEditor(false);
          }}
          onClose={() => setShowMasterEditor(false)}
          slideCount={slides.length}
        />
      )}
    </div>
  );
}

function getEditableFields(layout: string): string[] {
  switch (layout) {
    case 'cover': return ['title'];
    case 'section_divider': return ['section_title'];
    case 'three_pillars': return ['title', 'subtitle', 'section_tag'];
    case 'chart': return ['chart_title', 'chart_caption', 'section_tag'];
    case 'composite_three': return ['headline', 'section_tag'];
    case 'composite_four': return ['title', 'subtitle', 'section_tag'];
    case 'five_component_diagram': return ['title', 'subtitle', 'section_tag', 'center_label', 'center_body'];
    case 'strategy_table': return ['title', 'strategy_name', 'table_title', 'footnote'];
    case 'risk_statistics': return ['headline', 'strategy_name', 'table_title', 'disclaimer'];
    case 'use_cases': return ['title', 'strategy_name'];
    case 'definitions': return [];
    case 'disclosures': return [];
    case 'thank_you': return [];
    default: return ['title'];
  }
}

function getStandardElementIdsForLayout(layout: string): string[] {
  const commonIds = [
    'bg_top', 'bg_bottom', 'deco_line', 'deco_line_top', 'deco_line_bottom',
    'logo', 'logo_text', 'tagline', 'arrow', 'website',
  ];
  
  const layoutSpecificIds: Record<string, string[]> = {
    cover: ['title'],
    section_divider: ['section_title'],
    three_pillars: ['title', 'subtitle', 'section_tag'],
    chart: ['chart_title', 'chart_caption', 'chart_image', 'chart_placeholder', 'section_tag'],
    composite_three: ['headline', 'section_tag'],
    composite_four: ['title', 'section_tag', 'result_box', 'result_title', 'result_body'],
    five_component_diagram: ['title', 'section_tag', 'center_box', 'center_label', 'center_body'],
    strategy_table: ['title', 'strategy_name', 'table_header', 'footnote'],
    risk_statistics: ['headline', 'strategy_name', 'table_header', 'disclaimer'],
    use_cases: ['title', 'strategy_name'],
    thank_you: ['thank_you'],
    disclosures: ['header', 'disclosure_text'],
    definitions: ['header'],
  };
  
  const dynamicIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    dynamicIds.push(`pillar_${i}`);
    dynamicIds.push(`component_${i}`, `component_${i}_box`, `component_${i}_title`, `component_${i}_body`);
    dynamicIds.push(`case_${i}_circle`, `case_${i}_title`, `case_${i}_body`);
    dynamicIds.push(`def_${i}`);
    dynamicIds.push(`col_${i}`, `row_bg_${i}`, `row_label_${i}`);
    for (let j = 0; j < 10; j++) {
      dynamicIds.push(`cell_${i}_${j}`, `row_val_${i}_${j}`);
    }
    dynamicIds.push(`operator_${i}`);
  }
  
  return [...commonIds, ...(layoutSpecificIds[layout] || []), ...dynamicIds];
}

function getClipPath(shapeId: string): string {
  const clipPaths: Record<string, string> = {
    triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    arrow: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
  };
  return clipPaths[shapeId] || '';
}