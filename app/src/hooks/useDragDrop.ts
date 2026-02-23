'use client';

import { useState, useCallback, useRef } from 'react';

export interface DragDropState {
  isDragging: boolean;
  dragIndex: number | null;
  dropIndex: number | null;
  dragOverIndex: number | null;
}

export interface DragDropOptions<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  getId?: (item: T) => string | number;
}

/**
 * Hook for managing drag and drop reordering
 */
export function useDragDropReorder<T>({
  items,
  onReorder,
  getId,
}: DragDropOptions<T>) {
  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
    dragOverIndex: null,
  });

  const dragNodeRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    setState({
      isDragging: true,
      dragIndex: index,
      dropIndex: null,
      dragOverIndex: null,
    });

    // Set drag image
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setState({
      isDragging: false,
      dragIndex: null,
      dropIndex: null,
      dragOverIndex: null,
    });
  }, []);

  const handleDragOver = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';

    setState(prev => {
      if (prev.dragOverIndex !== index) {
        return { ...prev, dragOverIndex: index };
      }
      return prev;
    });
  }, []);

  const handleDragLeave = useCallback(() => {
    setState(prev => ({ ...prev, dragOverIndex: null }));
  }, []);

  const handleDrop = useCallback((dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();

    const dragIndex = state.dragIndex;
    if (dragIndex === null || dragIndex === dropIndex) {
      setState({
        isDragging: false,
        dragIndex: null,
        dropIndex: null,
        dragOverIndex: null,
      });
      return;
    }

    // Reorder the items
    const newItems = [...items];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    onReorder(newItems);

    setState({
      isDragging: false,
      dragIndex: null,
      dropIndex: dropIndex,
      dragOverIndex: null,
    });
  }, [items, onReorder, state.dragIndex]);

  return {
    state,
    handlers: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    getDragProps: (index: number) => ({
      draggable: true,
      onDragStart: handleDragStart(index),
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver(index),
      onDragLeave: handleDragLeave,
      onDrop: handleDrop(index),
      'data-dragging': state.dragIndex === index,
      'data-drag-over': state.dragOverIndex === index,
    }),
  };
}

/**
 * Hook for file drop zones
 */
export function useFileDrop(
  onFilesDropped: (files: File[]) => void,
  options: {
    accept?: string[];
    multiple?: boolean;
    disabled?: boolean;
  } = {}
) {
  const { accept, multiple = true, disabled = false } = options;
  const [isOver, setIsOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsOver(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    
    // Filter by accepted types if specified
    const filteredFiles = accept
      ? files.filter(file => 
          accept.some(type => 
            file.type.startsWith(type) || 
            file.name.endsWith(type.replace('*', ''))
          )
        )
      : files;

    if (filteredFiles.length > 0) {
      onFilesDropped(multiple ? filteredFiles : [filteredFiles[0]]);
    }
  }, [disabled, accept, multiple, onFilesDropped]);

  return {
    isOver,
    dropProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}

export default useDragDropReorder;