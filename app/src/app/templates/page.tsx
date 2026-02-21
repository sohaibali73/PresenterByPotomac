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
    <div
      className="relative w-full aspect-video overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      {elements.map((el: any, i: number) => (
        <div
          key={el.id || i}
          className="absolute"
          style={{
            left: `${(el.x / 13.33) * 100}%`,
            top: `${(el.y / 7.5) * 100}%`,
            width: `${(el.w / 13.33) * 100}%`,
            height: `${(el.h / 7.5) * 100}%`,
          }}
        >
          {el.type === 'text' && (
            <div
              className="w-full h-full flex items-center overflow-hidden"
              style={{
                color: el.style?.color || '#FFFFFF',
                fontSize: `${Math.max(6, (el.style?.fontSize || 24) * scale * 0.4)}px`,
                fontFamily: el.style?.fontFace === 'Rajdhani' ? "'Rajdhani', sans-serif" : "'Quicksand', sans-serif",
                fontWeight: el.style?.bold ? 'bold' : 'normal',
                textAlign: (el.style?.align as any) || 'left',
                justifyContent: el.style?.align === 'center' ? 'center' : 'flex-start',
                textTransform: el.style?.fontFace === 'Rajdhani' ? 'uppercase' : 'none',
              }}
            >
              <span className="truncate px-1">{el.content as string}</span>
            </div>
          )}
          {el.type === 'shape' && (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: el.options?.fill || '#FEC00F',
                borderRadius: el.options?.shape === 'ellipse' ? '50%' : el.options?.shape === 'roundRect' ? '6px' : 0,
              }}
            />
          )}
          {el.type === 'image' && (
            <img src={el.content as string} alt="" className="w-full h-full object-contain" />
          )}
        </div>
      ))}
    </div>
  );
}

