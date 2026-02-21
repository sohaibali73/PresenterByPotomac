'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const VisualSlide = dynamic(() => import('@/components/VisualSlide'), { ssr: false });
const AssetPicker = dynamic(() => import('@/components/AssetPicker'), { ssr: false });

const LAYOUT_OPTIONS = [
  'cover', 'section_divider', 'three_pillars', 'chart', 'composite_three',
  'composite_four', 'five_component_diagram', 'strategy_table', 'risk_statistics',
  'use_cases', 'thank_you', 'disclosures', 'definitions'
];

interface EditorSlide {
  layout: string;
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
  const [insertImageTarget, setInsertImageTarget] = useState<string>('');
  const [savedPresentations, setSavedPresentations] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

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

  const quickEditField = (field: string, value: string) => {
    const newSlides = [...slides];
    newSlides[selectedIdx] = { ...newSlides[selectedIdx], [field]: value };
    setSlides(newSlides);
    setDirty(true);
  };

  const currentSlide = slides[selectedIdx];
  const editableFields = currentSlide ? getEditableFields(currentSlide.layout) : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#212121] border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <img src="/potomac-logo.png" alt="Potomac" className="h-7 object-contain" />
            </a>
            <div className="h-5 w-px bg-gray-700" />
            <span className="text-sm font-semibold text-[#FEC00F]">Slide Editor</span>
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <a href="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Generate</a>
              <a href="/assets" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Assets</a>
              <a href="/templates" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Templates</a>
              <a href="/editor" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium">Editor</a>
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
              {loading ? 'Building...' : '⚡ Rebuild PPTX'}
            </button>
            {result && (
              <button onClick={handleDownload}
                className="px-4 py-1.5 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-500 transition-all">
                ⬇ Download
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
                      <span className="text-[#FEC00F] text-lg">📊</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-[#FEC00F] transition-colors truncate">{p.title}</p>
                      <p className="text-[10px] text-gray-500">{p.slide_count || '?'} slides &middot; {new Date(p.created_at).toLocaleDateString()}</p>
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
                ⚡ Generate New Presentation
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Editor Layout */}
      {slides.length > 0 && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Slide List */}
          <div className="w-56 bg-[#141414] border-r border-gray-800 flex flex-col">
            <div className="px-3 py-2 border-b border-gray-800/50 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Slides ({slides.length})</span>
              <div className="relative group">
                <button className="text-[10px] text-[#FEC00F] hover:text-yellow-300 font-medium">+ Add</button>
                <div className="absolute right-0 top-full mt-1 bg-[#212121] border border-gray-700 rounded-lg p-1 hidden group-hover:block z-10 w-48 shadow-xl">
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
                  onClick={() => setSelectedIdx(i)}
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

          {/* Center: Visual Preview */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d]">
            {/* Main slide preview */}
            <div className="flex-1 flex items-center justify-center p-8">
              {currentSlide && (
                <div className="w-full max-w-[800px] shadow-2xl rounded-lg overflow-hidden border border-gray-800" style={{ fontSize: '16px' }}>
                  <VisualSlide
                    slide={currentSlide}
                    theme={theme}
                    editable={true}
                    onEditField={quickEditField}
                  />
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            <div className="h-24 border-t border-gray-800 bg-[#141414] flex items-center px-4 gap-2 overflow-x-auto">
              {slides.map((slide, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`shrink-0 w-32 h-[4.5rem] rounded-md overflow-hidden cursor-pointer border-2 transition-all hover:opacity-100 ${
                    selectedIdx === i ? 'border-[#FEC00F] opacity-100' : 'border-transparent opacity-60'
                  }`}
                  style={{ fontSize: '4px' }}
                >
                  <VisualSlide slide={slide} theme={theme} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Property Editor */}
          <div className="w-80 bg-[#141414] border-l border-gray-800 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FEC00F]">Properties</span>
              <span className="text-[10px] text-gray-600">
                {currentSlide?.layout?.replace(/_/g, ' ')}
              </span>
            </div>

            {currentSlide && (
              <div className="flex-1 overflow-y-auto">
                {/* Quick Edit Fields */}
                <div className="p-4 space-y-3 border-b border-gray-800/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Quick Edit</h4>
                  
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Layout</label>
                    <select
                      value={currentSlide.layout}
                      onChange={e => quickEditField('layout', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]"
                    >
                      {LAYOUT_OPTIONS.map(l => <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>

                  {editableFields.map(field => (
                    <div key={field}>
                      <label className="text-[10px] text-gray-500 block mb-1">{field.replace(/_/g, ' ')}</label>
                      <input
                        type="text"
                        value={currentSlide[field] || ''}
                        onChange={e => quickEditField(field, e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]"
                      />
                    </div>
                  ))}
                </div>

                {/* Component Editor (pillars, components, cases, images) */}
                {currentSlide.pillars && (
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

                {currentSlide.components && (
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

                {currentSlide.cases && (
                  <div className="p-4 space-y-2 border-b border-gray-800/50">
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Use Cases</h4>
                    {currentSlide.cases.map((c: any, i: number) => (
                      <div key={i} className="bg-[#0a0a0a] rounded p-2 space-y-1">
                        <input value={c.title || ''} onChange={e => {
                          const newCases = [...currentSlide.cases];
                          newCases[i] = { ...newCases[i], title: e.target.value };
                          const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, cases: newCases }; setSlides(ns); setDirty(true);
                        }} placeholder="Case title" className="w-full bg-transparent border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-[#FEC00F]" />
                        <textarea value={c.body || ''} onChange={e => {
                          const newCases = [...currentSlide.cases];
                          newCases[i] = { ...newCases[i], body: e.target.value };
                          const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, cases: newCases }; setSlides(ns); setDirty(true);
                        }} placeholder="Description" rows={2} className="w-full bg-transparent border border-gray-800 rounded px-1.5 py-0.5 text-[10px] text-gray-400 resize-none focus:outline-none focus:border-[#FEC00F]" />
                      </div>
                    ))}
                    <button onClick={() => {
                      const newCases = [...(currentSlide.cases || []), { title: 'NEW CASE', body: '' }];
                      const ns = [...slides]; ns[selectedIdx] = { ...currentSlide, cases: newCases }; setSlides(ns); setDirty(true);
                    }} className="text-[10px] text-[#FEC00F] hover:text-yellow-300">+ Add Case</button>
                  </div>
                )}

                {/* Insert Image */}
                <div className="p-4 space-y-2 border-b border-gray-800/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Insert Image</h4>
                  <button onClick={() => { setInsertImageTarget('image_url'); setShowAssetPicker(true); }}
                    className="w-full px-3 py-2 bg-gray-800 text-[#FEC00F] hover:text-yellow-300 rounded-lg text-xs transition-colors border border-[#FEC00F]/30 flex items-center justify-center gap-1">
                    📁 Choose from Asset Library
                  </button>
                  {currentSlide.image_url && (
                    <div className="mt-2 relative">
                      <img src={currentSlide.image_url} alt="Slide image" className="w-full rounded border border-gray-700" />
                      <button onClick={() => quickEditField('image_url', '')}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-500">✕</button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentSlide.image_url || ''}
                      onChange={e => quickEditField('image_url', e.target.value)}
                      placeholder="Or paste image URL..."
                      className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#FEC00F]"
                    />
                  </div>
                </div>

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
                    className="w-full h-64 bg-[#0a0a0a] border border-gray-700 rounded-lg p-2 text-[10px] text-green-400 font-mono resize-none focus:outline-none focus:border-[#FEC00F]"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Asset Picker Modal */}
      <AssetPicker
        open={showAssetPicker}
        onClose={() => setShowAssetPicker(false)}
        onSelect={(assets) => {
          if (assets.length > 0 && insertImageTarget) {
            quickEditField(insertImageTarget, assets[0].url);
          }
        }}
        multiple={false}
      />
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
