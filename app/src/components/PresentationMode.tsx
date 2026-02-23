'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PresentationModeProps {
  slides: any[];
  theme: string;
  slideComponent: (props: { slide: any; theme: string; scale?: number }) => React.ReactNode;
  onClose: () => void;
  startSlide?: number;
}

export default function PresentationMode({
  slides,
  theme,
  slideComponent,
  onClose,
  startSlide = 0,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(startSlide);
  const [showControls, setShowControls] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [laserMode, setLaserMode] = useState(false);
  const [laserPosition, setLaserPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Total slides
  const totalSlides = slides.length;

  // Navigation functions
  const goNext = useCallback(() => {
    setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, totalSlides - 1)));
  }, [totalSlides]);

  const goFirst = useCallback(() => setCurrentSlide(0), []);
  const goLast = useCallback(() => setCurrentSlide(totalSlides - 1), [totalSlides]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'Space':
      case 'Enter':
        e.preventDefault();
        goNext();
        break;
      case 'ArrowLeft':
      case 'Backspace':
        e.preventDefault();
        goPrev();
        break;
      case 'Home':
        e.preventDefault();
        goFirst();
        break;
      case 'End':
        e.preventDefault();
        goLast();
        break;
      case 'Escape':
      case 'q':
        e.preventDefault();
        onClose();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'n':
        e.preventDefault();
        setShowNotes(prev => !prev);
        break;
      case 'l':
        e.preventDefault();
        setLaserMode(prev => !prev);
        break;
      case 'g':
        e.preventDefault();
        // Go to slide prompt
        const slideNum = prompt(`Go to slide (1-${totalSlides}):`);
        if (slideNum) {
          const num = parseInt(slideNum, 10);
          if (!isNaN(num) && num >= 1 && num <= totalSlides) {
            goToSlide(num - 1);
          }
        }
        break;
    }
  }, [goNext, goPrev, goFirst, goLast, onClose, totalSlides, goToSlide]);

  // Mouse movement for controls visibility
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setShowControls(true);
    
    // Reset hide timer
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (!laserMode) {
        setShowControls(false);
      }
    }, 3000);

    // Laser pointer
    if (laserMode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLaserPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, [laserMode]);

  // Setup keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  // Enter fullscreen on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onClose]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen();
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[200] flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !laserMode && setShowControls(false)}
    >
      {/* Slide Container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Render slide */}
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ fontSize: '16px' }}
        >
          {slideComponent({ slide: currentSlideData, theme })}
        </div>

        {/* Laser pointer */}
        {laserMode && (
          <div
            className="absolute w-6 h-6 pointer-events-none z-10"
            style={{
              left: laserPosition.x - 12,
              top: laserPosition.y - 12,
            }}
          >
            <div className="w-full h-full rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse" />
          </div>
        )}

        {/* Navigation arrows overlay */}
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-all opacity-0 hover:opacity-100"
          style={{ opacity: showControls ? 0.7 : 0 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-all"
          style={{ opacity: showControls ? 0.7 : 0 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom Controls */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Left: Slide counter */}
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm font-mono">
              {currentSlide + 1} / {totalSlides}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalSlides, 20) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentSlide ? 'bg-[#FEC00F]' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
              {totalSlides > 20 && (
                <span className="text-white/30 text-xs ml-1">...</span>
              )}
            </div>
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goFirst}
              disabled={currentSlide === 0}
              className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              title="First slide (Home)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goPrev}
              disabled={currentSlide === 0}
              className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              title="Previous (←)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              disabled={currentSlide === totalSlides - 1}
              className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              title="Next (→ or Space)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={goLast}
              disabled={currentSlide === totalSlides - 1}
              className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              title="Last slide (End)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right: Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLaserMode(prev => !prev)}
              className={`p-2 rounded transition-colors ${
                laserMode ? 'bg-red-500 text-white' : 'text-white/60 hover:text-white'
              }`}
              title="Laser pointer (L)"
            >
              🔴
            </button>
            <button
              onClick={() => setShowNotes(prev => !prev)}
              className={`p-2 rounded transition-colors ${
                showNotes ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
              }`}
              title="Show notes (N)"
            >
              📝
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Fullscreen (F)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Exit (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Slide thumbnails */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 max-w-4xl mx-auto scrollbar-hide">
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`shrink-0 w-20 h-12 rounded border-2 transition-all ${
                i === currentSlide
                  ? 'border-[#FEC00F] ring-2 ring-[#FEC00F]/30'
                  : 'border-white/20 hover:border-white/40'
              }`}
              style={{ fontSize: '2px' }}
            >
              {slideComponent({ slide, theme })}
            </button>
          ))}
        </div>
      </div>

      {/* Notes panel (if enabled) */}
      {showNotes && currentSlideData?.notes && (
        <div className="absolute bottom-20 left-4 right-4 bg-black/80 rounded-lg p-4 max-h-40 overflow-y-auto">
          <h4 className="text-xs text-[#FEC00F] font-semibold mb-2">SPEAKER NOTES</h4>
          <p className="text-sm text-white/80">{currentSlideData.notes}</p>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div
        className="absolute top-4 right-4 text-white/40 text-xs space-y-1 transition-opacity"
        style={{ opacity: showControls ? 0.5 : 0 }}
      >
        <div>←/→: Navigate</div>
        <div>Space: Next</div>
        <div>L: Laser</div>
        <div>N: Notes</div>
        <div>Esc: Exit</div>
      </div>
    </div>
  );
}