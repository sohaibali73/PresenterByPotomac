'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
const SlidePreview = dynamic(() => import('./components/SlidePreview'), { ssr: false });
const AssetPicker = dynamic(() => import('@/components/AssetPicker'), { ssr: false });
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });
import PresentationMode from '@/components/PresentationMode';

interface SlideItem { slide_number: number; layout: string; title: string; }
interface GenResult { pptx_base64: string; slide_manifest: SlideItem[]; filename: string; slide_count: number; outline?: { slides: any[] }; }
interface RecentPres { id?: string; filename: string; timestamp: string; slide_count: number; }

export default function Home() {
  const [outline, setOutline] = useState('');
  const [title, setTitle] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [presentationType, setPresentationType] = useState('research');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [result, setResult] = useState<GenResult|null>(null);
  const [uploadFile, setUploadFile] = useState<File|null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recentPres, setRecentPres] = useState<RecentPres[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [theme, setTheme] = useState('classic');
  const [templates, setTemplates] = useState<{id:string;name:string;category:string}[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<{id:string;name:string;url:string}[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [experimentalMode, setExperimentalMode] = useState(false);
  const [chartsEnabled, setChartsEnabled] = useState(false);
  const [showPresentMode, setShowPresentMode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role:'user'|'ai';text:string}[]>([]);
  const [refining, setRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<'outline' | 'topic'>('topic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/templates').then(r=>r.json()).then(d=>setTemplates(d.templates||[])).catch(()=>{});
    fetch('/api/presentations').then(r=>r.json()).then(d=>setRecentPres((d.presentations||[]).map((p:any)=>({id:p.id,filename:p.title,timestamp:p.created_at,slide_count:p.slide_count||0})))).catch(()=>{});
  }, []);

  const savePresentation = async (data: GenResult) => {
    try {
      await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.filename, outline: data.outline, theme, slide_count: data.slide_count, filename: data.filename, pptx_base64: data.pptx_base64 })
      });
      const res = await fetch('/api/presentations');
      const d = await res.json();
      setRecentPres((d.presentations||[]).map((p:any)=>({id:p.id,filename:p.title,timestamp:p.created_at,slide_count:p.slide_count||0})));
    } catch (err) { console.error('Failed to save:', err); }
  };

  const loadPresentation = async (id: string) => {
    try {
      const res = await fetch(`/api/presentations/${id}`);
      const data = await res.json();
      if (data.presentation) {
        const p = data.presentation;
        setResult({ pptx_base64: p.pptx_base64 || '', slide_manifest: [], filename: p.title, slide_count: p.slide_count || 0, outline: p.outline });
        if (p.outline?.title) setTitle(p.outline.title);
        if (p.theme) setTheme(p.theme);
        setPreviewIdx(0);
      }
    } catch (err) { console.error('Failed to load:', err); }
  };

  const processFile = async (file: File) => {
    setUploadFile(file);
    setError(null);
    const isBinary = file.name.endsWith('.pdf') || file.name.endsWith('.pptx');
    if (isBinary) {
      setAnalyzing(true);
      try {
        const buf = await file.arrayBuffer();
        const uint8 = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const b64 = btoa(binary);
        const res = await fetch('/api/reconstruct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: b64, fileType: file.type || 'application/pdf', fileName: file.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOutline(data.outline || '');
        if (data.presentation_title) setTitle(data.presentation_title);
        if (data.strategy_name) setStrategyName(data.strategy_name);
        setActiveTab('outline');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setAnalyzing(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => setOutline(reader.result as string);
      reader.readAsText(file);
      setActiveTab('outline');
    }
  };

  const encodeContextImages = async (): Promise<{name: string; dataUri: string}[]> => {
    const images: {name: string; dataUri: string}[] = [];
    for (const file of contextFiles) {
      if (file.type.startsWith('image/')) {
        const buf = await file.arrayBuffer();
        const uint8 = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        images.push({ name: file.name, dataUri: `data:${file.type};base64,${btoa(binary)}` });
      }
    }
    for (const asset of selectedAssets) {
      try {
        const res = await fetch(`/api/assets/${asset.id}/base64`);
        const data = await res.json();
        if (data.dataUri) images.push({ name: asset.name, dataUri: data.dataUri });
      } catch (err) { console.error('Failed to encode asset:', asset.name); }
    }
    return images;
  };

  const handleGenerate = async () => {
    if (!outline.trim()) { setError('Please provide an outline'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const contextImages = await encodeContextImages();
      const res = await fetch('/api/generate-presentation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, title, strategyName, presentationType, instructions, mode: 'generate', theme, contextImages, experimental: experimentalMode, chartsEnabled, assetNames: selectedAssets.map(a => a.name) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data); setPreviewIdx(0);
      savePresentation(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  };

  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) { setError('Please enter a topic'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/generate-from-topic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput, presentationType, theme, instructions, experimental: experimentalMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data); setPreviewIdx(0);
      setTitle(data.outline?.title || topicInput);
      savePresentation(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([Uint8Array.from(atob(result.pptx_base64), c => c.charCodeAt(0))], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = result.filename; a.click(); URL.revokeObjectURL(a.href);
  };

  const handleSendToEditor = () => {
    if (!result) return;
    sessionStorage.setItem('editor_presentation', JSON.stringify({ outline: result.outline, pptx_base64: result.pptx_base64, filename: result.filename, theme }));
    window.location.href = '/editor';
  };

  const samples: Record<string, { outline: string; title: string; strategy: string; type: string }> = {
    'Bull Bear': { outline: `Bull Bear is a tactical moderate growth strategy with the goal of systematically pursuing growth in equity markets while avoiding catastrophic bear market losses.

PROCESS: Trading Systems Built with Real Market Data
- Uses economic data (Fed Funds Rate, Prime Rate, Treasury Bill Rate)
- Sentiment data (AAII Bullish/Bearish %, Put-Call Ratio)
- Technical indicators (Trend Following, Momentum, Relative Strength)

MARKET ANALYSIS: THREE LEGS TO THE STOOL
1. Trend Direction (Up, Down or Sideways)
2. Trend Health (Breadth and Volume)
3. Intermarket Confirmation

COMPOSITES: Designed to highlight times of risk-on and risk-off behavior
- Base Systems: Long-term trend exposure
- Trigger Systems: Short-term market inefficiencies
- Result: Composite trading result

ALLOCATION:
- CRDBX 80% - Core position
- CRTOX 6.67% - Tactical fund
- CRMVX 6.66% - Risk management
- CRTBX 6.67% - Hedging

PERFORMANCE:
SPY: 1-Yr 17.72%, 5-Yr 14.34%, 10-Yr 14.72%, Max Drawdown -50.80%
Potomac Bull Bear: 1-Yr 19.13%, 5-Yr 11.08%, 10-Yr 11.97%, Max Drawdown -24.65%`, title: 'Bull Bear Strategy', strategy: 'Bull Bear', type: 'strategy' },
    'Guardian': { outline: `Guardian is a tactical risk-managed strategy designed to provide growth while minimizing downside exposure.

PROCESS: Proprietary Risk Management Framework
Uses quantitative models analyzing market structure, volatility regimes, and cross-asset correlations.

THREE PILLARS:
1. Volatility Analysis - Monitor VIX levels and term structure
2. Market Structure - Analyze market breadth and sector rotation
3. Risk Scoring - Composite score determines exposure

COMPOSITES:
- Core Equity Allocation: Strategic long positions
- Hedging Layer: Options-based downside protection
- Result: Guardian Composite

ALLOCATION:
- 60% Core equity ETFs
- 25% Options hedging overlay
- 15% Cash/Treasuries reserve

USE CASES:
- Conservative Growth
- Retirement Distribution
- Volatility-Sensitive Clients`, title: 'Guardian Strategy', strategy: 'Guardian', type: 'strategy' },
    'Quick Demo': { outline: `A simple overview of Potomac tactical approach to investing.
- We use quantitative trading systems built with real market data
- Three pillars: Trend Direction, Trend Health, and Intermarket Confirmation
- Our composites combine base systems with trigger systems
- This results in reduced exposure during high-risk periods
- Advisors use our strategies as core holdings`, title: 'Tactical Investing Overview', strategy: 'Potomac', type: 'research' },
  };
  const [activeSample, setActiveSample] = useState('');

  const loadSample = (name: string) => {
    const s = samples[name];
    if (s) { setOutline(s.outline); setTitle(s.title); setStrategyName(s.strategy); setPresentationType(s.type); setActiveSample(name); setActiveTab('outline'); }
  };

  const handleRefine = async () => {
    if (!chatInput.trim() || !result?.outline) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    setRefining(true);
    try {
      const res = await fetch('/api/refine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentOutline: result.outline, instruction: userMsg, regenerate: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatHistory(h => [...h, { role: 'ai', text: `Updated ${data.slide_count || 0} slides` }]);
      setResult(prev => prev ? { ...prev, outline: data.outline, pptx_base64: data.pptx_base64, slide_manifest: data.slide_manifest || prev.slide_manifest, slide_count: data.slide_count || prev.slide_count } : prev);
      setPreviewIdx(0);
    } catch (err) {
      setChatHistory(h => [...h, { role: 'ai', text: `Error: ${err instanceof Error ? err.message : 'Failed'}` }]);
    } finally { setRefining(false); }
  };

  const handleDeleteSlide = async (idx: number) => {
    if (!result?.outline?.slides) return;
    const slides = [...result.outline.slides];
    if (slides.length <= 3) return;
    slides.splice(idx, 1);
    setResult(prev => prev ? { ...prev, outline: { ...result.outline, slides }, slide_count: slides.length } : prev);
    if (previewIdx >= slides.length) setPreviewIdx(slides.length - 1);
  };

  const handleMoveSlide = (idx: number, dir: -1 | 1) => {
    if (!result?.outline?.slides) return;
    const slides = [...result.outline.slides];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const temp = slides[idx];
    slides[idx] = slides[newIdx];
    slides[newIdx] = temp;
    setResult(prev => prev ? { ...prev, outline: { ...result.outline, slides } } : prev);
    setPreviewIdx(newIdx);
  };

  const handleRegenFromOutline = async () => {
    if (!result?.outline) return;
    setLoading(true);
    try {
      const res = await fetch('/api/regenerate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outline: result.outline, theme }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(prev => prev ? { ...prev, pptx_base64: data.pptx_base64, slide_manifest: data.slide_manifest, filename: data.filename, slide_count: data.slide_count } : prev);
    } catch (err) { setError(err instanceof Error ? err.message : 'Regeneration failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-3">
              <img src="/potomac-logo.png" alt="Potomac" className="h-7 object-contain" />
              <span className="text-gray-400 text-sm font-light hidden sm:block">Presenter</span>
            </a>
            <nav className="hidden md:flex items-center gap-1">
              <a href="/" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium rounded-lg bg-[#FEC00F]/10">Generate</a>
              <a href="/editor" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Editor</a>
              <a href="/templates" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Templates</a>
              <a href="/assets" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Assets</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="https://potomac.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#FEC00F] font-medium tracking-wide hover:text-yellow-300 transition-colors">potomac.com</a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Create Presentations</h1>
            <p className="text-gray-400 text-sm">Generate brand-compliant Potomac slides in seconds</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Input */}
            <div className="lg:col-span-3 space-y-6">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-lg">
                <button onClick={() => setActiveTab('topic')} className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'topic' ? 'bg-[#FEC00F] text-black' : 'text-gray-400 hover:text-white'}`}>
                  Quick Generate
                </button>
                <button onClick={() => setActiveTab('outline')} className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'outline' ? 'bg-[#FEC00F] text-black' : 'text-gray-400 hover:text-white'}`}>
                  From Outline
                </button>
              </div>

              {/* Quick Generate Tab */}
              {activeTab === 'topic' && (
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block font-medium">Topic or Strategy Name</label>
                    <input
                      type="text"
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGenerateFromTopic()}
                      placeholder="e.g., Momentum Strategy, ESG Investing, Market Outlook Q1 2026..."
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F] transition-colors"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Try:</span>
                    {['Bull Bear', 'Guardian', 'Quick Demo'].map(name => (
                      <button key={name} onClick={() => { setTopicInput(samples[name].title); loadSample(name); }} className="text-xs px-2 py-1 bg-gray-800 text-gray-400 hover:text-white rounded transition-colors">{name}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Outline Tab */}
              {activeTab === 'outline' && (
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500 font-medium">Paste your outline or drop a file</label>
                    <div className="flex gap-2">
                      {Object.keys(samples).map(name => (
                        <button key={name} onClick={() => loadSample(name)} className={`text-xs px-2 py-1 rounded transition-all ${activeSample === name ? 'bg-[#FEC00F] text-black' : 'text-gray-400 hover:text-white bg-gray-800'}`}>{name}</button>
                      ))}
                    </div>
                  </div>
                  <div
                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileRef.current?.click()}
                    className="relative"
                  >
                    <textarea
                      value={outline}
                      onChange={e => setOutline(e.target.value)}
                      placeholder="Paste your presentation outline here, or drag and drop a PDF/PPTX file..."
                      className="w-full h-64 bg-[#0a0a0a] border border-gray-700 rounded-lg p-4 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#FEC00F] transition-colors font-mono"
                    />
                    <input ref={fileRef} type="file" accept=".pptx,.pdf,.txt,.json,.docx" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                  </div>
                  {analyzing && (
                    <div className="flex items-center gap-2 text-[#FEC00F]">
                      <div className="w-4 h-4 border-2 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Analyzing {uploadFile?.name}...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Title</label>
                  <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Strategy Name" className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Type</label>
                  <select value={presentationType} onChange={e=>setPresentationType(e.target.value)} className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FEC00F]">
                    <option value="strategy">Strategy</option>
                    <option value="research">Research</option>
                    <option value="overview">Overview</option>
                    <option value="pitch">Pitch Deck</option>
                    <option value="outlook">Market Outlook</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Theme</label>
                  <select value={theme} onChange={e=>setTheme(e.target.value)} className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FEC00F]">
                    <option value="classic">Classic</option>
                    <option value="navy">Navy</option>
                    <option value="forest">Forest</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Template</label>
                  <select value={selectedTemplate} onChange={e=>setSelectedTemplate(e.target.value)} className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FEC00F]">
                    <option value="">Default</option>
                    {templates.filter(t => t.category !== 'preset').slice(0, 20).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                <span>Advanced Options</span>
                <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {showAdvanced && (
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white">Experimental Mode</span>
                      <p className="text-xs text-gray-500">Creative layouts within brand guidelines</p>
                    </div>
                    <button onClick={() => setExperimentalMode(!experimentalMode)} className={`relative w-11 h-6 rounded-full transition-colors ${experimentalMode ? 'bg-purple-500' : 'bg-gray-700'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${experimentalMode ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white">Include Charts</span>
                      <p className="text-xs text-gray-500">Generate chart slides</p>
                    </div>
                    <button onClick={() => setChartsEnabled(!chartsEnabled)} className={`relative w-11 h-6 rounded-full transition-colors ${chartsEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${chartsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Instructions</label>
                    <input type="text" value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Additional notes for generation..." className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Context Assets</label>
                    <div className="flex gap-2">
                      <button onClick={() => contextRef.current?.click()} className="px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-xs transition-colors">Upload Files</button>
                      <button onClick={() => setShowAssetPicker(true)} className="px-3 py-2 bg-gray-800 text-[#FEC00F] hover:text-yellow-300 rounded-lg text-xs border border-[#FEC00F]/30">Asset Library</button>
                      <input ref={contextRef} type="file" multiple accept="image/*,.pdf,.csv" onChange={e => { const files = e.target.files; if (files) setContextFiles(prev => [...prev, ...Array.from(files)]); }} className="hidden" />
                    </div>
                    {(contextFiles.length > 0 || selectedAssets.length > 0) && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {contextFiles.map((f, i) => (
                          <span key={`f-${i}`} className="text-[10px] bg-[#FEC00F]/20 text-[#FEC00F] px-2 py-0.5 rounded-full flex items-center gap-1">
                            {f.name.length > 15 ? f.name.substring(0, 12) + '...' : f.name}
                            <button onClick={() => setContextFiles(prev => prev.filter((_, j) => j !== i))} className="hover:text-white">x</button>
                          </span>
                        ))}
                        {selectedAssets.map((a, i) => (
                          <span key={`a-${i}`} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {a.name.length > 15 ? a.name.substring(0, 12) + '...' : a.name}
                            <button onClick={() => setSelectedAssets(prev => prev.filter((_, j) => j !== i))} className="hover:text-white">x</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={activeTab === 'topic' ? handleGenerateFromTopic : handleGenerate}
                disabled={loading || (activeTab === 'topic' ? !topicInput.trim() : !outline.trim())}
                className="w-full bg-[#FEC00F] text-[#212121] font-bold py-4 rounded-xl hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span className="text-lg">Generate Presentation</span>
                )}
              </button>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Error */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-red-400 text-sm">!</span>
                  <div className="flex-1">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm">x</button>
                </div>
              )}

              {/* Loading State */}
              {loading && !result && (
                <div className="bg-[#1a1a1a] rounded-xl p-10 border border-gray-800 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
                  <p className="text-base font-medium mb-2">Building Presentation</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Parsing outline</p>
                    <p>Mapping layouts</p>
                    <p className="text-[#FEC00F]">Generating PPTX...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !result && !error && (
                <div className="bg-[#1a1a1a] rounded-xl p-10 border border-gray-800 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#FEC00F]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FEC00F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-1">Preview</h3>
                  <p className="text-gray-600 text-sm">Your presentation will appear here</p>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-4">
                  {/* Success Card */}
                  <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {result.filename}
                        </h3>
                        <p className="text-gray-500 text-xs mt-0.5">{result.slide_count} slides</p>
                      </div>
                      <span className="bg-green-500/10 text-green-400 text-[10px] font-medium px-2 py-1 rounded-full">Ready</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleDownload} className="flex-1 bg-[#FEC00F] text-[#212121] font-bold py-3 rounded-lg hover:bg-yellow-400 transition-all text-sm">Download PPTX</button>
                      {result.outline?.slides && (
                        <button onClick={handleSendToEditor} className="px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all text-sm">Editor</button>
                      )}
                    </div>
                  </div>

                  {/* Slide Preview */}
                  {result.outline?.slides && result.outline.slides.length > 0 && (
                    <SlidePreview slides={result.outline.slides} currentIdx={previewIdx} onSelect={setPreviewIdx} />
                  )}

                  {/* Slide Controls */}
                  {result.outline?.slides && (
                    <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleMoveSlide(previewIdx, -1)} disabled={previewIdx === 0} className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-20 text-gray-400 hover:text-white text-xs">↑</button>
                        <button onClick={() => handleMoveSlide(previewIdx, 1)} disabled={previewIdx >= (result.outline?.slides?.length || 1) - 1} className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-20 text-gray-400 hover:text-white text-xs">↓</button>
                        <button onClick={() => handleDeleteSlide(previewIdx)} disabled={(result.outline?.slides?.length || 0) <= 3} className="p-1.5 rounded hover:bg-red-900/30 disabled:opacity-20 text-gray-400 hover:text-red-400 text-xs">x</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowPresentMode(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-500 transition-all">Present</button>
                        <button onClick={() => setShowChat(!showChat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showChat ? 'bg-[#FEC00F] text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>AI Edit</button>
                        <button onClick={handleRegenFromOutline} disabled={loading} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 transition-all">Rebuild</button>
                      </div>
                    </div>
                  )}

                  {/* AI Chat */}
                  {showChat && result?.outline?.slides && (
                    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#212121] border-b border-gray-800">
                        <h4 className="text-xs font-semibold text-[#FEC00F]">AI Refinement</h4>
                      </div>
                      <div className="h-32 overflow-y-auto p-3 space-y-2">
                        {chatHistory.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-4">Try: {'"'}Add a slide about risk management{'"'}</p>
                        )}
                        {chatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-3 py-1.5 rounded-lg text-xs ${msg.role === 'user' ? 'bg-[#FEC00F] text-black' : 'bg-[#212121] text-gray-300'}`}>{msg.text}</div>
                          </div>
                        ))}
                        {refining && (
                          <div className="flex justify-start">
                            <div className="bg-[#212121] px-3 py-1.5 rounded-lg text-xs text-gray-400 flex items-center gap-2">
                              <div className="w-3 h-3 border border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
                              Refining...
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="p-2 border-t border-gray-800/50">
                        <div className="flex gap-2">
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleRefine()} placeholder="Describe changes..." className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]" disabled={refining} />
                          <button onClick={handleRefine} disabled={refining || !chatInput.trim()} className="px-3 py-2 bg-[#FEC00F] text-black rounded-lg text-xs font-bold hover:bg-yellow-400 disabled:opacity-40 transition-all">Send</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Presentations */}
              {recentPres.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent</h4>
                  <div className="space-y-1.5">
                    {recentPres.slice(0, 5).map((p, i) => (
                      <div key={i} className="bg-[#212121] rounded-lg p-2.5 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors group cursor-pointer" onClick={() => p.id && loadPresentation(p.id)}>
                        <div>
                          <p className="text-xs font-medium group-hover:text-[#FEC00F] transition-colors">{p.filename}</p>
                          <p className="text-[10px] text-gray-500">{p.slide_count} slides</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/potomac-icon.png" alt="" className="w-6 h-6 object-contain opacity-40" />
            <span className="text-[#FEC00F] text-xs font-bold tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>PRESENTER</span>
          </div>
          <p className="text-gray-600 text-[10px]">Powered by Yang</p>
        </div>
      </footer>

      {/* Modals */}
      <AssetPicker open={showAssetPicker} onClose={() => setShowAssetPicker(false)} onSelect={(assets) => { setSelectedAssets(prev => [...prev, ...assets.filter(a => !prev.some(p => p.id === a.id))]); }} multiple={true} />

      {showPresentMode && result?.outline?.slides && (
        <PresentationMode slides={result.outline.slides} theme={theme} slideComponent={({ slide }) => (
          <div className="w-full aspect-video bg-[#212121] flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#FEC00F] mb-2">{slide.title || 'Slide'}</h2>
              {slide.subtitle && <p className="text-lg text-white/80">{slide.subtitle}</p>}
            </div>
          </div>
        )} onClose={() => setShowPresentMode(false)} startSlide={previewIdx} />
      )}
    </div>
  );
}