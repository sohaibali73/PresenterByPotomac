'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const DB_NAME = 'potomac-presenter';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

export interface DraftData {
  id: string;
  type: 'presentation' | 'editor';
  data: any;
  timestamp: number;
  title?: string;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save a draft to IndexedDB
 */
export async function saveDraft(draft: DraftData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(draft);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    tx.oncomplete = () => db.close();
  });
}

/**
 * Get a draft from IndexedDB
 */
export async function getDraft(id: string): Promise<DraftData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
    
    tx.oncomplete = () => db.close();
  });
}

/**
 * Get all drafts of a specific type
 */
export async function getDraftsByType(type: string): Promise<DraftData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
    
    tx.oncomplete = () => db.close();
  });
}

/**
 * Get all drafts
 */
export async function getAllDrafts(): Promise<DraftData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
    
    tx.oncomplete = () => db.close();
  });
}

/**
 * Delete a draft
 */
export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    tx.oncomplete = () => db.close();
  });
}

/**
 * Clear all drafts
 */
export async function clearAllDrafts(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    tx.oncomplete = () => db.close();
  });
}

export interface AutoSaveOptions {
  interval?: number; // Auto-save interval in milliseconds (default: 30000)
  key: string; // Unique key for this data
  type: 'presentation' | 'editor';
  title?: string;
  enabled?: boolean;
  onSave?: () => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  error: Error | null;
  hasUnsavedChanges: boolean;
}

/**
 * Hook for auto-saving data to IndexedDB
 */
export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions
): {
  state: AutoSaveState;
  save: () => Promise<void>;
  markDirty: () => void;
  markClean: () => void;
  recoverDraft: () => Promise<T | null>;
} {
  const {
    interval = 30000,
    key,
    type,
    title,
    enabled = true,
    onSave,
    onError,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    error: null,
    hasUnsavedChanges: false,
  });

  const dataRef = useRef(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
    
    // Check if data has changed
    const dataStr = JSON.stringify(data);
    if (lastSavedDataRef.current && dataStr !== lastSavedDataRef.current) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, [data]);

  // Save function
  const save = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const draft: DraftData = {
        id: key,
        type,
        data: dataRef.current,
        timestamp: Date.now(),
        title,
      };

      await saveDraft(draft);
      lastSavedDataRef.current = JSON.stringify(dataRef.current);

      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
      }));

      onSave?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Auto-save failed');
      setState(prev => ({ ...prev, isSaving: false, error: err }));
      onError?.(err);
    }
  }, [enabled, key, type, title, onSave, onError]);

  // Mark as dirty (has unsaved changes)
  const markDirty = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, []);

  // Mark as clean (no unsaved changes)
  const markClean = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: false }));
  }, []);

  // Recover draft from IndexedDB
  const recoverDraft = useCallback(async (): Promise<T | null> => {
    try {
      const draft = await getDraft(key);
      if (draft && draft.data) {
        lastSavedDataRef.current = JSON.stringify(draft.data);
        setState(prev => ({
          ...prev,
          lastSaved: new Date(draft.timestamp),
          hasUnsavedChanges: false,
        }));
        return draft.data as T;
      }
      return null;
    } catch (error) {
      console.error('Failed to recover draft:', error);
      return null;
    }
  }, [key]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const tick = () => {
      if (state.hasUnsavedChanges) {
        save();
      }
      saveTimeoutRef.current = setTimeout(tick, interval);
    };

    saveTimeoutRef.current = setTimeout(tick, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, interval, state.hasUnsavedChanges, save]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        // Attempt to save synchronously (not guaranteed)
        save();
        
        // Show warning
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, state.hasUnsavedChanges, save]);

  return {
    state,
    save,
    markDirty,
    markClean,
    recoverDraft,
  };
}

/**
 * Hook for checking if there's a recoverable draft
 */
export function useRecoverableDraft(key: string): {
  draft: DraftData | null;
  loading: boolean;
  check: () => Promise<void>;
  dismiss: () => Promise<void>;
} {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const found = await getDraft(key);
      setDraft(found);
    } catch (error) {
      console.error('Failed to check for draft:', error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const dismiss = useCallback(async () => {
    try {
      await deleteDraft(key);
      setDraft(null);
    } catch (error) {
      console.error('Failed to dismiss draft:', error);
    }
  }, [key]);

  // Check on mount
  useEffect(() => {
    check();
  }, [check]);

  return { draft, loading, check, dismiss };
}

export default useAutoSave;