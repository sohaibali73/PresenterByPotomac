'use client';

import { memo } from 'react';

interface AlignmentToolsProps {
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onMatchSize: (dimension: 'width' | 'height' | 'both') => void;
  selectedCount: number;
  disabled?: boolean;
}

const ALIGNMENT_ICONS = {
  left: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  ),
  center: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
    </svg>
  ),
  top: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4v16M12 4v10M18 4v16" />
    </svg>
  ),
  middle: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4v16M12 7v10M18 4v16" />
    </svg>
  ),
  bottom: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4v16M12 10v10M18 4v16" />
    </svg>
  ),
};

const DISTRIBUTE_ICONS = {
  horizontal: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <rect x="3" y="8" width="4" height="8" strokeWidth={2} />
      <rect x="10" y="6" width="4" height="12" strokeWidth={2} />
      <rect x="17" y="8" width="4" height="8" strokeWidth={2} />
    </svg>
  ),
  vertical: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
      <rect x="8" y="3" width="8" height="4" strokeWidth={2} />
      <rect x="6" y="10" width="12" height="4" strokeWidth={2} />
      <rect x="8" y="17" width="8" height="4" strokeWidth={2} />
    </svg>
  ),
};

function AlignmentTools({ onAlign, onDistribute, onMatchSize, selectedCount, disabled }: AlignmentToolsProps) {
  const canAlign = selectedCount >= 1 && !disabled;
  const canDistribute = selectedCount >= 3 && !disabled;
  const canMatch = selectedCount >= 2 && !disabled;

  const buttonClass = (enabled: boolean) =>
    `p-1.5 rounded transition-colors ${
      enabled
        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
        : 'text-gray-700 cursor-not-allowed'
    }`;

  return (
    <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-lg border border-gray-800">
      {/* Horizontal Alignment */}
      <div className="flex items-center">
        <button
          onClick={() => canAlign && onAlign('left')}
          className={buttonClass(canAlign)}
          title="Align Left"
          disabled={!canAlign}
        >
          {ALIGNMENT_ICONS.left}
        </button>
        <button
          onClick={() => canAlign && onAlign('center')}
          className={buttonClass(canAlign)}
          title="Align Center"
          disabled={!canAlign}
        >
          {ALIGNMENT_ICONS.center}
        </button>
        <button
          onClick={() => canAlign && onAlign('right')}
          className={buttonClass(canAlign)}
          title="Align Right"
          disabled={!canAlign}
        >
          {ALIGNMENT_ICONS.right}
        </button>
      </div>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      {/* Vertical Alignment */}
      <div className="flex items-center">
        <button
          onClick={() => canAlign && onAlign('top')}
          className={buttonClass(canAlign)}
          title="Align Top"
          disabled={!canAlign}
        >
          {ALIGNMENT_ICONS.top}
        </button>
        <button
          onClick={() => canAlign && onAlign('middle')}
          className={buttonClass(canAlign)}
          title="Align Middle"
          disabled={!canAlign}
        >
          {ALIGNMENT_ICONS.middle}
        </button>
        <button
          onClick={() => canAlign && onAlign('bottom')}
          className={buttonClass(canAlign)}
          title="Align Bottom"
          disabled={!canAlign}
        >
          {ALIGNMENT_ICONS.bottom}
        </button>
      </div>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      {/* Distribute */}
      <div className="flex items-center">
        <button
          onClick={() => canDistribute && onDistribute('horizontal')}
          className={buttonClass(canDistribute)}
          title="Distribute Horizontally (3+ elements)"
          disabled={!canDistribute}
        >
          {DISTRIBUTE_ICONS.horizontal}
        </button>
        <button
          onClick={() => canDistribute && onDistribute('vertical')}
          className={buttonClass(canDistribute)}
          title="Distribute Vertically (3+ elements)"
          disabled={!canDistribute}
        >
          {DISTRIBUTE_ICONS.vertical}
        </button>
      </div>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      {/* Match Size */}
      <div className="flex items-center">
        <button
          onClick={() => canMatch && onMatchSize('width')}
          className={buttonClass(canMatch)}
          title="Match Width (2+ elements)"
          disabled={!canMatch}
        >
          <span className="text-[10px] font-bold">W</span>
        </button>
        <button
          onClick={() => canMatch && onMatchSize('height')}
          className={buttonClass(canMatch)}
          title="Match Height (2+ elements)"
          disabled={!canMatch}
        >
          <span className="text-[10px] font-bold">H</span>
        </button>
        <button
          onClick={() => canMatch && onMatchSize('both')}
          className={buttonClass(canMatch)}
          title="Match Both (2+ elements)"
          disabled={!canMatch}
        >
          <span className="text-[10px] font-bold">⬜</span>
        </button>
      </div>

      {/* Selected count indicator */}
      {selectedCount > 0 && (
        <>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <span className="text-[10px] text-gray-500 px-1">
            {selectedCount} selected
          </span>
        </>
      )}
    </div>
  );
}

