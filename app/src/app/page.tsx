'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
const SlidePreview = dynamic(() => import('./components/SlidePreview'), { ssr: false });
const AssetPicker = dynamic(() => import('@/components/AssetPicker'), { ssr: false });

const LAYOUT_COLORS: Record<string, string> = {
  cover: '#FEC00F', section_divider: '#6B7280', five_component_diagram: '#14B8A6',
  three_pillars: '#3B82F6', chart: '#8B5CF6', composite_three: '#F97316',
  composite_four: '#F97316', strategy_table: '#22C55E', risk_statistics: '#EF4444',
  use_cases: '#EC4899', thank_you: '#212121', disclosures: '#374151', definitions: '#374151',
};

interface SlideItem { slide_number: number; layout: string; title: string; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GenResult { pptx_base64: string; slide_manifest: SlideItem[]; filename: string; slide_count: number; outline?: { slides: any[] }; }
interface RecentPres { filename: string; timestamp: string; slide_count: number; }

export default function Home() {
  const [mode, setMode] = useState<'generate'|'reconstruct'>('generate');
  const [outline, setOutline] = useState('');
  const [title, setTitle] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [presentationType, setPresentationType] = useState('research');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [result, setResult] = useState<GenResult|null>(null);
  const [uploadFile, setUploadFile] = useState<File|null>(null);
  const [analysisSlides, setAnalysisSlides] = useState<SlideItem[]>([]);
  const [recentPres, setRecentPres] = useState<RecentPres[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [apiOk, setApiOk] = useState(true);
  // Advanced features
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai'; text: string}[]>([]);
  const [refining, setRefining] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [theme, setTheme] = useState('classic');
  const [templates, setTemplates] = useState<{id:string;name:string;category:string}[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<{id:string;name:string;url:string;mime_type?:string}[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [experimentalMode, setExperimentalMode] = useState(false);
  const [chartsEnabled, setChartsEnabled] = useState(false);
  const [chartDescription, setChartDescription] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/check-config').then(r=>r.json()).then(d=>setApiOk(d.configured!==false)).catch(()=>setApiOk(false));
    fetch('/api/templates').then(r=>r.json()).then(d=>setTemplates(d.templates||[])).catch(()=>{});
    fetch('/api/presentations').then(r=>r.json()).then(d=>setRecentPres((d.presentations||[]).map((p:any)=>({id:p.id,filename:p.title,timestamp:p.created_at,slide_count:p.slide_count||0})))).catch(()=>{});
  }, []);

  const savePresentation = async (data: GenResult) => {
    try {
      await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.filename,
          outline: data.outline,
          theme,
          slide_count: data.slide_count,
          filename: data.filename,
          pptx_base64: data.pptx_base64
        })
      });
      // Refresh recent list from DB
      const res = await fetch('/api/presentations');
      const d = await res.json();
      setRecentPres((d.presentations||[]).map((p:any)=>({id:p.id,filename:p.title,timestamp:p.created_at,slide_count:p.slide_count||0})));
    } catch (e) { console.error('Failed to save presentation:', e); }
  };

  const loadPresentation = async (id: string) => {
    try {
      const res = await fetch(`/api/presentations/${id}`);
      const data = await res.json();
      if (data.presentation) {
        const p = data.presentation;
        setResult({
          pptx_base64: p.pptx_base64 || '',
          slide_manifest: [],
          filename: p.title,
          slide_count: p.slide_count || 0,
          outline: p.outline
        });
        if (p.outline?.title) setTitle(p.outline.title);
        if (p.theme) setTheme(p.theme);
        setPreviewIdx(0);
      }
    } catch (e) { console.error('Failed to load:', e); }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }, []);

  const processFile = async (file: File) => {
    setUploadFile(file);
    setError(null);
    const isBinary = file.name.endsWith('.pdf') || file.name.endsWith('.pptx');
    if (isBinary) {
      setMode('reconstruct');
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
        setAnalysisSlides(data.slides || []);
        if (data.presentation_title) setTitle(data.presentation_title);
        if (data.strategy_name) setStrategyName(data.strategy_name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setAnalyzing(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => setOutline(reader.result as string);
      reader.readAsText(file);
    }
  };

  // Encode context files + selected assets as base64 for API
  const encodeContextImages = async (): Promise<{name: string; dataUri: string}[]> => {
    const images: {name: string; dataUri: string}[] = [];
    // Encode uploaded context files
    for (const file of contextFiles) {
      if (file.type.startsWith('image/')) {
        const buf = await file.arrayBuffer();
        const uint8 = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const b64 = btoa(binary);
        images.push({ name: file.name, dataUri: `data:${file.type};base64,${b64}` });
      }
    }
    // Encode selected library assets
    for (const asset of selectedAssets) {
      try {
        const res = await fetch(`/api/assets/${asset.id}/base64`);
        const data = await res.json();
        if (data.dataUri) images.push({ name: asset.name, dataUri: data.dataUri });
      } catch (e) { console.error('Failed to encode asset:', asset.name, e); }
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
        body: JSON.stringify({ outline, title, strategyName, presentationType, instructions, mode, theme, contextImages, experimental: experimentalMode, chartsEnabled, chartDescription, assetNames: selectedAssets.map(a => a.name) }),
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

  const handleSendToEditor = () => {
    if (!result) return;
    sessionStorage.setItem('editor_presentation', JSON.stringify({
      outline: result.outline,
      pptx_base64: result.pptx_base64,
      filename: result.filename,
      theme,
    }));
    window.location.href = '/editor';
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([Uint8Array.from(atob(result.pptx_base64), c => c.charCodeAt(0))],
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = result.filename; a.click(); URL.revokeObjectURL(a.href);
  };

  const samples: Record<string, { outline: string; title: string; strategy: string; type: string }> = {
    'Bull Bear Strategy': {
      outline: `Bull Bear is a tactical 'moderate growth' strategy with the goal of systematically pursuing growth in equity markets while avoiding catastrophic bear market losses.

PROCESS: Trading Systems Built with Real Market Data
- Uses economic data (Fed Funds Rate, Prime Rate, Treasury Bill Rate)
- Sentiment data (AAII Bullish/Bearish %, Put-Call Ratio)
- Technical indicators (Trend Following, Momentum, Relative Strength, Bollinger Bands, Stochastics)
- Market internals (Advances/Declines, Trading Volume, VIX)
- Index data (S&P 500, DJIA, Russell 2000, Dow Utilities, Dow Transports)

MARKET ANALYSIS: THREE LEGS TO THE STOOL
1. Trend Direction (Up, Down or Sideways)
2. Trend Health (Breadth and Volume)  
3. Intermarket Confirmation (Intermarket Relationships)
Indicators that use market data to assess the odds of a +/- price trend.

COMPOSITES: Designed to highlight times of risk-on and risk-off behavior
- Base Systems: Total market systems that trade infrequently to capture long term trend changes
- Trigger Systems: Capture short-term market inefficiencies that generate high returns while invested
- Result: Composite trading result — should we be invested?

REDUCING RISK BY REDUCING EXPOSURE (Long-Term Positioning with Short-Term Opportunity Capture)
- Base: Long-term trend exposure, invested 71% of the time
- Trigger: Volume thrust exposure, invested 43% of the time
- Trigger: VIX oversold exposure, invested 4% of the time
- Composite: Keeping combined system exposure to 62% can help reduce risk

ALLOCATION:
- CRDBX 80% - Core position, tactical concentrated exposure to major market index
- CRTOX 6.67% - Tactical fund with dynamic asset allocation
- CRMVX 6.66% - Tactical fund employing risk management techniques
- CRTBX 6.67% - Tactical fund using hedging and cash positions
Alternates between Risk-On (leveraged index exposure) and Risk-Off (cash, inverse, treasuries)

PERFORMANCE (Source: FastTrack as of 12/31/2025):
SPY: 1-Yr 17.72%, 5-Yr 14.34%, 10-Yr 14.72%, Max Drawdown -50.80%, Correlation 1.00
Potomac Bull Bear (Net 2.5%): 1-Yr 19.13%, 5-Yr 11.08%, 10-Yr 11.97%, Max Drawdown -24.65%, Correlation 0.51

USE CASES: How are advisors using Bull Bear?
- Core Holding: Complement to traditional buy and hold portfolios
- Replacing Fake Tactical: Replacing tactical managers with high market correlations`,
      title: 'Bull Bear Strategy',
      strategy: 'Bull Bear',
      type: 'strategy',
    },
    'Guardian Strategy': {
      outline: `Guardian is a tactical risk-managed strategy designed to provide growth while minimizing downside exposure through dynamic hedging and systematic risk controls.

PROCESS: Proprietary Risk Management Framework
Uses quantitative models analyzing market structure, volatility regimes, and cross-asset correlations.

THREE PILLARS:
1. Volatility Analysis - Monitor VIX levels, term structure, and implied vs realized volatility
2. Market Structure - Analyze market breadth, sector rotation, and credit spreads
3. Risk Scoring - Proprietary composite score determines exposure level

COMPOSITES:
- Core Equity Allocation: Strategic long positions in diversified market exposure
- Hedging Layer: Options-based downside protection activated during high-risk periods
- Result: Guardian Composite — tactical allocation between growth and protection

ALLOCATION:
- 60% Core equity ETFs (tactical market exposure)
- 25% Options hedging overlay (protective puts, collars)
- 15% Cash/Treasuries (risk-off reserve)

USE CASES:
- Conservative Growth: For advisors seeking equity upside with defined downside limits
- Retirement Distribution: Protecting portfolios in or near distribution phase
- Volatility-Sensitive Clients: For clients who panic during drawdowns`,
      title: 'Guardian Strategy',
      strategy: 'Guardian',
      type: 'strategy',
    },
    'Quick Demo': {
      outline: `A simple overview of Potomac's tactical approach to investing.
- We use quantitative trading systems built with real market data
- Three pillars: Trend Direction, Trend Health, and Intermarket Confirmation
- Our composites combine base systems with trigger systems
- This results in reduced exposure during high-risk periods
- Advisors use our strategies as core holdings and to replace fake tactical managers`,
      title: 'Tactical Investing Overview',
      strategy: 'Potomac',
      type: 'research',
    },
  };
  const [activeSample, setActiveSample] = useState('');
  
  const loadSample = (name: string) => {
    const s = samples[name];
    if (s) {
      setOutline(s.outline);
      setTitle(s.title);
      setStrategyName(s.strategy);
      setPresentationType(s.type);
      setActiveSample(name);
    }
  };

  // AI Chat Refinement
  const handleRefine = async () => {
    if (!chatInput.trim() || !result?.outline) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    setRefining(true);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentOutline: result.outline, instruction: userMsg, regenerate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatHistory(h => [...h, { role: 'ai', text: `✓ Updated ${data.slide_count || 0} slides` }]);
      setResult(prev => prev ? { ...prev, outline: data.outline, pptx_base64: data.pptx_base64, slide_manifest: data.slide_manifest || prev.slide_manifest, slide_count: data.slide_count || prev.slide_count } : prev);
      setPreviewIdx(0);
    } catch (err) {
      setChatHistory(h => [...h, { role: 'ai', text: `⚠ ${err instanceof Error ? err.message : 'Failed'}` }]);
    } finally { setRefining(false); }
  };

  // Slide Management
  const handleDeleteSlide = async (idx: number) => {
    if (!result?.outline?.slides) return;
    const slides = [...result.outline.slides];
    if (slides.length <= 3) return; // minimum
    slides.splice(idx, 1);
    const newOutline = { ...result.outline, slides };
    setResult(prev => prev ? { ...prev, outline: newOutline, slide_count: slides.length } : prev);
    if (previewIdx >= slides.length) setPreviewIdx(slides.length - 1);
  };

  const handleMoveSlide = (idx: number, dir: -1 | 1) => {
    if (!result?.outline?.slides) return;
    const slides = [...result.outline.slides];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    [slides[idx], slides[newIdx]] = [slides[newIdx], slides[idx]];
    const newOutline = { ...result.outline, slides };
    setResult(prev => prev ? { ...prev, outline: newOutline } : prev);
    setPreviewIdx(newIdx);
  };

  const handleDuplicateSlide = (idx: number) => {
    if (!result?.outline?.slides) return;
    const slides = [...result.outline.slides];
    const copy = JSON.parse(JSON.stringify(slides[idx]));
    slides.splice(idx + 1, 0, copy);
    const newOutline = { ...result.outline, slides };
    setResult(prev => prev ? { ...prev, outline: newOutline, slide_count: slides.length } : prev);
    setPreviewIdx(idx + 1);
  };

  const handleRegenFromOutline = async () => {
    if (!result?.outline) return;
    setLoading(true);
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline: result.outline, theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(prev => prev ? { ...prev, pptx_base64: data.pptx_base64, slide_manifest: data.slide_manifest, filename: data.filename, slide_count: data.slide_count } : prev);
    } catch (err) { setError(err instanceof Error ? err.message : 'Regeneration failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const slidesToShow = result?.slide_manifest?.length ? result.slide_manifest : analysisSlides;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {!apiOk && (
        <div className="bg-[#FEC00F] text-black px-4 py-2 text-center text-sm font-medium">
          ANTHROPIC_API_KEY not configured. <a href="https://console.anthropic.com/" target="_blank" className="underline">Get key here</a>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#212121] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/potomac-logo.png" alt="Potomac" className="h-8 object-contain" />
              <span className="text-gray-400 text-sm hidden sm:block">Presentation Generator</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <a href="/" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium">Generate</a>
              <a href="/editor" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Editor</a>
              <a href="/assets" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Assets</a>
              <a href="/templates" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Templates</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#FEC00F] text-xs font-medium tracking-wide">Built to Conquer Risk®</span>
            <img src="/potomac-icon.png" alt="" className="h-6 w-6 object-contain opacity-60" />
          </div>
        </div>
      </header>


      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">

          {/* Left Panel (3 cols) */}
          <div className="lg:col-span-3 space-y-5">

            {/* Upload Zone (reconstruct mode) */}
            {mode === 'reconstruct' && (
              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  Upload File to Reconstruct
                </h3>
                <div onDrop={handleFileDrop} onDragOver={e=>e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-[#FEC00F] transition-colors">
                  <input ref={fileRef} type="file" accept=".pptx,.pdf,.txt,.json,.docx" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                  {analyzing ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[#FEC00F]">Analyzing {uploadFile?.name}...</span>
                    </div>
                  ) : uploadFile ? (
                    <p className="text-[#FEC00F] font-medium">{uploadFile.name}</p>
                  ) : (
                    <div className="text-gray-400">
                      <p className="mb-1">Drop a PPTX or PDF here</p>
                      <p className="text-xs text-gray-500">We&apos;ll analyze it and reconstruct as a Potomac template</p>
                    </div>
                  )}
                </div>
                {analysisSlides.length > 0 && (
                  <div className="mt-3 text-sm text-green-400">✓ Analyzed {analysisSlides.length} slides — outline generated below</div>
                )}
              </div>
            )}

            {/* Generate from Topic (Quick Mode) */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-[#FEC00F]">⚡</span> Quick Generate from Topic
                </h3>
                <span className="text-[10px] text-gray-600">No outline needed — AI creates everything</span>
              </div>
              <div className="flex gap-2">
                <input type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerateFromTopic()}
                  placeholder="e.g., Momentum Strategy, ESG Investing, Market Volatility Analysis..."
                  className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]" />
                <button onClick={handleGenerateFromTopic} disabled={loading || !topicInput.trim()}
                  className="px-5 py-2.5 bg-[#FEC00F] text-[#212121] font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm whitespace-nowrap">
                  {loading ? '...' : '⚡ Generate'}
                </button>
              </div>
            </div>

            {/* Outline Input */}
            <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Presentation Outline</h3>
                <div className="flex gap-2">
                  {Object.keys(samples).map(name => (
                    <button key={name} onClick={() => loadSample(name)}
                      className={`text-xs px-2 py-1 rounded transition-all ${activeSample === name ? 'bg-[#FEC00F] text-black font-medium' : 'text-gray-400 hover:text-white bg-gray-800'}`}>
                      {name.replace(' Strategy', '')}
                    </button>
                  ))}
                  <button onClick={() => navigator.clipboard.writeText(outline)} className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded">Copy</button>
                  <button onClick={() => { setOutline(''); setUploadFile(null); setAnalysisSlides([]); setActiveSample(''); }} className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded">Clear</button>
                </div>
              </div>
              <textarea value={outline} onChange={e => setOutline(e.target.value)}
                placeholder="Paste your presentation outline here..."
                className="w-full h-48 bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#FEC00F] transition-colors font-mono" />
              <div className="text-right text-xs text-gray-600 mt-1">{outline.length} chars</div>
            </div>

            {/* Options */}
            <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
              <h3 className="text-base font-semibold mb-3">Options</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Title</label>
                  <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Guardian Strategy Overview"
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Strategy</label>
                  <input type="text" value={strategyName} onChange={e=>setStrategyName(e.target.value)} placeholder="Guardian"
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Type</label>
                  <select value={presentationType} onChange={e=>setPresentationType(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FEC00F]">
                    <option value="strategy">Strategy Deck</option>
                    <option value="research">Research</option>
                    <option value="overview">Company Overview</option>
                    <option value="pitch">Pitch Deck</option>
                    <option value="outlook">Market Outlook</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Theme</label>
                  <select value={theme} onChange={e=>setTheme(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FEC00F]">
                    <option value="classic">Classic (Yellow/Dark)</option>
                    <option value="navy">Navy (Yellow/Navy)</option>
                    <option value="forest">Forest (Green/Dark)</option>
                    <option value="slate">Slate (Orange/Dark)</option>
                    <option value="minimal">Minimal (Grayscale)</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Template (optional)</label>
                <select value={selectedTemplate} onChange={e=>setSelectedTemplate(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FEC00F]">
                  <option value="">Default (AI-selected layouts)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.category === 'preset' ? '(Preset)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Instructions (optional)</label>
                <input type="text" value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Any notes for Yang..."
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]" />
              </div>
              {/* Experimental Mode Toggle */}
              <div className="mt-3 flex items-center justify-between bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">🧪 Experimental</span>
                    {experimentalMode && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-medium">ON</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">Yang freestyles the design — creative layouts within Potomac brand guidelines</p>
                </div>
                <button
                  onClick={() => setExperimentalMode(!experimentalMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${experimentalMode ? 'bg-purple-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${experimentalMode ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {/* Charts Toggle */}
              <div className="mt-3 flex items-center justify-between bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">📊 Charts</span>
                    {chartsEnabled && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">ON</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{chartsEnabled ? 'Upload chart images to include in slides' : 'No chart slides will be generated'}</p>
                </div>
                <button
                  onClick={() => setChartsEnabled(!chartsEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${chartsEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${chartsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {chartsEnabled && (
                <div className="mt-2 bg-[#0a0a0a] border border-blue-500/30 rounded-lg px-4 py-3">
                  <label className="text-[10px] text-blue-400 mb-1 block font-medium">Chart Description</label>
                  <input type="text" value={chartDescription} onChange={e => setChartDescription(e.target.value)}
                    placeholder="e.g., Performance chart showing Bull Bear vs S&P 500 returns..."
                    className="w-full bg-transparent border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                  <p className="text-[9px] text-gray-600 mt-1">Upload the chart image in Context Files below</p>
                </div>
              )}
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Context Files &amp; Assets</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => contextRef.current?.click()}
                    className="px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-xs transition-colors">
                    📎 Upload Files
                  </button>
                  <button onClick={() => setShowAssetPicker(true)}
                    className="px-3 py-2 bg-gray-800 text-[#FEC00F] hover:text-yellow-300 rounded-lg text-xs transition-colors border border-[#FEC00F]/30">
                    📁 Asset Library
                  </button>
                  <input ref={contextRef} type="file" multiple accept="image/*,.pdf,.csv" onChange={e => {
                    if (e.target.files) setContextFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }} className="hidden" />
                </div>
                {(contextFiles.length > 0 || selectedAssets.length > 0) && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {contextFiles.map((f, i) => (
                      <span key={`f-${i}`} className="text-[10px] bg-[#FEC00F]/20 text-[#FEC00F] px-2 py-0.5 rounded-full flex items-center gap-1">
                        📎 {f.name.length > 18 ? f.name.substring(0, 15) + '...' : f.name}
                        <button onClick={() => setContextFiles(prev => prev.filter((_, j) => j !== i))} className="hover:text-white">×</button>
                      </span>
                    ))}
                    {selectedAssets.map((a, i) => (
                      <span key={`a-${i}`} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        📁 {a.name.length > 18 ? a.name.substring(0, 15) + '...' : a.name}
                        <button onClick={() => setSelectedAssets(prev => prev.filter((_, j) => j !== i))} className="hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={loading || !outline.trim()}
              className="w-full bg-[#FEC00F] text-[#212121] font-bold py-4 rounded-xl hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg">
              {loading ? (<><div className="w-5 h-5 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" /> Generating...</>) : (<>Generate Presentation →</>)}
            </button>
          </div>

          {/* Right Panel (2 cols) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <span className="text-red-400">⚠</span>
                  <div className="flex-1">
                    <p className="text-red-400 font-medium text-sm">Error</p>
                    <p className="text-red-300/70 text-xs mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && !result && (
              <div className="bg-[#1a1a1a] rounded-xl p-8 border border-gray-800 text-center">
                <div className="w-14 h-14 mx-auto mb-4 border-4 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
                <p className="text-base font-medium mb-2">Building Presentation</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>● Parsing outline</p>
                  <p>● Mapping Potomac layouts</p>
                  <p className="text-[#FEC00F] animate-pulse">● Generating PPTX...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !result && !error && !analyzing && (
              <div className="bg-[#1a1a1a] rounded-xl p-10 border border-gray-800 text-center">
                <img src="/potomac-icon.png" alt="" className="w-12 h-12 mx-auto mb-4 opacity-40 object-contain" />
                <h3 className="text-lg font-semibold text-gray-400 mb-1">Preview</h3>
                <p className="text-gray-600 text-sm">Your presentation will appear here</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-4">
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-[#22C55E]">✓</span> {result.filename}
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5">{result.slide_count} slides • {new Date().toLocaleTimeString()}</p>
                    </div>
                    <span className="bg-[#22C55E]/15 text-[#22C55E] text-[10px] font-medium px-2 py-0.5 rounded-full">Brand Compliant</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDownload}
                      className="flex-1 bg-[#FEC00F] text-[#212121] font-bold py-3 rounded-lg hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                      ⬇ Download PPTX
                    </button>
                    {result.outline?.slides && (
                      <button onClick={handleSendToEditor}
                        className="px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-1 text-sm">
                        ✎ Editor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Keynote-style Slide Preview */}
            {result?.outline?.slides && result.outline.slides.length > 0 && (
              <>
                <SlidePreview
                  slides={result.outline.slides}
                  currentIdx={previewIdx}
                  onSelect={setPreviewIdx}
                />

                {/* Slide Management Toolbar */}
                <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleMoveSlide(previewIdx, -1)} disabled={previewIdx === 0}
                        className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-20 text-gray-400 hover:text-white text-xs" title="Move up">↑</button>
                      <button onClick={() => handleMoveSlide(previewIdx, 1)} disabled={previewIdx >= (result.outline?.slides?.length || 1) - 1}
                        className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-20 text-gray-400 hover:text-white text-xs" title="Move down">↓</button>
                      <button onClick={() => handleDuplicateSlide(previewIdx)}
                        className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white text-xs" title="Duplicate">⧉</button>
                      <button onClick={() => handleDeleteSlide(previewIdx)} disabled={(result.outline?.slides?.length || 0) <= 3}
                        className="p-1.5 rounded hover:bg-red-900/30 disabled:opacity-20 text-gray-400 hover:text-red-400 text-xs" title="Delete">✕</button>
                      <span className="text-[10px] text-gray-600 ml-2">Slide {previewIdx + 1}: {result.outline.slides[previewIdx]?.layout?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowChat(!showChat)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${showChat ? 'bg-[#FEC00F] text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                        AI Refine
                      </button>
                      <button onClick={handleRegenFromOutline} disabled={loading}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 transition-all">
                        {loading ? '...' : 'Rebuild'} PPTX
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Chat Refinement Panel */}
                {showChat && (
                  <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#212121] border-b border-gray-800 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#FEC00F]">AI Refinement</h4>
                      <span className="text-[10px] text-gray-500">Tell Yang how to modify your deck</span>
                    </div>
                    {/* Chat Messages */}
                    <div className="h-32 overflow-y-auto p-3 space-y-2">
                      {chatHistory.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500">Try: &quot;Change the three pillars to focus on volatility&quot;</p>
                          <p className="text-xs text-gray-600 mt-1">&quot;Add a slide about ESG investing&quot; • &quot;Remove the chart slides&quot;</p>
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] px-3 py-1.5 rounded-lg text-xs ${msg.role === 'user' ? 'bg-[#FEC00F] text-black' : 'bg-[#212121] text-gray-300'}`}>
                            {msg.text}
                          </div>
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
                    {/* Chat Input */}
                    <div className="p-2 border-t border-gray-800/50">
                      <div className="flex gap-2">
                        <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleRefine()}
                          placeholder="Describe changes..."
                          className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]"
                          disabled={refining} />
                        <button onClick={handleRefine} disabled={refining || !chatInput.trim()}
                          className="px-3 py-2 bg-[#FEC00F] text-black rounded-lg text-xs font-bold hover:bg-yellow-400 disabled:opacity-40 transition-all">
                          {refining ? '...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Fallback Slide List (when no outline data) */}
            {slidesToShow.length > 0 && !result?.outline?.slides && (
              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {result ? 'Generated Slides' : 'Detected Slides'}
                </h4>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {slidesToShow.map((s, i) => (
                    <div key={i} onClick={() => setPreviewIdx(i)}
                      className={`bg-[#212121] rounded-lg p-2.5 flex items-center gap-2.5 cursor-pointer transition-all ${previewIdx===i ? 'ring-1 ring-[#FEC00F]' : 'hover:bg-[#2a2a2a]'}`}>
                      <span className="w-6 h-6 flex items-center justify-center bg-[#0a0a0a] rounded text-[11px] font-medium shrink-0">{s.slide_number}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: LAYOUT_COLORS[s.layout||'']||'#6B7280', color: ['#FEC00F','#22C55E','#F97316'].includes(LAYOUT_COLORS[s.layout||'']||'') ? '#212121' : '#FFF' }}>
                        {(s.layout||'slide').replace(/_/g,' ')}
                      </span>
                      <span className="text-xs text-gray-300 truncate">{s.title||''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Presentations */}
            {recentPres.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Saved Presentations</h4>
                <div className="space-y-1.5">
                  {recentPres.map((p: any, i: number) => (
                    <div key={i} className="bg-[#212121] rounded-lg p-2.5 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors group">
                      <div className="cursor-pointer flex-1" onClick={() => p.id && loadPresentation(p.id)}>
                        <p className="text-xs font-medium group-hover:text-[#FEC00F] transition-colors">{p.filename}</p>
                        <p className="text-[10px] text-gray-500">{p.slide_count} slides • {new Date(p.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => p.id && loadPresentation(p.id)}
                          className="px-2 py-1 text-[10px] text-gray-400 hover:text-white bg-gray-800 rounded" title="Load">
                          Open
                        </button>
                        {p.id && (
                          <a href={`/api/presentations/${p.id}?download=1`}
                            className="px-2 py-1 text-[10px] text-[#FEC00F] hover:text-yellow-300 bg-gray-800 rounded" title="Download">
                            PPTX
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800/50 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/potomac-icon.png" alt="" className="w-8 h-8 object-contain opacity-40" />
            <div>
              <p className="text-[#FEC00F] text-sm font-bold tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>PRESENTER</p>
              <p className="text-gray-500 text-[10px] tracking-widest">BY POTOMAC SUITE</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-[10px]">Developed by Sohaib Ali</p>
            <p className="text-gray-600 text-[10px]">Powered by Yang &middot; Beta 1.0</p>
          </div>
        </div>
      </footer>

      {/* Asset Picker Modal */}
      <AssetPicker
        open={showAssetPicker}
        onClose={() => setShowAssetPicker(false)}
        onSelect={(assets) => {
          setSelectedAssets(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newAssets = assets.filter(a => !existingIds.has(a.id));
            return [...prev, ...newAssets];
          });
        }}
        multiple={true}
      />
    </div>
  );
}
