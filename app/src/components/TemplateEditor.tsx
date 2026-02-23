'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SERVER_LOGOS, COLOR_PRESETS, GRADIENT_PRESETS, SHAPE_DEFINITIONS, THEME_PRESETS } from './DesignToolsPanel';

interface SlideElement { id: string; type: 'text'|'shape'|'image'|'table'|'chart'; x: number; y: number; w: number; h: number; style?: Record<string,any>; content?: string|Record<string,any>; options?: Record<string,any>; effects?: { shadow?: { enabled: boolean; color: string; blur: number; x: number; y: number }; opacity?: number }; }
interface SlideConfig { background: { color?: string; image?: string; gradient?: any; pattern?: any }; elements: SlideElement[]; master?: string; theme?: string; }
interface Template { id: string; name: string; description?: string; category: string; layout_type: string; slide_config: SlideConfig; is_public: boolean; }
interface Asset { id: string; name: string; type: string; url: string; }

const SW = 13.33, SH = 7.5, SC = 100;
const LAYOUTS = ['cover','section_divider','content','chart','table','three_column','two_column','full_image','quote','thank_you'];
const ALL_COLORS = [...COLOR_PRESETS.brand, ...COLOR_PRESETS.neutrals, ...COLOR_PRESETS.themes, ...COLOR_PRESETS.accents];
const SHAPES = SHAPE_DEFINITIONS;
function gid() { return 'el_' + Math.random().toString(36).substr(2, 9); }

