'use client';
import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SlidePreviewProps { slides: any[]; currentIdx: number; onSelect: (i: number) => void; }

const Y = '#FEC00F', D = '#212121', W = '#FFFFFF', G = '#737373';

// Individual slide renderers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSlide(slide: any) {
  const layout = slide?.layout || 'section_divider';
  switch (layout) {
    case 'cover': return <CoverSlide slide={slide} />;
    case 'section_divider': return <SectionDividerSlide slide={slide} />;
    case 'three_pillars': return <ThreePillarsSlide slide={slide} />;
    case 'chart': return <ChartSlide slide={slide} />;
    case 'composite_three': return <CompositeThreeSlide slide={slide} />;
    case 'composite_four': return <CompositeFourSlide slide={slide} />;
    case 'five_component_diagram': return <FiveComponentSlide slide={slide} />;
    case 'strategy_table': return <StrategyTableSlide slide={slide} />;
    case 'risk_statistics': return <RiskStatsSlide slide={slide} />;
    case 'use_cases': return <UseCasesSlide slide={slide} />;
    case 'thank_you': return <ThankYouSlide />;
    case 'disclosures': return <DisclosuresSlide />;
    case 'definitions': return <DefinitionsSlide slide={slide} />;
    default: return <GenericSlide slide={slide} />;
  }
}

