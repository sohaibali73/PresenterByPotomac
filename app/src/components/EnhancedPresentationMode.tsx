'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Slide {
  layout: string;
  title?: string;
  section_title?: string;
  [key: string]: any;
}

interface PresentationNotes {
  [slideIndex: number]: string;
}

interface EnhancedPresentationModeProps {
  slides: Slide[];
  theme?: string;
  initialSlide?: number;
  onClose: () => void;
  onSlideChange?: (index: number) => void;
}

export default function EnhancedPresentationMode({
  slides,
  theme = 'classic',
  initialSlide = 0,
  onClose,
  onSlideChange,
}: EnhancedPresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [showNotes, setShowNotes] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState<PresentationNotes>({});
  const [isBlank, setIsBlank] = useState(false);
  const [annotations, setAnnotations] = useState<{ x: number; y: number; color: string }[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [laserPosition, setLaserPosition] = useState<{ x: number; y: number } | null>(null);
  const [showControls, setShowControls] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          goToNext();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          goToPrev();
          break;
        case 'Home':
          goToSlide(0);
          break;
        case 'End':
          goToSlide(slides.length - 1);
          break;
        case 'Escape':
          onClose();
          break;
        case 'b':
        case 'B':
          setIsBlank(prev => !prev);
          break;
        case 'n':
        case 'N':
          setShowNotes(prev => !prev);
          break;
        case 't':
        case 'T':
          setShowTimer(prev => !prev);
          break;
        case 'l':
        case 'L':
          setIsAnnotating(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, currentSlide]);

  const goToSlide = useCallback((index: number) => {
    const newIndex = Math.max(0, Math.min(index, slides.length - 1));
    setCurrentSlide(newIndex);
    setAnnotations([]);
    onSlideChange?.(newIndex);
  }, [slides.length, onSlideChange]);

  const goToNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, slides.length, goToSlide]);

  const goToPrev = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isAnnotating && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setAnnotations(prev => [...prev, { x, y, color: '#FEC00F' }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isAnnotating && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setLaserPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseLeave = () => {
    setLaserPosition(null);
  };

  const clearAnnotations = () => setAnnotations([]);

  const currentNote = notes[currentSlide] || '';

  // Blank screen
  if (isBlank) {
    return (
      <div 
        className="fixed inset-0 bg-black z-[200] cursor-pointer"
        onClick={() => setIsBlank(false)}
      >
        <div className="absolute top-4 right-4 text-gray-600 text-sm">
          Press B or click to resume
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex">
      {/* Main Slide Area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div 
          className={`flex items-center justify-between px-4 py-2 bg-black/50 transition-opacity ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">
              {currentSlide + 1} / {slides.length}
            </span>
            <span className="text-gray-400">
              {slides[currentSlide]?.title || slides[currentSlide]?.section_title || 'Slide'}
            </span>
          </div>
          
          {showTimer && (
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-mono ${elapsed > 600 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(elapsed)}
              </span>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-3 py-1 bg-gray-800 text-white rounded text-sm"
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => { setElapsed(0); setIsRunning(false); }}
                className="px-3 py-1 bg-gray-800 text-white rounded text-sm"
              >
                Reset
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotes(!showNotes)} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">
              {showNotes ? 'Hide Notes' : 'Show Notes'}
            </button>
            <button onClick={() => setIsBlank(true)} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">
              Blank
            </button>
            <button onClick={onClose} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
              Exit
            </button>
          </div>
        </div>

        {/* Slide canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 flex items-center justify-center p-8 relative cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Slide preview */}
          <div className="w-full h-full max-w-[1280px] max-h-[720px] bg-gray-900 rounded-lg overflow-hidden relative">
            {/* This would render the actual slide content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">
                  {slides[currentSlide]?.title || slides[currentSlide]?.section_title || 'Slide Title'}
                </h2>
                <p className="text-gray-400">{slides[currentSlide]?.layout}</p>
              </div>
            </div>
            
            {/* Annotations */}
            <svg className="absolute inset-0 pointer-events-none">
              {annotations.map((point, i) => (
                <circle key={i} cx={point.x} cy={point.y} r="8" fill={point.color} />
              ))}
            </svg>
            
            {/* Laser pointer */}
            {laserPosition && !isAnnotating && (
              <div 
                className="absolute w-4 h-4 rounded-full bg-red-500 pointer-events-none"
                style={{ 
                  left: laserPosition.x - 8, 
                  top: laserPosition.y - 8,
                  boxShadow: '0 0 20px rgba(255,0,0,0.8)'
                }}
              />
            )}
          </div>
          
          {/* Navigation arrows */}
          <button
            onClick={goToPrev}
            disabled={currentSlide === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 text-white rounded-full disabled:opacity-30"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            disabled={currentSlide === slides.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 text-white rounded-full disabled:opacity-30"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-center gap-4 px-4 py-2 bg-black/50">
          <button
            onClick={goToPrev}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-30"
          >
            Previous
          </button>
          
          {/* Slide thumbnails */}
          <div className="flex gap-1">
            {slides.slice(Math.max(0, currentSlide - 2), currentSlide + 3).map((s, i) => {
              const actualIndex = Math.max(0, currentSlide - 2) + i;
              return (
                <button
                  key={actualIndex}
                  onClick={() => goToSlide(actualIndex)}
                  className={`w-16 h-10 rounded ${
                    actualIndex === currentSlide ? 'ring-2 ring-yellow-500' : ''
                  } bg-gray-800 flex items-center justify-center text-xs text-white`}
                >
                  {actualIndex + 1}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={goToNext}
            disabled={currentSlide === slides.length - 1}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-30"
          >
            Next
          </button>
          
          {isAnnotating && (
            <button onClick={clearAnnotations} className="px-4 py-2 bg-red-600 text-white rounded">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold">Speaker Notes</h3>
            <p className="text-gray-400 text-sm">Slide {currentSlide + 1}</p>
          </div>
          <div className="flex-1 p-4">
            <textarea
              value={currentNote}
              onChange={(e) => setNotes(prev => ({ ...prev, [currentSlide]: e.target.value }))}
              placeholder="Add notes for this slide..."
              className="w-full h-full bg-gray-800 text-white rounded p-3 resize-none focus:outline-none focus:ring-2 ring-yellow-500"
            />
          </div>
          <div className="px-4 py-3 border-t border-gray-800 text-gray-400 text-xs">
            <p>Keyboard shortcuts:</p>
            <p>← → Navigate | B Blank | N Notes</p>
            <p>T Timer | L Annotate | ESC Exit</p>
          </div>
        </div>
      )}
    </div>
  );
}