export default memo(AlignmentTools);

// Helper functions for alignment operations
export function alignElements(
  elements: { id: string; x: number; y: number; w: number; h: number }[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): { id: string; x: number; y: number }[] {
  if (elements.length < 2) return elements.map(el => ({ id: el.id, x: el.x, y: el.y }));

  const minMax = {
    minX: Math.min(...elements.map(e => e.x)),
    maxX: Math.max(...elements.map(e => e.x + e.w)),
    minY: Math.min(...elements.map(e => e.y)),
    maxY: Math.max(...elements.map(e => e.y + e.h)),
    totalWidth: Math.max(...elements.map(e => e.x + e.w)) - Math.min(...elements.map(e => e.x)),
    totalHeight: Math.max(...elements.map(e => e.y + e.h)) - Math.min(...elements.map(e => e.y)),
  };

  const centerX = minMax.minX + (minMax.maxX - minMax.minX) / 2;
  const centerY = minMax.minY + (minMax.maxY - minMax.minY) / 2;

  return elements.map(el => {
    let newX = el.x;
    let newY = el.y;

    switch (alignment) {
      case 'left':
        newX = minMax.minX;
        break;
      case 'center':
        newX = centerX - el.w / 2;
        break;
      case 'right':
        newX = minMax.maxX - el.w;
        break;
      case 'top':
        newY = minMax.minY;
        break;
      case 'middle':
        newY = centerY - el.h / 2;
        break;
      case 'bottom':
        newY = minMax.maxY - el.h;
        break;
    }

    return { id: el.id, x: newX, y: newY };
  });
}

export function distributeElements(
  elements: { id: string; x: number; y: number; w: number; h: number }[],
  direction: 'horizontal' | 'vertical'
): { id: string; x: number; y: number }[] {
  if (elements.length < 3) return elements.map(el => ({ id: el.id, x: el.x, y: el.y }));

  const sorted = [...elements].sort((a, b) =>
    direction === 'horizontal' ? a.x - b.x : a.y - b.y
  );

  if (direction === 'horizontal') {
    const totalWidth = sorted.reduce((sum, el) => sum + el.w, 0);
    const minX = Math.min(...elements.map(e => e.x));
    const maxX = Math.max(...elements.map(e => e.x + e.w));
    const availableSpace = maxX - minX - totalWidth;
    const gap = availableSpace / (elements.length - 1);

    let currentX = minX;
    return sorted.map(el => {
      const result = { id: el.id, x: currentX, y: el.y };
      currentX += el.w + gap;
      return result;
    });
  } else {
    const totalHeight = sorted.reduce((sum, el) => sum + el.h, 0);
    const minY = Math.min(...elements.map(e => e.y));
    const maxY = Math.max(...elements.map(e => e.y + e.h));
    const availableSpace = maxY - minY - totalHeight;
    const gap = availableSpace / (elements.length - 1);

    let currentY = minY;
    return sorted.map(el => {
      const result = { id: el.id, x: el.x, y: currentY };
      currentY += el.h + gap;
      return result;
    });
  }
}

export function matchSize(
  elements: { id: string; w: number; h: number }[],
  dimension: 'width' | 'height' | 'both',
  targetElement: { w: number; h: number }
): { id: string; w: number; h: number }[] {
  return elements.map(el => ({
    id: el.id,
    w: dimension === 'height' ? el.w : targetElement.w,
    h: dimension === 'width' ? el.h : targetElement.h,
  }));
}