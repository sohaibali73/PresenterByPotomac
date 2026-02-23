'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TemplateEditor from '@/components/TemplateEditor';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  layout_type: string;
  slide_config: any;
  created_at: string;
}

function SlideRenderer({ slide, scale = 1 }: { slide: any; scale?: number }) {
  const bg = slide?.background?.color || '#212121';
  const elements = slide?.elements || [];
  
  return (
    <div className="relative w-full aspect-video overflow-hidden" style={{ backgroundColor: bg }}>
      {elements.map((el: any, i: number) => (
        <div key={el.id || i} className="absolute"
          style={{
            left: `${(el.x / 13.33) * 100}%`,
            top: `${(el.y / 7.5) * 100}%`,
            width: `${(el.w / 13.33) * 100}%`,
            height: `${(el.h / 7.5) * 100}%`,
          }}>
          {el.type === 'text' && (
            <div className="w-full h-full flex items-center overflow-hidden"
              style={{
                color: el.style?.color || '#FFFFFF',
                fontSize: `${Math.max(6, (el.style?.fontSize || 24) * scale * 0.4)}px`,
                fontFamily: el.style?.fontFace === 'Rajdhani' ? "'Rajdhani', sans-serif" : "'Quicksand', sans-serif",
                fontWeight: el.style?.bold ? 'bold' : 'normal',
                textAlign: (el.style?.align as any) || 'left',
                justifyContent: el.style?.align === 'center' ? 'center' : 'flex-start',
                textTransform: el.style?.fontFace === 'Rajdhani' ? 'uppercase' : 'none',
              }}>
              <span className="truncate px-1">{el.content as string}</span>
            </div>
          )}
          {el.type === 'shape' && (
            <div className="w-full h-full"
              style={{
                backgroundColor: el.options?.fill || '#FEC00F',
                borderRadius: el.options?.shape === 'ellipse' ? '50%' : el.options?.shape === 'roundRect' ? '6px' : 0,
              }} />
          )}
          {el.type === 'image' && (
            <img src={el.content as string} alt="" className="w-full h-full object-contain" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      setTemplates(templates.filter(t => t.id !== id));
      if (previewTemplate?.id === id) setPreviewTemplate(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSave = (template: Template) => {
    setShowEditor(false);
    setEditing(null);
    fetchTemplates();
  };

  const saveAndPreview = async (templateData: any) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
      const data = await res.json();
      if (data.template) {
        await fetchTemplates();
        setPreviewTemplate(data.template);
        setPreviewSlideIdx(0);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.template) {
        setShowAIPanel(false);
        await saveAndPreview(data.template);
      }
    } catch (error: any) {
      console.error('AI generation failed:', error);
      alert('Failed to generate template: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setPdfGenerating(true);
    try {
      const bytes = await pdfFile.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      const res = await fetch('/api/templates/from-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, fileType: pdfFile.type || 'application/pdf' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.template) {
        setShowAIPanel(false);
        await saveAndPreview(data.template);
      }
    } catch (error: any) {
      console.error('PDF analysis failed:', error);
      alert('Failed to analyze PDF: ' + error.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const getSlides = (config: any) => {
    if (config?.slides && Array.isArray(config.slides)) return config.slides;
    if (config?.elements) return [config];
    return [{ background: { color: '#212121' }, elements: [] }];
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-3 flex items-center gap-4">
          <button onClick={() => { setShowEditor(false); setEditing(null); }}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            Back
          </button>
          <h1 className="text-lg font-medium">{editing ? 'Edit Template' : 'New Template'}</h1>
        </div>
        <TemplateEditor templateId={editing || undefined} onSave={handleSave as any} key={editing || 'new'} />
      </div>
    );
  }

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
              <a href="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Generate</a>
              <a href="/editor" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Editor</a>
              <a href="/templates" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium rounded-lg bg-[#FEC00F]/10">Templates</a>
              <a href="/assets" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Assets</a>
            </nav>
          </div>
          <a href="https://potomac.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#FEC00F] font-medium tracking-wide hover:text-yellow-300 transition-colors">potomac.com</a>
        </div>
      </header>

      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Templates</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAIPanel(!showAIPanel)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showAIPanel ? 'bg-purple-500 text-white' : 'bg-[#1a1a1a] border border-gray-700 text-gray-400 hover:text-white'}`}>
                AI Generate
              </button>
              <button onClick={() => setShowEditor(true)}
                className="px-4 py-2 bg-[#FEC00F] text-[#212121] font-bold rounded-lg text-sm hover:bg-yellow-400 transition-colors">
                Create Template
              </button>
            </div>
          </div>

          {/* AI Panel */}
          {showAIPanel && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
              {(aiGenerating || pdfGenerating) ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 border-4 border-[#FEC00F] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">{aiGenerating ? 'Generating...' : 'Analyzing...'}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Describe Your Template</h3>
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Create a 5-slide strategy presentation..."
                      className="w-full h-32 bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#FEC00F]" />
                    <button onClick={handleAIGenerate} disabled={!aiPrompt.trim()}
                      className="mt-3 w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors">
                      Generate
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Upload PDF</h3>
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-[#FEC00F] transition-colors">
                      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => e.target.files?.[0] && setPdfFile(e.target.files[0])} className="hidden" />
                      {pdfFile ? <p className="text-[#FEC00F]">{pdfFile.name}</p> : <p className="text-gray-500">Drop a PDF or image here</p>}
                    </div>
                    <button onClick={handlePdfUpload} disabled={!pdfFile}
                      className="mt-3 w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors">
                      Analyze
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Modal */}
          {previewTemplate && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8" onClick={() => setPreviewTemplate(null)}>
              <div className="bg-[#1a1a1a] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-800" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{previewTemplate.name}</h2>
                    <p className="text-xs text-gray-500">{previewTemplate.description || 'Custom template'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditing(previewTemplate.id); setShowEditor(true); setPreviewTemplate(null); }}
                      className="px-4 py-2 bg-[#FEC00F] text-[#212121] font-medium rounded-lg text-sm">Edit</button>
                    <button onClick={() => setPreviewTemplate(null)} className="p-2 text-gray-400 hover:text-white">x</button>
                  </div>
                </div>
                <div className="flex">
                  <div className="w-48 bg-[#0a0a0a] p-3 overflow-y-auto max-h-[70vh] border-r border-gray-800">
                    {getSlides(previewTemplate.slide_config).map((slide: any, i: number) => (
                      <div key={i} onClick={() => setPreviewSlideIdx(i)}
                        className={`mb-2 cursor-pointer rounded overflow-hidden border-2 transition-all ${previewSlideIdx === i ? 'border-[#FEC00F]' : 'border-transparent hover:border-gray-700'}`}>
                        <div className="text-[6px]"><SlideRenderer slide={slide} scale={0.3} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="w-full max-w-3xl rounded-lg overflow-hidden">
                      <SlideRenderer slide={getSlides(previewTemplate.slide_config)[previewSlideIdx]} scale={1} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Grid */}
          {loading ? (
            <div className="flex flex-col items-center py-16">
              <div className="w-12 h-12 border-4 border-[#FEC00F] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#FEC00F]/10 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-[#FEC00F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">No templates yet</p>
              <button onClick={() => setShowEditor(true)} className="px-4 py-2 bg-[#FEC00F] text-[#212121] font-bold rounded-lg">Create Template</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => {
                const slides = getSlides(template.slide_config);
                const firstSlide = slides[0];
                return (
                  <div key={template.id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all group">
                    <div className="cursor-pointer relative" onClick={() => { setPreviewTemplate(template); setPreviewSlideIdx(0); }}>
                      <SlideRenderer slide={firstSlide} scale={0.5} />
                      {slides.length > 1 && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full">{slides.length} slides</span>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full capitalize">{template.layout_type}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-white">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">{template.description || 'Custom template'}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => { setEditing(template.id); setShowEditor(true); }}
                          className="flex-1 px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs transition-colors">Edit</button>
                        <button onClick={() => handleDelete(template.id)}
                          className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-xs transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}