// PLACEHOLDER - will be replaced
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CoverSlide({ slide }: { slide: any }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6" style={{ background: Y }}>
      <div className="text-[8px] font-bold tracking-wider self-start mb-auto" style={{ color: D }}>POTOMAC</div>
      <div className="text-center flex-1 flex items-center">
        <h1 className="text-[16px] font-black leading-tight" style={{ color: D, fontFamily: 'system-ui' }}>
          {(slide.title || 'PRESENTATION').toUpperCase()}
        </h1>
      </div>
      <div className="text-[6px] italic mt-auto" style={{ color: D }}>Built to Conquer Risk®</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionDividerSlide({ slide }: { slide: any }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4" style={{ background: W }}>
      <div className="w-3 h-3 rounded-full mb-2 self-end" style={{ background: Y }} />
      <h2 className="text-[14px] font-bold text-center" style={{ color: D }}>
        {(slide.section_title || slide.title || 'SECTION').toUpperCase()}
      </h2>
      <div className="w-10 h-[2px] mt-2" style={{ background: Y }} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ThreePillarsSlide({ slide }: { slide: any }) {
  const pillars = slide.pillars || [];
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: D }}>
      <div className="flex justify-between items-start">
        <span className="text-[5px] font-bold" style={{ color: Y }}>{(slide.section_tag || '').toUpperCase()}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: Y, opacity: 0.3 }} />
      </div>
      <h3 className="text-[9px] font-bold mt-1 mb-1" style={{ color: W }}>{(slide.title || '').toUpperCase()}</h3>
      {slide.subtitle && <p className="text-[5px] text-center mb-1" style={{ color: Y }}>{slide.subtitle.toUpperCase()}</p>}
      <div className="flex-1 flex items-center justify-center gap-2">
        {pillars.map((p: { label?: string; description?: string }, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: Y }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold" style={{ background: Y, color: D }}>
                {i + 1}
              </div>
            </div>
            <span className="text-[4px] font-bold mt-1 text-center" style={{ color: Y }}>{(p.label || '').toUpperCase()}</span>
            <span className="text-[3px] text-center" style={{ color: G }}>{p.description || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartSlide({ slide }: { slide: any }) {
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: W }}>
      <div className="flex justify-between items-start">
        <span className="text-[5px] font-bold" style={{ color: D }}>{(slide.section_tag || '').toUpperCase()}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: D, opacity: 0.2 }} />
      </div>
      <h3 className="text-[10px] font-bold mt-1" style={{ color: D }}>{(slide.chart_title || slide.title || 'CHART').toUpperCase()}</h3>
      <div className="w-8 h-[1px] mt-1" style={{ background: Y }} />
      <div className="flex-1 mt-2 rounded flex items-center justify-center" style={{ background: '#f0f0f0', border: '1px solid #ddd' }}>
        <div className="flex items-end gap-[2px] h-8">
          {[40,60,35,75,50,65,45,70,55].map((h,i) => (
            <div key={i} className="w-[3px] rounded-t" style={{ height: `${h}%`, background: i%2===0 ? Y : '#ccc' }} />
          ))}
        </div>
      </div>
      {slide.chart_caption && <p className="text-[3px] italic mt-1" style={{ color: G }}>{slide.chart_caption}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CompositeThreeSlide({ slide }: { slide: any }) {
  const comps = slide.components || [];
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: D }}>
      <div className="flex justify-between items-start">
        <span className="text-[5px] font-bold" style={{ color: Y }}>{(slide.section_tag || '').toUpperCase()}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: Y, opacity: 0.3 }} />
      </div>
      <h3 className="text-[7px] font-bold mt-1 text-center" style={{ color: W }}>{(slide.headline || slide.title || '').toUpperCase()}</h3>
      <div className="flex-1 flex items-center justify-center gap-1 mt-2">
        {comps.map((c: { title?: string; body?: string; is_result?: boolean }, i: number) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className="px-2 py-[2px] rounded-full text-[4px] font-bold" style={{ background: c.is_result ? Y : '#444', color: c.is_result ? D : Y }}>
                {(c.title || '').toUpperCase()}
              </div>
              <div className="w-14 h-14 rounded-lg border flex items-center justify-center p-1" style={{ borderColor: c.is_result ? Y : '#555', background: c.is_result ? Y : 'transparent' }}>
                <span className="text-[3px] text-center" style={{ color: c.is_result ? D : W }}>{c.body || ''}</span>
              </div>
            </div>
            {i < comps.length - 1 && <span className="text-[8px] font-bold" style={{ color: Y }}>{i === comps.length - 2 ? '=' : '+'}</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CompositeFourSlide({ slide }: { slide: any }) {
  const comps = slide.components || [];
  const inputs = comps.filter((c: { is_result?: boolean }) => !c.is_result);
  const result = comps.find((c: { is_result?: boolean }) => c.is_result);
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: D }}>
      <div className="flex justify-between items-start">
        <span className="text-[5px] font-bold" style={{ color: Y }}>{(slide.section_tag || '').toUpperCase()}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: Y, opacity: 0.3 }} />
      </div>
      <h3 className="text-[8px] font-bold mt-1" style={{ color: W }}>{(slide.title || '').toUpperCase()}</h3>
      <div className="flex-1 flex items-center gap-1 mt-1">
        <div className="flex flex-col gap-1 flex-1">
          {inputs.map((c: { title?: string; body?: string }, i: number) => (
            <div key={i} className="border rounded p-1" style={{ borderColor: Y }}>
              <div className="text-[4px] font-bold" style={{ color: Y }}>{(c.title || '').toUpperCase()}</div>
              <div className="text-[3px]" style={{ color: W }}>{c.body || ''}</div>
            </div>
          ))}
        </div>
        <span className="text-[8px]" style={{ color: Y }}>→</span>
        {result && (
          <div className="flex-1 rounded p-2 flex flex-col items-center justify-center h-full" style={{ background: Y }}>
            <div className="text-[5px] font-bold" style={{ color: D }}>{(result.title || '').toUpperCase()}</div>
            <div className="text-[3px] text-center mt-1" style={{ color: D }}>{result.body || ''}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FiveComponentSlide({ slide }: { slide: any }) {
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: D }}>
      <div className="flex justify-between items-start">
        <span className="text-[5px] font-bold" style={{ color: Y }}>{(slide.section_tag || '').toUpperCase()}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: Y, opacity: 0.3 }} />
      </div>
      <h3 className="text-[9px] font-bold mt-1" style={{ color: W }}>{(slide.title || '').toUpperCase()}</h3>
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1 mt-2">
        {(slide.components || []).slice(0, 2).map((c: { label?: string }, i: number) => (
          <div key={i} className="flex flex-col justify-center p-1">
            <span className="text-[4px] font-bold" style={{ color: Y }}>{(c.label || '').toUpperCase()}</span>
            <span className="text-[3px]" style={{ color: W }}>...</span>
          </div>
        ))}
        <div className="row-span-2 border rounded flex flex-col items-center justify-center p-1" style={{ borderColor: Y }}>
          <span className="text-[4px] font-bold text-center" style={{ color: Y }}>{(slide.center_label || '').toUpperCase()}</span>
          <span className="text-[3px] text-center" style={{ color: W }}>{slide.center_body || ''}</span>
        </div>
        {(slide.components || []).slice(2, 4).map((c: { label?: string }, i: number) => (
          <div key={i} className="flex flex-col justify-center p-1">
            <span className="text-[4px] font-bold" style={{ color: Y }}>{(c.label || '').toUpperCase()}</span>
            <span className="text-[3px]" style={{ color: W }}>...</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StrategyTableSlide({ slide }: { slide: any }) {
  const cols = slide.columns || [];
  const rows = slide.rows || [];
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: W }}>
      <span className="text-[5px] font-bold" style={{ color: D }}>{(slide.strategy_name || '').toUpperCase()}</span>
      <h3 className="text-[9px] font-bold mt-1" style={{ color: D }}>{(slide.title || '').toUpperCase()}</h3>
      <div className="w-8 h-[1px] mt-1" style={{ background: Y }} />
      <div className="mt-2 flex-1 overflow-hidden">
        <div className="rounded text-[3px]" style={{ border: '1px solid #ddd' }}>
          <div className="flex" style={{ background: Y }}><span className="px-1 py-[1px] font-bold" style={{ color: D }}>{(slide.table_title || '').toUpperCase()}</span></div>
          <div className="flex" style={{ background: D }}>
            {cols.slice(0, 5).map((c: string, i: number) => <span key={i} className="px-1 py-[1px] font-bold flex-1 text-center" style={{ color: W }}>{c}</span>)}
          </div>
          {rows.slice(0, 4).map((r: string[], i: number) => (
            <div key={i} className="flex" style={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
              {(Array.isArray(r) ? r : [r]).slice(0, 5).map((v: string, j: number) => <span key={j} className="px-1 py-[1px] flex-1 text-center" style={{ color: D }}>{v}</span>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RiskStatsSlide({ slide }: { slide: any }) {
  const rows = slide.rows || [];
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: W }}>
      <span className="text-[5px] font-bold" style={{ color: D }}>{(slide.strategy_name || '').toUpperCase()}</span>
      <h3 className="text-[9px] font-bold mt-1" style={{ color: D }}>{(slide.headline || slide.title || '').toUpperCase()}</h3>
      <div className="w-8 h-[1px] mt-1" style={{ background: Y }} />
      <div className="mt-2 flex-1 overflow-hidden rounded text-[3px]" style={{ border: '1px solid #ddd' }}>
        <div className="flex" style={{ background: Y }}><span className="px-1 py-[1px] font-bold" style={{ color: D }}>{(slide.table_title || 'RISK STATISTICS').toUpperCase()}</span></div>
        {rows.slice(0, 4).map((r: { label?: string; values?: string[] }, i: number) => (
          <div key={i} className="flex" style={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
            <span className="px-1 py-[1px] flex-1" style={{ color: D }}>{r.label || ''}</span>
            {(r.values || []).slice(0, 4).map((v: string, j: number) => <span key={j} className="px-1 py-[1px] text-center font-bold" style={{ color: D }}>{v}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UseCasesSlide({ slide }: { slide: any }) {
  const cases = slide.cases || [];
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: D }}>
      <span className="text-[5px] font-bold" style={{ color: Y }}>{(slide.strategy_name || '').toUpperCase()}</span>
      <h3 className="text-[8px] font-bold mt-1" style={{ color: W }}>{(slide.title || '').toUpperCase()}</h3>
      <div className="flex-1 flex items-center justify-center gap-2 mt-2">
        {cases.slice(0, 4).map((c: { title?: string; body?: string }, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center p-1" style={{ borderColor: Y }}>
              <span className="text-[3px] text-center font-bold" style={{ color: Y }}>{(c.title || '').toUpperCase()}</span>
            </div>
            <span className="text-[3px] text-center mt-1" style={{ color: W }}>{c.body || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThankYouSlide() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4" style={{ background: D }}>
      <div className="text-[6px] font-bold self-start" style={{ color: W }}>POTOMAC</div>
      <h2 className="text-[16px] font-bold mt-4" style={{ color: W }}>THANK YOU!</h2>
      <p className="text-[5px] mt-2" style={{ color: Y }}>We have a team of regional consultants ready to help.</p>
      <p className="text-[4px] mt-2" style={{ color: W }}>potomac.com</p>
    </div>
  );
}

function DisclosuresSlide() {
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: D }}>
      <h3 className="text-[8px] font-bold" style={{ color: Y }}>DISCLOSURES</h3>
      <div className="flex-1 mt-2 space-y-1">
        {[1,2,3,4].map(i => <div key={i} className="h-[3px] rounded-full" style={{ background: '#333', width: `${95 - i * 10}%` }} />)}
        <div className="h-2" />
        {[1,2,3].map(i => <div key={i} className="h-[3px] rounded-full" style={{ background: '#333', width: `${90 - i * 15}%` }} />)}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DefinitionsSlide({ slide }: { slide: any }) {
  const defs = slide.definitions || [];
  return (
    <div className="w-full h-full flex flex-col p-3" style={{ background: D }}>
      <h3 className="text-[7px] font-bold" style={{ color: Y }}>IMPORTANT DEFINITIONS</h3>
      <div className="flex-1 mt-2 space-y-1">
        {defs.slice(0, 4).map((d: { term?: string }, i: number) => (
          <div key={i}>
            <span className="text-[4px] font-bold" style={{ color: W }}>{d.term || 'Term'}:</span>
            <div className="h-[2px] rounded-full mt-[1px]" style={{ background: '#333', width: '80%' }} />
          </div>
        ))}
        {defs.length === 0 && [1,2,3].map(i => <div key={i} className="h-[3px] rounded-full" style={{ background: '#333', width: `${85 - i * 10}%` }} />)}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GenericSlide({ slide }: { slide: any }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4" style={{ background: D }}>
      <h3 className="text-[10px] font-bold" style={{ color: W }}>{(slide.title || slide.layout || 'SLIDE').toUpperCase()}</h3>
    </div>
  );
}

// Main preview component
export default function SlidePreview({ slides, currentIdx, onSelect }: SlidePreviewProps) {
  const current = slides[currentIdx] || slides[0];
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < slides.length - 1;

  return (
    <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[10px] text-gray-500 font-medium">Slide {currentIdx + 1} of {slides.length}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => canPrev && onSelect(currentIdx - 1)} disabled={!canPrev}
            className="text-gray-400 hover:text-white disabled:opacity-20 text-sm">◀</button>
          <button onClick={() => canNext && onSelect(currentIdx + 1)} disabled={!canNext}
            className="text-gray-400 hover:text-white disabled:opacity-20 text-sm">▶</button>
        </div>
      </div>

      {/* Main Slide */}
      <div className="p-4 bg-[#0d0d0d]">
        <div className="relative mx-auto overflow-hidden rounded-lg shadow-2xl" style={{ aspectRatio: '16/9', maxWidth: '100%' }}>
          {current && renderSlide(current)}
        </div>
      </div>

      {/* Filmstrip */}
      <div className="px-3 py-3 bg-[#111] border-t border-gray-800/50 overflow-x-auto">
        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
          {slides.map((slide, i) => (
            <button key={i} onClick={() => onSelect(i)}
              className={`relative flex-shrink-0 rounded-md overflow-hidden transition-all ${i === currentIdx ? 'ring-2 ring-[#FEC00F] shadow-lg scale-105' : 'opacity-60 hover:opacity-90'}`}
              style={{ width: 80, aspectRatio: '16/9' }}>
              <div className="w-full h-full" style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                {renderSlide(slide)}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[5px] text-center py-[1px] text-white font-medium">
                {i + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
