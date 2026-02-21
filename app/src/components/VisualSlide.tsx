'use client';

const THEMES: Record<string, Record<string, string>> = {
  classic: { YELLOW: '#FEC00F', DARK: '#212121', WHITE: '#FFFFFF', GRAY: '#737373', GRAYALT: '#F5F5F5' },
  navy:    { YELLOW: '#FEC00F', DARK: '#1A2744', WHITE: '#FFFFFF', GRAY: '#8899AA', GRAYALT: '#F0F3F6' },
  forest:  { YELLOW: '#4CAF50', DARK: '#1B2E1B', WHITE: '#FFFFFF', GRAY: '#6B8E6B', GRAYALT: '#F0F5F0' },
  slate:   { YELLOW: '#FF6B35', DARK: '#2D2D3D', WHITE: '#FFFFFF', GRAY: '#8E8E9E', GRAYALT: '#F2F2F5' },
  minimal: { YELLOW: '#333333', DARK: '#1A1A1A', WHITE: '#FFFFFF', GRAY: '#999999', GRAYALT: '#F8F8F8' },
};

interface VisualSlideProps {
  slide: any;
  theme?: string;
  onEditField?: (field: string, value: string) => void;
  editable?: boolean;
}

function EditableText({ value, field, onEdit, className, style }: {
  value: string; field: string; onEdit?: (field: string, value: string) => void; className?: string; style?: React.CSSProperties;
}) {
  if (!onEdit) return <span className={className} style={style}>{value}</span>;
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      className={`${className} outline-none focus:ring-1 focus:ring-yellow-400/50 rounded px-0.5 cursor-text`}
      style={style}
      onBlur={e => onEdit(field, e.currentTarget.textContent || '')}
    >
      {value}
    </span>
  );
}