function LoadingAnimation({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-[#FEC00F]/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-[#FEC00F] rounded-full animate-spin" />
        <div className="absolute inset-3 border-4 border-transparent border-t-[#212121] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/potomac-icon.png" alt="" className="w-8 h-8 object-contain opacity-60" />
        </div>
      </div>
      <p className="text-lg font-semibold text-gray-700">{text}</p>
      <div className="flex gap-1 mt-3">
        <div className="w-2 h-2 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-[#FEC00F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-sm text-gray-400 mt-2">This may take 30-60 seconds for multi-slide templates</p>
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
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
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
    setGeneratedTemplate(null);
    fetchTemplates();
  };

  // Auto-save generated template and open preview
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
        // Auto-save and open preview
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

  // Get slides from template config
  const getSlides = (config: any) => {
    if (config?.slides && Array.isArray(config.slides)) return config.slides;
    if (config?.elements) return [config];
    return [{ background: { color: '#212121' }, elements: [] }];
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="mb-4 flex items-center gap-4">
          <button onClick={() => { setShowEditor(false); setEditing(null); setGeneratedTemplate(null); }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium">
            Back to Templates
          </button>
          <h1 className="text-2xl font-bold">{editing ? 'Edit Template' : 'New Template'}</h1>
        </div>
        <TemplateEditor templateId={editing || undefined} onSave={handleSave as any} initialTemplate={generatedTemplate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#212121] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <img src="/potomac-logo.png" alt="Potomac" className="h-8 object-contain" />
              <span className="text-gray-400 text-sm hidden sm:block">Presentation Generator</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Generate</Link>
              <Link href="/assets" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Assets</Link>
              <Link href="/templates" className="px-3 py-1.5 text-sm text-[#FEC00F] font-medium">Templates</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#FEC00F] text-xs font-medium tracking-wide">Built to Conquer Risk&reg;</span>
            <img src="/potomac-icon.png" alt="" className="h-6 w-6 object-contain opacity-60" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Rajdhani', sans-serif" }}>TEMPLATE LIBRARY</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAIPanel(!showAIPanel)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${showAIPanel ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
              AI Generate
            </button>
            <button onClick={() => { setGeneratedTemplate(null); setShowEditor(true); }}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg">
              Create Template
            </button>
          </div>
        </div>

        {/* AI Generation Panel */}
        {showAIPanel && (
          <div className="bg-white rounded-xl border border-purple-200 p-6 mb-6">
            {(aiGenerating || pdfGenerating) ? (
              <LoadingAnimation text={aiGenerating ? 'Generating template with AI...' : 'Analyzing document...'} />
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Template Generator</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Describe Your Template</h3>
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Create a 5-slide strategy presentation with cover, content, data table, use cases, and thank you slides..."
                      className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <button onClick={handleAIGenerate} disabled={!aiPrompt.trim()}
                      className="mt-3 w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg disabled:opacity-50">
                      Generate from Description
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Upload PDF for Analysis</h3>
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors">
                      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => e.target.files?.[0] && setPdfFile(e.target.files[0])} className="hidden" />
                      {pdfFile ? <p className="text-purple-600 font-medium">{pdfFile.name}</p> : (
                        <div className="text-gray-500"><p className="font-medium">Drop a PDF or image here</p><p className="text-sm mt-1">We&apos;ll analyze the layout and create a matching template</p></div>
                      )}
                    </div>
                    <button onClick={handlePdfUpload} disabled={!pdfFile}
                      className="mt-3 w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg disabled:opacity-50">
                      Generate from PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Template Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-8" onClick={() => { setPreviewTemplate(null); setPreviewSlideIdx(0); }}>
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{previewTemplate.name}</h2>
                  <p className="text-sm text-gray-500">{previewTemplate.description || 'Custom template'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditing(previewTemplate.id); setShowEditor(true); setPreviewTemplate(null); }}
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg text-sm">Edit</button>
                  <button onClick={() => { setPreviewTemplate(null); setPreviewSlideIdx(0); }}
                    className="p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="flex">
                {/* Slide thumbnails */}
                <div className="w-48 bg-gray-100 p-3 overflow-y-auto max-h-[70vh] border-r">
                  {getSlides(previewTemplate.slide_config).map((slide: any, i: number) => (
                    <div key={i} onClick={() => setPreviewSlideIdx(i)}
                      className={`mb-2 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${previewSlideIdx === i ? 'border-[#FEC00F] shadow-lg' : 'border-transparent hover:border-gray-300'}`}>
                      <div className="text-[6px]"><SlideRenderer slide={slide} scale={0.3} /></div>
                      <div className="bg-white px-2 py-1 text-[10px] text-gray-600 truncate">{slide.name || `Slide ${i + 1}`}</div>
                    </div>
                  ))}
                </div>
                {/* Main preview */}
                <div className="flex-1 p-6 flex items-center justify-center bg-gray-50">
                  <div className="w-full max-w-3xl shadow-2xl rounded-lg overflow-hidden">
                    <SlideRenderer slide={getSlides(previewTemplate.slide_config)[previewSlideIdx]} scale={1} />
                  </div>
                </div>
              </div>
              <div className="p-3 border-t flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-500">Slide {previewSlideIdx + 1} of {getSlides(previewTemplate.slide_config).length}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewSlideIdx(Math.max(0, previewSlideIdx - 1))} disabled={previewSlideIdx === 0}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-30 text-sm">Prev</button>
                  <button onClick={() => setPreviewSlideIdx(Math.min(getSlides(previewTemplate.slide_config).length - 1, previewSlideIdx + 1))}
                    disabled={previewSlideIdx >= getSlides(previewTemplate.slide_config).length - 1}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-30 text-sm">Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Grid */}
        {loading ? (
          <LoadingAnimation text="Loading templates..." />
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <img src="/potomac-icon.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <div className="text-gray-500 mb-4">No custom templates yet.</div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowAIPanel(true)} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">Generate with AI</button>
              <button onClick={() => { setGeneratedTemplate(null); setShowEditor(true); }} className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium">Create Manually</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => {
              const slides = getSlides(template.slide_config);
              const firstSlide = slides[0];
              return (
                <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                  <div className="cursor-pointer relative" onClick={() => { setPreviewTemplate(template); setPreviewSlideIdx(0); }}>
                    <SlideRenderer slide={firstSlide} scale={0.5} />
                    {slides.length > 1 && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                        {slides.length} slides
                      </span>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full capitalize">
                      {template.layout_type}
                    </span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg text-sm font-medium text-gray-900 shadow">
                        Preview
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">{template.description || 'Custom template'}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => { setEditing(template.id); setGeneratedTemplate(null); setShowEditor(true); }}
                        className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(template.id)}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
