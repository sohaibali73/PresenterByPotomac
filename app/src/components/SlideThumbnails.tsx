'use client';

import { memo, useMemo } from 'react';

interface Slide {
  layout: string;
  title?: string;
  section_title?: string;
  headline?: string;
  chart_title?: string;
  [key: string]: any;
}

interface SlideThumbnailsProps {
  slides: Slide[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  zoom?: number;
}

const LAYOUT_COLORS: Record<string, string> = {
  cover: '#FEC00F',
  section_divider: '#4CAF50',
  three_pillars: '#2196F3',
  chart: '#FF6B35',
  composite_three: '#9C27B0',
  composite_four: '#9C27B0',
  five_component_diagram: '#00BCD4',
  strategy_table: '#607D8B',
  risk_statistics: '#795548',
  use_cases: '#E91E63',
  thank_you: '#FEC00F',
  disclosures: '#9E9E9E',
  definitions: '#9E9E9E',
};

function SlideThumbnails({ slides, selectedIndex, onSelect, onReorder, zoom = 0.15 }: SlideThumbnailsProps) {
  // Generate thumbnail preview SVG
  const getThumbnailPreview = (slide: Slide, index: number) => {
    const color = LAYOUT_COLORS[slide.layout] || '#FEC00F';
    const bgColor = '#1a1a1a';
    const title = slide.title || slide.section_title || slide.headline || slide.chart_title || `Slide ${index + 1}`;
    
    return (
      <div className="w-full h-full relative">
        {/* Background */}
        <div className="absolute inset-0 bg-[#1a1a1a] rounded-t" />
        
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t" style={{ backgroundColor: color }} />
        
        {/* Layout indicator */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <span className="text-[6px] text-gray-400 truncate px-1">
            {slide.layout.replace(/_/g, ' ')}
          </span>
        </div>
        
        {/* Title preview */}
        <div className="absolute top-2 left-1 right-1">
          <div className="h-1.5 bg-gray-700 rounded w-3/4" />
        </div>
        <div className="absolute top-4.5 left-1 right-1">
          <div className="h-1 bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    );
  };

  // Drag and drop state
  let draggedIndex: number | null = null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index && onReorder) {
      onReorder(draggedIndex, index);
    }
    draggedIndex = null;
  };

  return (
    <div className="flex gap-2 p-3 overflow-x-auto bg-[#0d0d0d] border-t border-gray-800">
      {slides.map((slide, index) => {
        const isSelected = index === selectedIndex;
        const color = LAYOUT_COLORS[slide.layout] || '#FEC00F';
        
        return (
          <div
            key={index}
            draggable={!!onReorder}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onSelect(index)}
            className={`relative flex-shrink-0 cursor-pointer transition-all ${
              isSelected 
                ? 'ring-2 ring-offset-1 ring-offset-[#0d0d0d]' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              width: 80,
              height: 52,
              ringColor: isSelected ? color : undefined,
            }}
          >
            {/* Slide number badge */}
            <div 
              className="absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold z-10"
              style={{ 
                backgroundColor: isSelected ? color : '#333',
                color: isSelected ? '#000' : '#888',
              }}
            >
              {index + 1}
            </div>
            
            {/* Thumbnail card */}
            <div 
              className={`w-full h-full rounded overflow-hidden border ${
                isSelected ? 'border-[#FEC00F]' : 'border-gray-800 hover:border-gray-600'
              }`}
            >
              {getThumbnailPreview(slide, index)}
            </div>
            
            {/* Selected indicator */}
            {isSelected && (
              <div 
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 
                  border-l-[4px] border-r-[4px] border-t-[4px]
                  border-l-transparent border-r-transparent"
                style={{ borderTopColor: color }}
              />
            )}
          </div>
        );
      })}
      
      {/* Add slide placeholder */}
      {slides.length < 50 && (
        <div
          className="flex-shrink-0 w-[80px] h-[52px] rounded border border-dashed border-gray-700 
            flex items-center justify-center cursor-pointer hover:border-[#FEC00F] hover:bg-[#FEC00F]/5 transition-all"
          title="Add slide"
        >
          <span className="text-gray-500 text-lg">+</span>
        </div>
      )}
    </div>
  );
}

export default memo(SlideThumbnails);

// Slide count badge component
export function SlideCountBadge({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded text-[10px]">
      <span className="text-[#FEC00F] font-bold">{count}</span>
      <span className="text-gray-500">/</span>
      <span className="text-gray-400">{total}</span>
    </div>
  );
}

// Slide navigation arrows
export function SlideNavArrows({ 
  currentIndex, 
  total, 
  onPrev, 
  onNext 
}: { 
  currentIndex: number; 
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="p-1.5 rounded bg-[#1a1a1a] hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Previous slide"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={onNext}
        disabled={currentIndex === total - 1}
        className="p-1.5 rounded bg-[#1a1a1a] hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Next slide"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}