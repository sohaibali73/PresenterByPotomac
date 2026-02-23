'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutDefinition[],
  enabled: boolean = true
) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape and certain function keys even in inputs
      if (e.key !== 'Escape' && !e.key.startsWith('F')) {
        return;
      }
    }

    for (const shortcut of shortcutsRef.current) {
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Default shortcuts for the presentation editor
 */
export function getEditorShortcuts(actions: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  onDeleteSlide?: () => void;
  onDuplicateSlide?: () => void;
  onAddSlide?: () => void;
  onPresent?: () => void;
  onExport?: () => void;
  onHelp?: () => void;
}): ShortcutDefinition[] {
  const shortcuts: ShortcutDefinition[] = [];

  if (actions.onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      description: 'Save presentation',
      action: actions.onSave,
    });
  }

  if (actions.onUndo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      description: 'Undo',
      action: actions.onUndo,
    });
  }

  if (actions.onRedo) {
    shortcuts.push({
      key: 'y',
      ctrl: true,
      description: 'Redo',
      action: actions.onRedo,
    });
    shortcuts.push({
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo (alternate)',
      action: actions.onRedo,
    });
  }

  if (actions.onPrevSlide) {
    shortcuts.push({
      key: 'ArrowLeft',
      description: 'Previous slide',
      action: actions.onPrevSlide,
    });
  }

  if (actions.onNextSlide) {
    shortcuts.push({
      key: 'ArrowRight',
      description: 'Next slide',
      action: actions.onNextSlide,
    });
  }

  if (actions.onDeleteSlide) {
    shortcuts.push({
      key: 'Delete',
      description: 'Delete slide',
      action: actions.onDeleteSlide,
    });
    shortcuts.push({
      key: 'Backspace',
      description: 'Delete slide (alternate)',
      action: actions.onDeleteSlide,
    });
  }

  if (actions.onDuplicateSlide) {
    shortcuts.push({
      key: 'd',
      ctrl: true,
      description: 'Duplicate slide',
      action: actions.onDuplicateSlide,
    });
  }

  if (actions.onAddSlide) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      description: 'Add new slide',
      action: actions.onAddSlide,
    });
  }

  if (actions.onPresent) {
    shortcuts.push({
      key: 'F5',
      description: 'Start presentation',
      action: actions.onPresent,
    });
  }

  if (actions.onExport) {
    shortcuts.push({
      key: 'e',
      ctrl: true,
      description: 'Export presentation',
      action: actions.onExport,
    });
  }

  if (actions.onHelp) {
    shortcuts.push({
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      action: actions.onHelp,
    });
    shortcuts.push({
      key: '/',
      ctrl: true,
      description: 'Show keyboard shortcuts',
      action: actions.onHelp,
    });
  }

  return shortcuts;
}

/**
 * Hook for detecting specific key combinations
 */
export function useKeyPress(targetKey: string, ctrl: boolean = false): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  const downHandler = useCallback(
    (e: KeyboardEvent) => {
      const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : true;
      if (e.key === targetKey && ctrlMatch) {
        setKeyPressed(true);
      }
    },
    [targetKey, ctrl]
  );

  const upHandler = useCallback(
    (e: KeyboardEvent) => {
      const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : true;
      if (e.key === targetKey && ctrlMatch) {
        setKeyPressed(false);
      }
    },
    [targetKey, ctrl]
  );

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [downHandler, upHandler]);

  return keyPressed;
}

// Need to import useState for useKeyPress
import { useState } from 'react';

export default useKeyboardShortcuts;