export default function VisualSlide({ slide, theme = 'classic', onEditField, editable = false }: VisualSlideProps) {
  const C = THEMES[theme] || THEMES.classic;
  const layout = slide?.layout || 'section_divider';
  const onEdit = editable ? onEditField : undefined;

  const darkBg = { backgroundColor: C.DARK };
  const lightBg = { backgroundColor: C.WHITE };

  switch (layout) {
    case 'cover':
      return (
        <div className="w-full aspect-video relative overflow-hidden flex flex-col" style={darkBg}>
          <div className="h-1" style={{ backgroundColor: C.YELLOW }} />
          <div className="px-[4%] pt-[3%]">
            <div className="text-[0.7em] font-bold tracking-wider" style={{ color: C.YELLOW, fontFamily: "'Rajdhani', sans-serif" }}>POTOMAC</div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-[8%]">
            <div className="w-[30%] h-[2px] mb-[3%]" style={{ backgroundColor: C.YELLOW }} />
            <EditableText value={(slide.title || 'PRESENTATION TITLE').toUpperCase()} field="title" onEdit={onEdit}
              className="text-center font-bold text-[1.8em] leading-tight" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }} />
            <div className="w-[30%] h-[2px] mt-[3%]" style={{ backgroundColor: C.YELLOW }} />
          </div>
          <div className="px-[4%] pb-[3%] text-center">
            <span className="text-[0.55em] italic" style={{ color: C.YELLOW }}>Built to Conquer Risk®</span>
          </div>
          <div className="h-1" style={{ backgroundColor: C.YELLOW }} />
        </div>
      );

    case 'section_divider':
      return (
        <div className="w-full aspect-video relative overflow-hidden flex flex-col items-center justify-center" style={lightBg}>
          <EditableText value={(slide.section_title || slide.title || 'SECTION').toUpperCase()} field="section_title" onEdit={onEdit}
            className="font-bold text-[1.6em] text-center" style={{ color: C.DARK, fontFamily: "'Rajdhani', sans-serif" }} />
          <div className="w-[22%] h-[3px] mt-[2%]" style={{ backgroundColor: C.YELLOW }} />
        </div>
      );

    case 'three_pillars':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={darkBg}>
          {slide.section_tag && <div className="text-[0.45em] font-bold mb-1" style={{ color: C.YELLOW }}>{slide.section_tag}</div>}
          <EditableText value={(slide.title || '').toUpperCase()} field="title" onEdit={onEdit}
            className="font-bold text-[1.1em] block mb-[1%]" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }} />
          {slide.subtitle && <div className="text-[0.55em] font-bold mb-[3%]" style={{ color: C.YELLOW }}>{slide.subtitle}</div>}
          <div className="flex items-center justify-center gap-[3%] mt-[4%]">
            {(slide.pillars || []).map((p: any, i: number) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-[6em] h-[6em] rounded-full border-2 flex flex-col items-center justify-center"
                  style={{ borderColor: C.YELLOW, backgroundColor: C.DARK }}>
                  <div className="w-[2em] h-[2em] rounded-full flex items-center justify-center text-[0.7em] font-bold mb-1"
                    style={{ backgroundColor: C.YELLOW, color: C.DARK }}>{i + 1}</div>
                  <div className="text-[0.4em] font-bold text-center px-1" style={{ color: C.YELLOW }}>{(p.label || '').toUpperCase()}</div>
                  <div className="text-[0.3em] text-center px-1 mt-0.5" style={{ color: C.WHITE }}>{p.description || ''}</div>
                </div>
                {i < (slide.pillars?.length || 0) - 1 && (
                  <div className="absolute" style={{ color: C.GRAY }}>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'chart':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={lightBg}>
          {slide.section_tag && <div className="text-[0.45em] font-bold mb-1" style={{ color: C.YELLOW }}>{slide.section_tag}</div>}
          <EditableText value={(slide.chart_title || slide.title || 'CHART').toUpperCase()} field="chart_title" onEdit={onEdit}
            className="font-bold text-[1em] block" style={{ color: C.DARK, fontFamily: "'Rajdhani', sans-serif" }} />
          <div className="w-[15%] h-[3px] mt-[1%] mb-[2%]" style={{ backgroundColor: C.YELLOW }} />
          <div className="flex-1 rounded border flex items-center justify-center" style={{ borderColor: C.GRAY, backgroundColor: C.GRAYALT, minHeight: '60%' }}>
            <div className="flex items-end gap-[2%] h-[50%]">
              {[60,80,45,90,70,55,85].map((h, i) => (
                <div key={i} className="w-[1.2em] rounded-t" style={{ height: `${h}%`, backgroundColor: i % 2 === 0 ? C.YELLOW : C.GRAY, opacity: 0.6 }} />
              ))}
            </div>
          </div>
          {slide.chart_caption && <div className="text-[0.35em] mt-[1%] italic" style={{ color: C.GRAY }}>{slide.chart_caption}</div>}
        </div>
      );

    case 'composite_three':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={darkBg}>
          {slide.section_tag && <div className="text-[0.45em] font-bold mb-1" style={{ color: C.YELLOW }}>{slide.section_tag}</div>}
          <EditableText value={(slide.headline || slide.title || '').toUpperCase()} field="headline" onEdit={onEdit}
            className="font-bold text-[0.75em] block mb-[3%]" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }} />
          <div className="flex items-stretch gap-[1%] flex-1" style={{ minHeight: '65%' }}>
            {(slide.components || []).map((c: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col relative">
                <div className="text-[0.35em] font-bold text-center px-1 py-0.5 rounded-full mx-[15%] mb-[-0.5em] z-10 relative"
                  style={{ backgroundColor: c.is_result ? C.YELLOW : '#444', color: c.is_result ? C.DARK : C.YELLOW }}>
                  {(c.title || '').toUpperCase()}
                </div>
                <div className="flex-1 rounded-lg border-2 flex flex-col items-center justify-center p-[8%] pt-[12%]"
                  style={{ borderColor: C.YELLOW, backgroundColor: c.is_result ? C.YELLOW : C.DARK }}>
                  <div className="text-[0.35em] text-center" style={{ color: c.is_result ? C.DARK : C.WHITE }}>
                    {c.body || ''}
                  </div>
                </div>
                {i < (slide.components?.length || 0) - 1 && (
                  <div className="absolute right-[-8%] top-1/2 text-[0.7em] font-bold z-10" style={{ color: C.YELLOW }}>
                    {i === (slide.components?.length || 0) - 2 ? '=' : '+'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'composite_four':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={darkBg}>
          {slide.section_tag && <div className="text-[0.45em] font-bold mb-1" style={{ color: C.YELLOW }}>{slide.section_tag}</div>}
          <EditableText value={(slide.title || '').toUpperCase()} field="title" onEdit={onEdit}
            className="font-bold text-[0.85em] block mb-[2%]" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }} />
          <div className="flex items-center gap-[2%] flex-1" style={{ minHeight: '60%' }}>
            <div className="flex flex-col gap-[2%] flex-1">
              {(slide.components || []).filter((c: any) => !c.is_result).map((c: any, i: number) => (
                <div key={i} className="border-2 rounded p-[4%]" style={{ borderColor: C.YELLOW }}>
                  <div className="text-[0.4em] font-bold" style={{ color: C.YELLOW }}>{(c.title || '').toUpperCase()}</div>
                  <div className="text-[0.33em] mt-0.5" style={{ color: C.WHITE }}>{c.body || ''}</div>
                </div>
              ))}
            </div>
            <div className="text-[1.2em] font-bold" style={{ color: C.YELLOW }}>→</div>
            {(slide.components || []).filter((c: any) => c.is_result).map((c: any, i: number) => (
              <div key={i} className="flex-1 rounded p-[4%] flex flex-col items-center justify-center" style={{ backgroundColor: C.YELLOW, minHeight: '80%' }}>
                <div className="text-[0.45em] font-bold text-center" style={{ color: C.DARK }}>{(c.title || '').toUpperCase()}</div>
                <div className="text-[0.35em] mt-1 text-center" style={{ color: C.DARK }}>{c.body || ''}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'five_component_diagram':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={darkBg}>
          {slide.section_tag && <div className="text-[0.45em] font-bold mb-1" style={{ color: C.YELLOW }}>{slide.section_tag}</div>}
          <EditableText value={(slide.title || '').toUpperCase()} field="title" onEdit={onEdit}
            className="font-bold text-[0.85em] block" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }} />
          <div className="relative flex-1 mt-[2%]" style={{ minHeight: '70%' }}>
            {(slide.components || []).map((c: any, i: number) => {
              const positions: Record<string, string> = { top_left: 'top-0 left-0', top_right: 'top-0 right-0', bottom_left: 'bottom-0 left-0', bottom_right: 'bottom-0 right-0' };
              return (
                <div key={i} className={`absolute w-[42%] ${positions[c.position] || ''}`}>
                  <div className="text-[0.4em] font-bold" style={{ color: C.YELLOW }}>{(c.label || '').toUpperCase()}</div>
                  <div className="text-[0.3em] mt-0.5" style={{ color: C.WHITE }}>{c.body || ''}</div>
                </div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] border-2 rounded p-[2%] text-center"
              style={{ borderColor: C.YELLOW }}>
              <div className="text-[0.38em] font-bold" style={{ color: C.YELLOW }}>{(slide.center_label || '').toUpperCase()}</div>
              <div className="text-[0.28em] mt-0.5" style={{ color: C.WHITE }}>{slide.center_body || ''}</div>
            </div>
          </div>
        </div>
      );

    case 'strategy_table':
    case 'risk_statistics':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={lightBg}>
          {slide.strategy_name && <div className="text-[0.45em] font-bold mb-1" style={{ color: C.YELLOW }}>{slide.strategy_name}</div>}
          <EditableText value={(slide.title || slide.headline || 'TABLE').toUpperCase()} field={layout === 'strategy_table' ? 'title' : 'headline'} onEdit={onEdit}
            className="font-bold text-[0.9em] block" style={{ color: C.DARK, fontFamily: "'Rajdhani', sans-serif" }} />
          <div className="w-[15%] h-[3px] mt-[1%] mb-[2%]" style={{ backgroundColor: C.YELLOW }} />
          <div className="border rounded overflow-hidden" style={{ borderColor: '#ddd' }}>
            {slide.table_title && (
              <div className="text-[0.4em] font-bold text-center py-1" style={{ backgroundColor: C.YELLOW, color: C.DARK }}>
                {slide.table_title.toUpperCase()}
              </div>
            )}
            {(slide.columns || []).length > 0 && (
              <div className="flex" style={{ backgroundColor: C.DARK }}>
                {layout === 'risk_statistics' && <div className="flex-1 text-[0.33em] font-bold text-center py-0.5" style={{ color: C.WHITE }}></div>}
                {(slide.columns || []).map((col: string, i: number) => (
                  <div key={i} className="flex-1 text-[0.33em] font-bold text-center py-0.5" style={{ color: C.WHITE }}>
                    {col.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
            {(slide.rows || []).slice(0, 5).map((row: any, i: number) => (
              <div key={i} className="flex" style={{ backgroundColor: i % 2 === 0 ? C.WHITE : C.GRAYALT }}>
                {Array.isArray(row) ? (
                  row.map((cell: string, j: number) => (
                    <div key={j} className="flex-1 text-[0.3em] text-center py-0.5" style={{ color: C.DARK }}>{String(cell)}</div>
                  ))
                ) : (
                  <>
                    <div className="flex-1 text-[0.3em] py-0.5 px-1" style={{ color: C.DARK }}>{row.label || ''}</div>
                    {(row.values || []).map((v: string, j: number) => (
                      <div key={j} className="flex-1 text-[0.3em] text-center py-0.5 font-bold" style={{ color: C.DARK }}>{String(v)}</div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
          {(slide.footnote || slide.disclaimer) && (
            <div className="text-[0.28em] mt-[1%] italic" style={{ color: C.GRAY }}>{slide.footnote || slide.disclaimer}</div>
          )}
        </div>
      );

    case 'use_cases':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={darkBg}>
          {slide.strategy_name && <div className="text-[0.45em] font-bold mb-1" style={{ color: C.YELLOW }}>{slide.strategy_name}</div>}
          <EditableText value={(slide.title || '').toUpperCase()} field="title" onEdit={onEdit}
            className="font-bold text-[0.9em] block mb-[3%]" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }} />
          <div className="flex items-center justify-center gap-[3%]">
            {(slide.cases || []).slice(0, 4).map((c: any, i: number) => (
              <div key={i} className="w-[5.5em] h-[5.5em] rounded-full border-2 flex flex-col items-center justify-center p-[3%]"
                style={{ borderColor: C.YELLOW }}>
                <div className="text-[0.35em] font-bold text-center" style={{ color: C.YELLOW }}>{(c.title || '').toUpperCase()}</div>
                <div className="text-[0.25em] text-center mt-0.5" style={{ color: C.WHITE }}>{c.body || ''}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'thank_you':
      return (
        <div className="w-full aspect-video relative overflow-hidden flex flex-col items-center justify-center" style={darkBg}>
          <div className="text-[0.6em] font-bold tracking-wider mb-[5%]" style={{ color: C.YELLOW }}>POTOMAC</div>
          <div className="text-[2em] font-bold" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }}>THANK YOU!</div>
          <div className="text-[0.5em] italic mt-[2%]" style={{ color: C.YELLOW }}>We have a team of regional consultants ready to help.</div>
          <div className="text-[0.4em] mt-[3%]" style={{ color: C.WHITE }}>potomac.com</div>
        </div>
      );

    case 'disclosures':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={darkBg}>
          <div className="text-[0.7em] font-bold mb-[2%]" style={{ color: C.YELLOW, fontFamily: "'Rajdhani', sans-serif" }}>DISCLOSURES</div>
          <div className="text-[0.28em] leading-relaxed" style={{ color: C.WHITE, opacity: 0.8 }}>
            Potomac is a registered investment adviser. Registration with the SEC does not imply a certain level of skill or training. Past performance does not guarantee future results. All investing involves risk, including possible loss of principal...
          </div>
        </div>
      );

    case 'definitions':
      return (
        <div className="w-full aspect-video relative overflow-hidden p-[4%]" style={darkBg}>
          <div className="text-[0.6em] font-bold mb-[2%]" style={{ color: C.YELLOW, fontFamily: "'Rajdhani', sans-serif" }}>IMPORTANT DEFINITIONS</div>
          <div className="space-y-[1%]">
            {(slide.definitions || [{ term: 'S&P 500', definition: 'Market-cap weighted index of 500 US companies' }]).slice(0, 5).map((d: any, i: number) => (
              <div key={i} className="text-[0.3em]" style={{ color: C.WHITE }}>
                <span className="font-bold" style={{ color: C.YELLOW }}>{d.term}: </span>{d.definition}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full aspect-video relative overflow-hidden flex items-center justify-center p-[4%]" style={darkBg}>
          <div className="text-center">
            <div className="text-[0.5em] mb-1" style={{ color: C.GRAY }}>{layout}</div>
            <EditableText value={(slide.title || slide.headline || slide.section_title || 'SLIDE').toUpperCase()} field="title" onEdit={onEdit}
              className="font-bold text-[1em]" style={{ color: C.WHITE, fontFamily: "'Rajdhani', sans-serif" }} />
          </div>
        </div>
      );
  }
}
