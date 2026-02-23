'use client';

import { useState, useCallback, useRef, useReducer } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

type HistoryAction<T> =
  | { type: 'SET'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR'; payload: T }
  | { type: 'PUSH'; payload: T };

const MAX_HISTORY_SIZE = 50;

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'SET':
      return {
        past: [],
        present: action.payload,
        future: [],
      };

    case 'PUSH': {
      // Don't push if nothing changed
      if (JSON.stringify(state.present) === JSON.stringify(action.payload)) {
        return state;
      }
      
      const newPast = [...state.past, state.present].slice(-MAX_HISTORY_SIZE);
      return {
        past: newPast,
        present: action.payload,
        future: [], // Clear future on new action
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }

    case 'CLEAR':
      return {
        past: [],
        present: action.payload,
        future: [],
      };

    default:
      return state;
  }
}

export interface UseUndoRedoOptions {
  maxHistorySize?: number;
}

export interface UseUndoRedoReturn<T> {
  state: T;
  setState: (value: T) => void;
  pushState: (value: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  futureSize: number;
  clear: (value: T) => void;
  reset: (value: T) => void;
}

/**
 * Hook for managing state with undo/redo functionality
 */
export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn<T> {
  const [history, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: initialState,
    future: [],
  });

  // Set state and clear history (for loading new data)
  const setState = useCallback((value: T) => {
    dispatch({ type: 'SET', payload: value });
  }, []);

  // Push a new state (adds to history)
  const pushState = useCallback((value: T) => {
    dispatch({ type: 'PUSH', payload: value });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const clear = useCallback((value: T) => {
    dispatch({ type: 'CLEAR', payload: value });
  }, []);

  const reset = useCallback((value: T) => {
    dispatch({ type: 'SET', payload: value });
  }, []);

  return {
    state: history.present,
    setState,
    pushState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length,
    futureSize: history.future.length,
    clear,
    reset,
  };
}

/**
 * Alternative implementation using useRef for simpler use cases
 */
export function useUndoRedoRef<T>(
  initialState: T
): {
  value: T;
  setValue: (value: T, addToHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: T[];
  future: T[];
} {
  const [value, setValueState] = useState<T>(initialState);
  const historyRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const lastValueRef = useRef<string>(JSON.stringify(initialState));

  const setValue = useCallback((newValue: T, addToHistory: boolean = true) => {
    const newValueStr = JSON.stringify(newValue);
    
    if (addToHistory && lastValueRef.current !== newValueStr) {
      // Push current value to history before changing
      historyRef.current.push(JSON.parse(lastValueRef.current));
      // Limit history size
      if (historyRef.current.length > MAX_HISTORY_SIZE) {
        historyRef.current.shift();
      }
      // Clear future on new action
      futureRef.current = [];
    }
    
    lastValueRef.current = newValueStr;
    setValueState(newValue);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    
    // Save current state to future
    futureRef.current.unshift(JSON.parse(lastValueRef.current));
    
    // Pop from history
    const previousValue = historyRef.current.pop()!;
    lastValueRef.current = JSON.stringify(previousValue);
    setValueState(previousValue);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    
    // Save current state to history
    historyRef.current.push(JSON.parse(lastValueRef.current));
    
    // Pop from future
    const nextValue = futureRef.current.shift()!;
    lastValueRef.current = JSON.stringify(nextValue);
    setValueState(nextValue);
  }, []);

  return {
    value,
    setValue,
    undo,
    redo,
    canUndo: historyRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    history: historyRef.current,
    future: futureRef.current,
  };
}

export default useUndoRedo;