export default function TemplateEditor({ templateId, onSave, initialTemplate }: { templateId?: string; onSave?: (t: Template) => void; initialTemplate?: any }) {
  const [template, setTemplate] = useState<Partial<Template>>({ name:'New Template', category:'custom', layout_type:'content', slide_config:{ background:{color:'#212121'}, elements:[] }, ...(initialTemplate||{}) });
  const initialLoadedRef = useRef(false);
  useEffect(() => { if(initialLoadedRef.current) return; initialLoadedRef.current=true; if(initialTemplate){setTemplate(initialTemplate);}else{const c=window.sessionStorage.getItem('new_template_config');if(c&&!templateId){try{setTemplate(JSON.parse(c));window.sessionStorage.removeItem('new_template_config');}catch(e){}}} }, []);
  const [assets,setAssets]=useState<Asset[]>([]); const [selectedIds,setSelectedIds]=useState<string[]>([]); const [zoom,setZoom]=useState(75);
  const [editingTextId,setEditingTextId]=useState<string|null>(null); const [clipboard,setClipboard]=useState<SlideElement[]>([]);
  const [history,setHistory]=useState<any[][]>([]); const [historyIdx,setHistoryIdx]=useState(-1);
  const [dragging,setDragging]=useState<{ids:string[];startX:number;startY:number;origPositions:Record<string,{x:number;y:number}>}|null>(null);
  const [resizing,setResizing]=useState<{id:string;corner:string;startX:number;startY:number;elementW:number;elementH:number;elementX:number;elementY:number}|null>(null);
  const [showGuideH,setShowGuideH]=useState(false); const [showGuideV,setShowGuideV]=useState(false);
  const [showAssetPicker,setShowAssetPicker]=useState(false); const [saving,setSaving]=useState(false); const [loading,setLoading]=useState(false);
  const [currentSlideIdx,setCurrentSlideIdx]=useState(0); const [showShapePicker,setShowShapePicker]=useState(false);
  const canvasRef=useRef<HTMLDivElement>(null);
  const pendingDragRef=useRef<{ids:string[];startX:number;startY:number;origPositions:Record<string,{x:number;y:number}>}|null>(null);

  const getAllSlides=(t:Partial<Template>):any[]=>{const sc=(t as any).slide_config;if(!sc)return[{background:{color:'#212121'},elements:[]}];if(sc.slides&&Array.isArray(sc.slides))return sc.slides;return[{background:sc.background||{color:'#212121'},elements:sc.elements||[]}];};
  const getActiveSlide=()=>{const slides=getAllSlides(template);return slides[Math.min(currentSlideIdx,slides.length-1)]||{background:{color:'#212121'},elements:[]};};

  useEffect(()=>{if(templateId){setLoading(true);setCurrentSlideIdx(0);fetch(`/api/templates/${templateId}`).then(r=>r.json()).then(d=>{if(d.template){const t=d.template;if(!t.slide_config)t.slide_config={background:{color:'#212121'},elements:[]};setTemplate(t);}}).catch(e=>console.error(e)).finally(()=>setLoading(false));}},[templateId]);
  useEffect(()=>{fetch('/api/assets').then(r=>r.json()).then(d=>setAssets(d.assets||[]));},[]);

  const updateActiveSlideElements=useCallback((ne:SlideElement[])=>{setTemplate(p=>{const sc=(p as any).slide_config;if(sc?.slides&&Array.isArray(sc.slides)){const ns=[...sc.slides];ns[currentSlideIdx]={...ns[currentSlideIdx],elements:ne};return{...p,slide_config:{...sc,slides:ns}};}return{...p,slide_config:{...sc,elements:ne}};});},[currentSlideIdx]);
  const updateActiveSlideBg=(color:string)=>{setTemplate(p=>{const sc=(p as any).slide_config;if(sc?.slides&&Array.isArray(sc.slides)){const ns=[...sc.slides];ns[currentSlideIdx]={...ns[currentSlideIdx],background:{color}};return{...p,slide_config:{...sc,slides:ns}};}return{...p,slide_config:{...sc,background:{color}}};});};
  const pushHistory=useCallback((els:SlideElement[])=>{setHistory(p=>{const n=p.slice(0,historyIdx+1);n.push([...els]);return n.slice(-50);});setHistoryIdx(p=>Math.min(p+1,49));},[historyIdx]);

  const handleMouseDown=(e:React.MouseEvent,eid:string)=>{e.stopPropagation();if(editingTextId)return;const sh=e.shiftKey;let nids:string[];if(sh){nids=selectedIds.includes(eid)?selectedIds.filter(i=>i!==eid):[...selectedIds,eid];}else{nids=selectedIds.includes(eid)?selectedIds:[eid];}setSelectedIds(nids);const els=getActiveSlide().elements||[];const op:Record<string,{x:number;y:number}>={};els.forEach((el:SlideElement)=>{op[el.id]={x:el.x,y:el.y};});pendingDragRef.current={ids:nids,startX:e.clientX,startY:e.clientY,origPositions:op};};
  const handleResizeStart=(e:React.MouseEvent,eid:string,corner:string)=>{e.stopPropagation();setSelectedIds([eid]);const els=getActiveSlide().elements||[];const el=els.find((e:SlideElement)=>e.id===eid);if(!el)return;setResizing({id:eid,corner,startX:e.clientX,startY:e.clientY,elementW:el.w,elementH:el.h,elementX:el.x,elementY:el.y});};

  const handleMouseMove=useCallback((e:MouseEvent)=>{const s=zoom/100;if(pendingDragRef.current&&!dragging){const dx=e.clientX-pendingDragRef.current.startX,dy=e.clientY-pendingDragRef.current.startY;if(Math.abs(dx)>4||Math.abs(dy)>4){setDragging(pendingDragRef.current);pendingDragRef.current=null;}return;}if(dragging){const dx=(e.clientX-dragging.startX)/(SC*s),dy=(e.clientY-dragging.startY)/(SC*s);const els=getActiveSlide().elements||[];updateActiveSlideElements(els.map((el:SlideElement)=>{if(!dragging.ids.includes(el.id))return el;const o=dragging.origPositions[el.id];if(!o)return el;return{...el,x:Math.max(0,Math.min(SW-el.w,o.x+dx)),y:Math.max(0,Math.min(SH-el.h,o.y+dy))};}));const m=els.find((el:SlideElement)=>el.id===dragging.ids[0]);if(m){const o=dragging.origPositions[m.id];if(o){setShowGuideV(Math.abs(o.x+dx+m.w/2-SW/2)<0.2);setShowGuideH(Math.abs(o.y+dy+m.h/2-SH/2)<0.2);}}}if(resizing){const dx=(e.clientX-resizing.startX)/(SC*s),dy=(e.clientY-resizing.startY)/(SC*s);let nw=resizing.elementW,nh=resizing.elementH,nx=resizing.elementX,ny=resizing.elementY;if(resizing.corner.includes('e'))nw=Math.max(0.5,resizing.elementW+dx);if(resizing.corner.includes('w')){nw=Math.max(0.5,resizing.elementW-dx);nx=resizing.elementX+dx;}if(resizing.corner.includes('s'))nh=Math.max(0.5,resizing.elementH+dy);if(resizing.corner.includes('n')){nh=Math.max(0.5,resizing.elementH-dy);ny=resizing.elementY+dy;}const els=getActiveSlide().elements||[];updateActiveSlideElements(els.map((el:SlideElement)=>el.id===resizing.id?{...el,w:nw,h:nh,x:nx,y:ny}:el));}},[dragging,resizing,zoom,currentSlideIdx,template]);

  const handleMouseUp=useCallback(()=>{pendingDragRef.current=null;if(dragging||resizing){setShowGuideH(false);setShowGuideV(false);pushHistory(getActiveSlide().elements||[]);}setDragging(null);setResizing(null);},[dragging,resizing]);
  useEffect(()=>{window.addEventListener('mousemove',handleMouseMove);window.addEventListener('mouseup',handleMouseUp);return()=>{window.removeEventListener('mousemove',handleMouseMove);window.removeEventListener('mouseup',handleMouseUp);};},[handleMouseMove,handleMouseUp]);

  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(editingTextId)return;const els=getActiveSlide().elements||[];const ctrl=e.ctrlKey||e.metaKey;if(e.key==='Escape'){setSelectedIds([]);setEditingTextId(null);}if((e.key==='Delete'||e.key==='Backspace')&&selectedIds.length>0){e.preventDefault();pushHistory(els);updateActiveSlideElements(els.filter((el:SlideElement)=>!selectedIds.includes(el.id)));setSelectedIds([]);}if(ctrl&&e.key==='a'){e.preventDefault();setSelectedIds(els.map((el:SlideElement)=>el.id));}if(ctrl&&e.key==='c'&&selectedIds.length>0)setClipboard(els.filter((el:SlideElement)=>selectedIds.includes(el.id)));if(ctrl&&e.key==='v'&&clipboard.length>0){e.preventDefault();const p=clipboard.map(el=>({...el,id:gid(),x:el.x+0.3,y:el.y+0.3}));pushHistory(els);updateActiveSlideElements([...els,...p]);setSelectedIds(p.map(el=>el.id));}if(ctrl&&e.key==='z'){e.preventDefault();if(historyIdx>0){setHistoryIdx(h=>h-1);updateActiveSlideElements(history[historyIdx-1]);}}if(ctrl&&e.key==='y'){e.preventDefault();if(historyIdx<history.length-1){setHistoryIdx(h=>h+1);updateActiveSlideElements(history[historyIdx+1]);}}if(selectedIds.length>0&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const n=e.shiftKey?0.5:0.1;const dx=e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0;const dy=e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0;updateActiveSlideElements(els.map((el:SlideElement)=>selectedIds.includes(el.id)?{...el,x:el.x+dx,y:el.y+dy}:el));}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[editingTextId,selectedIds,clipboard,history,historyIdx,currentSlideIdx,template]);

  const addElement=(type:SlideElement['type'],shapeId?:string)=>{const ne:SlideElement={id:gid(),type,x:1.5,y:1.5,w:type==='text'?5:type==='chart'||type==='table'?6:2,h:type==='text'?1.2:type==='chart'||type==='table'?4:2,style:{color:'#FFFFFF',fontSize:24,fontFace:'Rajdhani',bold:false,align:'center'},content:type==='text'?'Click to edit':undefined,options:type==='shape'?{shape:shapeId||'rect',fill:'#FEC00F'}:undefined};const els=getActiveSlide().elements||[];pushHistory(els);updateActiveSlideElements([...els,ne]);setSelectedIds([ne.id]);setShowShapePicker(false);};
  const updateElement=(id:string,u:Partial<SlideElement>)=>{const els=getActiveSlide().elements||[];updateActiveSlideElements(els.map((el:SlideElement)=>el.id===id?{...el,...u}:el));};
  const deleteElement=(id:string)=>{const els=getActiveSlide().elements||[];pushHistory(els);updateActiveSlideElements(els.filter((el:SlideElement)=>el.id!==id));setSelectedIds(p=>p.filter(s=>s!==id));};
  const addImageElement=(a:Asset)=>{const ne:SlideElement={id:gid(),type:'image',x:1,y:1,w:4,h:3,content:a.url,options:{sizing:'contain'}};const els=getActiveSlide().elements||[];updateActiveSlideElements([...els,ne]);setShowAssetPicker(false);setSelectedIds([ne.id]);};
  const saveTemplate=async()=>{setSaving(true);try{const m=template.id?'PUT':'POST';const u=template.id?`/api/templates/${template.id}`:'/api/templates';const r=await fetch(u,{method:m,headers:{'Content-Type':'application/json'},body:JSON.stringify(template)});const d=await r.json();if(d.template){setTemplate(d.template);onSave?.(d.template);alert('Saved!');}}catch(e){alert('Save failed');}finally{setSaving(false);}};

  const sid=selectedIds[0]??null;
  const sel=sid?(getActiveSlide().elements||[]).find((el:SlideElement)=>el.id===sid)??null:null;
  const cW=SW*SC*(zoom/100), cH=SH*SC*(zoom/100), s=zoom/100;
  const allSlides=getAllSlides(template);
  const activeSlide=getActiveSlide();
  const shapeStyle=(sh:string,fill:string)=>{const found=SHAPES.find(s=>s.id===sh);const style:any={backgroundColor:fill};if(found?.clipPath)style.clipPath=found.clipPath;if(found?.borderRadius){if(found.borderRadius==='50%')style.borderRadius='50%';else if(typeof found.borderRadius==='number')style.borderRadius=`${found.borderRadius}px`;}return style;};

  return (<div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] bg-[#0a0a0a] rounded-xl overflow-hidden text-white">
    {/* TOP TOOLBAR */}
    <div className="flex items-center gap-2 px-3 py-2 bg-[#212121] border-b border-gray-800 shrink-0">
      <input value={template.name||''} onChange={e=>setTemplate(p=>({...p,name:e.target.value}))} className="bg-transparent text-[#FEC00F] font-semibold text-sm border-b border-transparent hover:border-gray-600 focus:border-[#FEC00F] outline-none w-40 px-1" />
      <div className="h-4 w-px bg-gray-700 mx-1"/>
      {/* Tool buttons */}
      <button onClick={()=>addElement('text')} className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Text"><span className="font-bold text-sm">T</span></button>
      <div className="relative">
        <button onClick={()=>setShowShapePicker(!showShapePicker)} className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded flex items-center gap-1" title="Shapes">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2}/></svg>
          <span className="text-[10px]">▼</span>
        </button>
        {showShapePicker && <div className="absolute top-full left-0 mt-1 bg-[#2a2a2a] border border-gray-700 rounded-lg p-2 grid grid-cols-4 gap-1 z-50 shadow-xl w-48">
          {SHAPES.map(sh=><button key={sh.id} onClick={()=>addElement('shape',sh.id)} className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded text-center">
            <div className="w-6 h-6 bg-[#FEC00F]" style={{borderRadius:sh.id==='ellipse'?'50%':sh.id==='roundRect'?'4px':0,clipPath:sh.clipPath||undefined}}/>
            <span className="text-[9px] text-gray-400">{sh.name}</span>
          </button>)}
        </div>}
      </div>
      <button onClick={()=>setShowAssetPicker(true)} className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded" title="Image">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>
      <button onClick={()=>addElement('chart')} className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded" title="Chart">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m4 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4"/></svg>
      </button>
      <button onClick={()=>addElement('table')} className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded" title="Table">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      </button>
      <div className="flex-1"/>
      {/* Zoom + actions */}
      <button onClick={()=>setZoom(z=>Math.max(25,z-10))} className="px-1.5 py-1 text-xs bg-[#0a0a0a] hover:bg-gray-800 rounded text-gray-400">−</button>
      <select value={zoom} onChange={e=>setZoom(Number(e.target.value))} className="text-[10px] bg-[#0a0a0a] border border-gray-700 rounded px-1 py-1 text-gray-300">
        {[25,50,75,100,125,150].map(z=><option key={z} value={z}>{z}%</option>)}
      </select>
      <button onClick={()=>setZoom(z=>Math.min(200,z+10))} className="px-1.5 py-1 text-xs bg-[#0a0a0a] hover:bg-gray-800 rounded text-gray-400">+</button>
      <div className="h-4 w-px bg-gray-700 mx-1"/>
      <button onClick={()=>{if(historyIdx>0){setHistoryIdx(h=>h-1);updateActiveSlideElements(history[historyIdx-1]);}}} disabled={historyIdx<=0} className="px-2 py-1 text-xs bg-[#0a0a0a] hover:bg-gray-800 rounded disabled:opacity-30 text-gray-400" title="Undo">↩</button>
      <button onClick={()=>{if(historyIdx<history.length-1){setHistoryIdx(h=>h+1);updateActiveSlideElements(history[historyIdx+1]);}}} disabled={historyIdx>=history.length-1} className="px-2 py-1 text-xs bg-[#0a0a0a] hover:bg-gray-800 rounded disabled:opacity-30 text-gray-400" title="Redo">↪</button>
      <button onClick={saveTemplate} disabled={saving} className="px-4 py-1.5 bg-[#FEC00F] text-[#212121] font-bold rounded-lg text-xs hover:bg-yellow-400 disabled:opacity-40">{saving?'Saving...':'Save'}</button>
    </div>

    {/* MAIN LAYOUT */}
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT: Slide Panel */}
      <div className="w-44 bg-[#141414] border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-3 py-2 border-b border-gray-800/50 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Slides ({allSlides.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {allSlides.map((slide:any,i:number)=>(
            <div key={i} onClick={()=>{setCurrentSlideIdx(i);setSelectedIds([]);}} className={`mx-1.5 mb-1 rounded-lg cursor-pointer transition-all border ${currentSlideIdx===i?'border-[#FEC00F]/60 bg-[#FEC00F]/10':'border-transparent hover:bg-[#1a1a1a]'}`}>
              <div className="p-1.5">
                <div className="w-full aspect-[16/9] rounded" style={{backgroundColor:slide.background?.color||'#212121',overflow:'hidden',position:'relative'}}>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/60 font-medium">{slide.name||`Slide ${i+1}`}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-gray-500 font-bold">{i+1}</span>
                  <span className="text-[9px] text-gray-400 truncate">{slide.name||slide.layout||'Untitled'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d]">
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          {loading?<div className="flex flex-col items-center gap-3"><div className="w-10 h-10 border-4 border-[#FEC00F] border-t-transparent rounded-full animate-spin"/><p className="text-gray-500 text-sm">Loading...</p></div>:(
          <div ref={canvasRef} className="relative shadow-2xl border border-gray-800" style={{width:cW,height:cH,backgroundColor:activeSlide.background?.color||'#212121',backgroundImage:activeSlide.background?.image?`url(${activeSlide.background.image})`:undefined,backgroundSize:'cover',flexShrink:0,overflow:'hidden'}} onClick={()=>{setSelectedIds([]);setEditingTextId(null);}}>
            {showGuideH&&<div className="absolute left-0 right-0 pointer-events-none" style={{top:cH/2,height:1,backgroundColor:'rgba(255,80,80,0.8)',zIndex:100}}/>}
            {showGuideV&&<div className="absolute top-0 bottom-0 pointer-events-none" style={{left:cW/2,width:1,backgroundColor:'rgba(255,80,80,0.8)',zIndex:100}}/>}
            {(activeSlide.elements||[]).map((el:any)=>{const isSel=selectedIds.includes(el.id);const isEd=editingTextId===el.id;return(
              <div key={el.id} className={`absolute ${isEd?'cursor-text':'cursor-move'} ${isSel?'ring-2 ring-[#FEC00F]':''}`} style={{left:el.x*SC*s,top:el.y*SC*s,width:el.w*SC*s,height:el.h*SC*s,userSelect:isEd?'text':'none'}} onMouseDown={e=>handleMouseDown(e,el.id)} onDoubleClick={e=>{e.stopPropagation();if(el.type==='text')setEditingTextId(el.id);}}>
                {el.type==='text'&&!isEd&&<div className="w-full h-full flex items-center justify-center overflow-hidden" style={{color:el.style?.color||'#FFF',fontSize:(el.style?.fontSize||24)*(SC/72)*s,fontFamily:el.style?.fontFace||'Arial',fontWeight:el.style?.bold?'bold':'normal',textAlign:el.style?.align||'center'}}>{el.content as string}</div>}
                {el.type==='text'&&isEd&&<textarea autoFocus className="w-full h-full bg-transparent border-none outline-none resize-none" style={{color:el.style?.color||'#FFF',fontSize:(el.style?.fontSize||24)*(SC/72)*s,fontFamily:el.style?.fontFace||'Arial',fontWeight:el.style?.bold?'bold':'normal',textAlign:el.style?.align||'center'}} value={el.content as string||''} onChange={e=>{e.stopPropagation();updateElement(el.id,{content:e.target.value});}} onBlur={()=>setEditingTextId(null)} onClick={e=>e.stopPropagation()}/>}
                {el.type==='shape'&&<div className="w-full h-full" style={shapeStyle(el.options?.shape||'rect',el.options?.fill||'#FEC00F')}/>}
                {el.type==='image'&&<img src={el.content as string} alt="" className="w-full h-full object-contain"/>}
                {el.type==='chart'&&<div className="w-full h-full bg-gray-700/50 flex items-center justify-center text-gray-400 text-xs">[Chart]</div>}
                {el.type==='table'&&<div className="w-full h-full bg-gray-700/50 flex items-center justify-center text-gray-400 text-xs">[Table]</div>}
                {isSel&&!isEd&&<>{['nw','n','ne','e','se','s','sw','w'].map(c=>{const pos:any={};if(c.includes('n'))pos.top='-5px';if(c.includes('s'))pos.bottom='-5px';if(c.includes('w'))pos.left='-5px';if(c.includes('e'))pos.right='-5px';if(c==='n'||c==='s'){pos.left='50%';pos.transform='translateX(-50%)';}if(c==='w'||c==='e'){pos.top='50%';pos.transform='translateY(-50%)';}return<div key={c} className="absolute w-2.5 h-2.5 bg-[#FEC00F] border border-yellow-600 rounded-sm z-10" style={{...pos,cursor:`${c}-resize`}} onMouseDown={e=>handleResizeStart(e,el.id,c)}/>;})}</>}
              </div>
            );})}
          </div>)}
        </div>
        {/* Element count bar */}
        <div className="px-4 py-1.5 bg-[#141414] border-t border-gray-800 flex items-center gap-3">
          <span className="text-[10px] text-gray-500">{(activeSlide.elements||[]).length} elements</span>
          {selectedIds.length>0&&<span className="text-[10px] text-[#FEC00F]">{selectedIds.length} selected</span>}
          <div className="flex-1"/>
          <span className="text-[10px] text-gray-600">Slide {currentSlideIdx+1}/{allSlides.length}</span>
        </div>
      </div>

      {/* RIGHT: Properties */}
      <div className="w-72 bg-[#141414] border-l border-gray-800 flex flex-col overflow-hidden shrink-0">
        <div className="px-4 py-2.5 border-b border-gray-800"><span className="text-xs font-semibold text-[#FEC00F]">Properties</span></div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3 border-b border-gray-800/50">
            <div><label className="text-[10px] text-gray-500 block mb-1">Layout Type</label>
              <select value={template.layout_type||'content'} onChange={e=>setTemplate(p=>({...p,layout_type:e.target.value}))} className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FEC00F]">
                {LAYOUTS.map(l=><option key={l} value={l}>{l.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="p-4 space-y-2 border-b border-gray-800/50">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Background</h4>
            <div className="flex flex-wrap gap-1.5">{ALL_COLORS.map(c=><button key={c} onClick={()=>updateActiveSlideBg(c)} className={`w-7 h-7 rounded border-2 ${activeSlide.background?.color===c?'border-[#FEC00F]':'border-gray-700'}`} style={{backgroundColor:c}}/>)}</div>
          </div>
          {sel&&<div className="p-4 space-y-3 border-b border-gray-800/50">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Element</h4>
            <div className="grid grid-cols-2 gap-2">
              {['x','y','w','h'].map(f=><div key={f}><label className="text-[9px] text-gray-500 uppercase">{f}</label><input type="number" step="0.1" value={(sel as any)[f]?.toFixed(1)} onChange={e=>updateElement(sel.id,{[f]:parseFloat(e.target.value)})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-xs text-white"/></div>)}
            </div>
            {sel.type==='text'&&<><div><label className="text-[9px] text-gray-500">Text</label><input value={sel.content as string||''} onChange={e=>updateElement(sel.id,{content:e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-xs text-white"/></div>
              <div><label className="text-[9px] text-gray-500">Font Size</label><input type="number" value={sel.style?.fontSize||24} onChange={e=>updateElement(sel.id,{style:{...sel.style,fontSize:parseInt(e.target.value)}})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-xs text-white"/></div>
              <div><label className="text-[9px] text-gray-500">Color</label><div className="flex flex-wrap gap-1">{ALL_COLORS.map(c=><button key={c} onClick={()=>updateElement(sel.id,{style:{...sel.style,color:c}})} className={`w-5 h-5 rounded ${sel.style?.color===c?'ring-2 ring-[#FEC00F]':''}`} style={{backgroundColor:c}}/>)}</div></div></>}
            {sel.type==='shape'&&<div><label className="text-[9px] text-gray-500">Fill</label><div className="flex flex-wrap gap-1">{ALL_COLORS.map(c=><button key={c} onClick={()=>updateElement(sel.id,{options:{...sel.options,fill:c}})} className={`w-5 h-5 rounded ${sel.options?.fill===c?'ring-2 ring-[#FEC00F]':''}`} style={{backgroundColor:c}}/>)}</div></div>}
            <button onClick={()=>deleteElement(sel.id)} className="w-full px-3 py-2 bg-red-900/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-900/50 border border-red-800/50">Delete Element</button>
          </div>}
        </div>
      </div>
    </div>

    {/* Asset Picker Modal */}
    {showAssetPicker&&<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={()=>setShowAssetPicker(false)}>
      <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700" onClick={e=>e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Select Image</h3>
        {assets.length===0?<p className="text-gray-500">No assets. Upload in Asset Library.</p>:
        <div className="grid grid-cols-4 gap-3">{assets.filter(a=>['image','logo','icon'].includes(a.type)).map(a=><button key={a.id} onClick={()=>addImageElement(a)} className="aspect-square bg-[#0a0a0a] rounded-lg overflow-hidden hover:ring-2 ring-[#FEC00F]"><img src={a.url} alt={a.name} className="w-full h-full object-contain"/></button>)}</div>}
      </div>
    </div>}
  </div>);
}
