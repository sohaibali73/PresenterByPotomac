'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { SHAPE_DEFINITIONS } from './DesignToolsPanel';

// Canvas element type
export interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'table' | 'chart' | 'group';
  x: number;
  y: number;
  w: number;
  h: number;
  style?: {
    color?: string;
    fontSize?: number;
    fontFace?: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    letterSpacing?: string;
    lineHeight?: number;
  };
  content?: string | Record<string, any>;
  options?: {
    shape?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    sizing?: 'contain' | 'cover' | 'stretch';
    [key: string]: any;
  };
  effects?: {
    shadow?: {
      enabled: boolean;
      color: string;
      blur: number;
      x: number;
      y: number;
    };
    opacity?: number;
  };
  locked?: boolean;
  rotation?: number;
  zIndex?: number;
}

// Canvas background
export interface CanvasBackground {
  color?: string;
  image?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
}

// Props for the canvas
export interface InteractiveCanvasProps {
  elements: CanvasElement[];
  background?: CanvasBackground;
  zoom?: number;
  onChange: (elements: CanvasElement[]) => void;
  onSelectElement?: (id: string | null) => void;
  selectedId?: string | null;
  readOnly?: boolean;
  showGuides?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

// Constants
export const SLIDE_WIDTH = 13.33; // inches
export const SLIDE_HEIGHT = 7.5; // inches
export const SCALE = 100; // pixels per inch

// Helper to generate unique IDs
export function generateElementId(): string {
  return 'el_' + Math.random().toString(36).substr(2, 9);
}

// Alias for backward compatibility
export const generateId = generateElementId;

// Shape style generator
function getShapeStyle(shapeId: string, fill: string, stroke?: string, strokeWidth?: number): React.CSSProperties {
  const shape = SHAPE_DEFINITIONS.find(s => s.id === shapeId);
  const style: React.CSSProperties = {
    backgroundColor: fill,
    border: stroke ? `${strokeWidth || 1}px solid ${stroke}` : undefined,
  };
  
  if (shape?.clipPath) {
    style.clipPath = shape.clipPath;
  }
  if (shape?.borderRadius) {
    if (shape.borderRadius === '50%') {
      style.borderRadius = '50%';
    } else if (typeof shape.borderRadius === 'number') {
      style.borderRadius = `${shape.borderRadius}px`;
    }
  }
  
  return style;
}

export default function InteractiveCanvas({
  elements,
  background,
  zoom = 75,
  onChange,
  onSelectElement,
  selectedId = null,
  readOnly = false,
  showGuides = true,
  snapToGrid = false,
  gridSize = 0.25,
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Interaction state
  const [dragging, setDragging] = useState<{
    ids: string[];
    startX: number;
    startY: number;
    origPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string;
    corner: string;
    startX: number;
    startY: number;
    elementW: number;
    elementH: number;
    elementX: number;
    elementY: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Alignment guides
  const [showGuideH, setShowGuideH] = useState(false);
  const [showGuideV, setShowGuideV] = useState(false);
  
  // Pending drag (for click vs drag detection)
  const pendingDragRef = useRef<{
    ids: string[];
    startX: number;
    startY: number;
    origPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  
  // History for undo/redo
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  
  // Clipboard
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  
  // Scale factor
  const scale = zoom / 100;
  const canvasW = SLIDE_WIDTH * SCALE * scale;
  const canvasH = SLIDE_HEIGHT * SCALE * scale;
  
  // Push to history
  const pushHistory = useCallback((els: CanvasElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIdx + 1);
      newHistory.push([...els]);
      return newHistory.slice(-50);
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  }, [historyIdx]);
  
  // Update element
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    onChange(newElements);
  }, [elements, onChange]);
  
  // Handle mouse down on element
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (readOnly || editingTextId) return;
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (element?.locked) return;
    
    const isShift = e.shiftKey;
    let newSelectedIds: string[];
    
    if (isShift) {
      // Toggle selection with shift
      newSelectedIds = selectedId ? [selectedId] : [];
      if (newSelectedIds.includes(elementId)) {
        newSelectedIds = newSelectedIds.filter(id => id !== elementId);
      } else {
        newSelectedIds = [...newSelectedIds, elementId];
      }
    } else {
      // Single selection
      newSelectedIds = [elementId];
    }
    
    // Notify parent of selection
    onSelectElement?.(newSelectedIds[0] || null);
    
    // Store original positions for drag
    const origPositions: Record<string, { x: number; y: number }> = {};
    elements.forEach(el => {
      if (!el.locked) {
        origPositions[el.id] = { x: el.x, y: el.y };
      }
    });
    
    pendingDragRef.current = {
      ids: newSelectedIds,
      startX: e.clientX,
      startY: e.clientY,
      origPositions,
    };
  }, [readOnly, editingTextId, elements, selectedId, onSelectElement]);
  
  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, corner: string) => {
    if (readOnly) return;
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    
    onSelectElement?.(elementId);
    
    setResizing({
      id: elementId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      elementW: element.w,
      elementH: element.h,
      elementX: element.x,
      elementY: element.y,
    });
  }, [readOnly, elements, onSelectElement]);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (readOnly) return;
    
    // Check for drag threshold
    if (pendingDragRef.current && !dragging) {
      const dx = e.clientX - pendingDragRef.current.startX;
      const dy = e.clientY - pendingDragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setDragging(pendingDragRef.current);
        pendingDragRef.current = null;
      }
      return;
    }
    
    // Handle dragging
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / (SCALE * scale);
      const dy = (e.clientY - dragging.startY) / (SCALE * scale);
      
      const newElements = elements.map(el => {
        if (!dragging.ids.includes(el.id)) return el;
        const orig = dragging.origPositions[el.id];
        if (!orig) return el;
        
        let newX = orig.x + dx;
        let newY = orig.y + dy;
        
        // Snap to grid if enabled
        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }
        
        // Constrain to canvas
        return {
          ...el,
          x: Math.max(0, Math.min(SLIDE_WIDTH - el.w, newX)),
          y: Math.max(0, Math.min(SLIDE_HEIGHT - el.h, newY)),
        };
      });
      
      onChange(newElements);
      
      // Show alignment guides
      if (showGuides && dragging.ids.length === 1) {
        const el = newElements.find(e => e.id === dragging.ids[0]);
        if (el) {
          setShowGuideV(Math.abs(el.x + el.w / 2 - SLIDE_WIDTH / 2) < 0.2);
          setShowGuideH(Math.abs(el.y + el.h / 2 - SLIDE_HEIGHT / 2) < 0.2);
        }
      }
    }
    
    // Handle resizing
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / (SCALE * scale);
      const dy = (e.clientY - resizing.startY) / (SCALE * scale);
      
      let newW = resizing.elementW;
      let newH = resizing.elementH;
      let newX = resizing.elementX;
      let newY = resizing.elementY;
      
      if (resizing.corner.includes('e')) {
        newW = Math.max(0.5, resizing.elementW + dx);
      }
      if (resizing.corner.includes('w')) {
        newW = Math.max(0.5, resizing.elementW - dx);
        newX = resizing.elementX + dx;
      }
      if (resizing.corner.includes('s')) {
        newH = Math.max(0.5, resizing.elementH + dy);
      }
      if (resizing.corner.includes('n')) {
        newH = Math.max(0.5, resizing.elementH - dy);
        newY = resizing.elementY + dy;
      }
      
      // Snap to grid if enabled
      if (snapToGrid) {
        newW = Math.round(newW / gridSize) * gridSize;
        newH = Math.round(newH / gridSize) * gridSize;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      const newElements = elements.map(el =>
        el.id === resizing.id
          ? { ...el, w: newW, h: newH, x: newX, y: newY }
          : el
      );
      
      onChange(newElements);
    }
  }, [readOnly, dragging, resizing, elements, scale, snapToGrid, gridSize, showGuides, onChange]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    pendingDragRef.current = null;
    
    if (dragging || resizing) {
      setShowGuideH(false);
      setShowGuideV(false);
      pushHistory(elements);
    }
    
    setDragging(null);
    setResizing(null);
  }, [dragging, resizing, elements, pushHistory]);
  
  // Global mouse events
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (readOnly || editingTextId) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      
      // Escape - deselect
      if (e.key === 'Escape') {
        onSelectElement?.(null);
        setEditingTextId(null);
        return;
      }
      
      // Delete - remove selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        pushHistory(elements);
        const newElements = elements.filter(el => el.id !== selectedId);
        onChange(newElements);
        onSelectElement?.(null);
        return;
      }
      
      // Ctrl+A - select all
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        if (elements.length > 0) {
          onSelectElement?.(elements[0].id);
        }
        return;
      }
      
      // Ctrl+C - copy
      if (ctrl && e.key === 'c' && selectedId) {
        const selectedElement = elements.find(el => el.id === selectedId);
        if (selectedElement) {
          setClipboard([selectedElement]);
        }
        return;
      }
      
      // Ctrl+V - paste
      if (ctrl && e.key === 'v' && clipboard.length > 0) {
        e.preventDefault();
        const pasted = clipboard.map(el => ({
          ...el,
          id: generateElementId(),
          x: el.x + 0.3,
          y: el.y + 0.3,
        }));
        pushHistory(elements);
        onChange([...elements, ...pasted]);
        onSelectElement?.(pasted[0].id);
        return;
      }
      
      // Ctrl+D - duplicate
      if (ctrl && e.key === 'd' && selectedId) {
        e.preventDefault();
        const selectedElement = elements.find(el => el.id === selectedId);
        if (selectedElement) {
          const duplicate = {
            ...selectedElement,
            id: generateElementId(),
            x: selectedElement.x + 0.3,
            y: selectedElement.y + 0.3,
          };
          pushHistory(elements);
          onChange([...elements, duplicate]);
          onSelectElement?.(duplicate.id);
        }
        return;
      }
      
      // Ctrl+Z - undo
      if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (historyIdx > 0) {
          setHistoryIdx(prev => prev - 1);
          onChange(history[historyIdx - 1]);
        }
        return;
      }
      
      // Ctrl+Y or Ctrl+Shift+Z - redo
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        if (historyIdx < history.length - 1) {
          setHistoryIdx(prev => prev + 1);
          onChange(history[historyIdx + 1]);
        }
        return;
      }
      
      // Arrow keys - move selected
      if (selectedId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const n = e.shiftKey ? 0.5 : 0.1;
        const dx = e.key === 'ArrowLeft' ? -n : e.key === 'ArrowRight' ? n : 0;
        const dy = e.key === 'ArrowUp' ? -n : e.key === 'ArrowDown' ? n : 0;
        
        const newElements = elements.map(el =>
          el.id === selectedId
            ? { ...el, x: el.x + dx, y: el.y + dy }
            : el
        );
        onChange(newElements);
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, editingTextId, selectedId, elements, clipboard, history, historyIdx, pushHistory, onChange, onSelectElement]);
  
  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(() => {
    if (!editingTextId) {
      onSelectElement?.(null);
    }
  }, [editingTextId, onSelectElement]);
  
  // Handle double-click (edit text)
  const handleDoubleClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element?.type === 'text') {
      setEditingTextId(elementId);
    }
  }, [elements]);
  
  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!background) return { backgroundColor: '#212121' };
    
    if (background.gradient) {
      const { type, colors, angle } = background.gradient;
      const gradientStr = type === 'linear'
        ? `linear-gradient(${angle || 0}deg, ${colors.join(', ')})`
        : `radial-gradient(circle, ${colors.join(', ')})`;
      return { background: gradientStr };
    }
    
    if (background.image) {
      return {
        backgroundImage: `url(${background.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    
    return { backgroundColor: background.color || '#212121' };
  };
  
  // Render element content
  const renderElement = (el: CanvasElement) => {
    const isSelected = selectedId === el.id;
    const isEditing = editingTextId === el.id;
    
    return (
      <div
        key={el.id}
        className={`absolute ${isEditing ? 'cursor-text' : 'cursor-move'} ${isSelected ? 'ring-2 ring-[#FEC00F]' : ''}`}
        style={{
          left: el.x * SCALE * scale,
          top: el.y * SCALE * scale,
          width: el.w * SCALE * scale,
          height: el.h * SCALE * scale,
          userSelect: isEditing ? 'text' : 'none',
          opacity: el.effects?.opacity ?? 1,
        }}
        onMouseDown={e => handleMouseDown(e, el.id)}
        onDoubleClick={e => handleDoubleClick(e, el.id)}
      >
        {/* Text element */}
        {el.type === 'text' && !isEditing && (
          <div
            className="w-full h-full flex overflow-hidden"
            style={{
              color: el.style?.color || '#FFFFFF',
              fontSize: (el.style?.fontSize || 24) * (SCALE / 72) * scale,
              fontFamily: el.style?.fontFace || 'Arial',
              fontWeight: el.style?.bold ? 'bold' : 'normal',
              fontStyle: el.style?.italic ? 'italic' : 'normal',
              textAlign: el.style?.align || 'center',
              alignItems: el.style?.verticalAlign === 'top' ? 'flex-start' 
                : el.style?.verticalAlign === 'bottom' ? 'flex-end' 
                : 'center',
              justifyContent: el.style?.align === 'left' ? 'flex-start'
                : el.style?.align === 'right' ? 'flex-end'
                : 'center',
            }}
          >
            {typeof el.content === 'string' ? el.content : JSON.stringify(el.content)}
          </div>
        )}
        
        {/* Text element - editing */}
        {el.type === 'text' && isEditing && (
          <textarea
            autoFocus
            className="w-full h-full bg-transparent border-none outline-none resize-none"
            style={{
              color: el.style?.color || '#FFFFFF',
              fontSize: (el.style?.fontSize || 24) * (SCALE / 72) * scale,
              fontFamily: el.style?.fontFace || 'Arial',
              fontWeight: el.style?.bold ? 'bold' : 'normal',
              textAlign: el.style?.align || 'center',
            }}
            value={typeof el.content === 'string' ? el.content : ''}
            onChange={e => {
              e.stopPropagation();
              updateElement(el.id, { content: e.target.value });
            }}
            onBlur={() => setEditingTextId(null)}
            onClick={e => e.stopPropagation()}
          />
        )}
        
        {/* Shape element */}
        {el.type === 'shape' && (
          <div
            className="w-full h-full"
            style={getShapeStyle(
              el.options?.shape || 'rect',
              el.options?.fill || '#FEC00F',
              el.options?.stroke,
              el.options?.strokeWidth
            )}
          />
        )}
        
        {/* Image element */}
        {el.type === 'image' && (
          <img
            src={typeof el.content === 'string' ? el.content : ''}
            alt=""
            className="w-full h-full object-contain"
            style={{
              objectFit: el.options?.sizing === 'stretch' ? 'fill' : (el.options?.sizing || 'contain'),
            }}
          />
        )}
        
        {/* Chart placeholder */}
        {el.type === 'chart' && (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center rounded">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m4 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4" />
            </svg>
          </div>
        )}
        
        {/* Table placeholder */}
        {el.type === 'table' && (
          <div className="w-full h-full bg-gray-800/80 flex flex-col justify-center gap-1 p-2 rounded">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-1">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex-1 h-2 bg-gray-600 rounded-sm" />
                ))}
              </div>
            ))}
          </div>
        )}
        
        {/* Group placeholder */}
        {el.type === 'group' && (
          <div className="w-full h-full border-2 border-dashed border-gray-500 rounded flex items-center justify-center">
            <div className="w-3/4 h-3/4 border-2 border-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-lg font-bold">{JSON.parse(el.content as string || '{}').number || ''}</span>
            </div>
          </div>
        )}
        
        {/* Resize handles */}
        {isSelected && !isEditing && !el.locked && (
          <>
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(corner => {
              const pos: React.CSSProperties = {};
              if (corner.includes('n')) pos.top = '-5px';
              if (corner.includes('s')) pos.bottom = '-5px';
              if (corner.includes('w')) pos.left = '-5px';
              if (corner.includes('e')) pos.right = '-5px';
              if (corner === 'n' || corner === 's') {
                pos.left = '50%';
                pos.transform = 'translateX(-50%)';
              }
              if (corner === 'w' || corner === 'e') {
                pos.top = '50%';
                pos.transform = 'translateY(-50%)';
              }
              
              return (
                <div
                  key={corner}
                  className="absolute w-2.5 h-2.5 bg-[#FEC00F] border border-yellow-600 rounded-sm z-10"
                  style={{
                    ...pos,
                    cursor: `${corner}-resize`,
                  }}
                  onMouseDown={e => handleResizeStart(e, el.id, corner)}
                />
              );
            })}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div
      ref={canvasRef}
      className="relative shadow-2xl border border-gray-800"
      style={{
        width: canvasW,
        height: canvasH,
        ...getBackgroundStyle(),
        flexShrink: 0,
        overflow: 'hidden',
      }}
      onClick={handleCanvasClick}
    >
      {/* Center alignment guides */}
      {showGuideH && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: canvasH / 2,
            height: 1,
            backgroundColor: 'rgba(255,80,80,0.8)',
            zIndex: 100,
          }}
        />
      )}
      {showGuideV && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: canvasW / 2,
            width: 1,
            backgroundColor: 'rgba(255,80,80,0.8)',
            zIndex: 100,
          }}
        />
      )}
      
      {/* Render all elements */}
      {elements.map(renderElement)}
    </div>
  );
}