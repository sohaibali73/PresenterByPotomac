'use client';

import { useState, useRef, useCallback } from 'react';

interface BatchItem {
  id: string;
  name: string;
  strategy: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: {
    pptx_base64: string;
    filename: string;
    slide_count: number;
  };
}

interface BatchGeneratorProps {
  onComplete?: (results: BatchItem[]) => void;
}

export default function BatchGenerator({ onComplete }: BatchGeneratorProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV data
  const parseCSV = (csvText: string): Partial<BatchItem>[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const items: Partial<BatchItem>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const item: Partial<BatchItem> = {
        id: `batch_${i}`,
        status: 'pending',
        progress: 0,
      };

      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        switch (header) {
          case 'name':
          case 'title':
            item.name = value;
            break;
          case 'strategy':
          case 'strategy_name':
            item.strategy = value;
            break;
        }
      });

      if (item.name || item.strategy) {
        items.push(item);
      }
    }

    return items;
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const text = await file.text();
    const parsed = parseCSV(text);

    setItems(prev => [...prev, ...parsed.map(p => ({
      id: p.id || `batch_${Date.now()}_${Math.random()}`,
      name: p.name || 'Untitled',
      strategy: p.strategy || '',
      status: 'pending' as const,
      progress: 0,
    }))]);
  };

  // Add single item
  const addItem = () => {
    setItems(prev => [...prev, {
      id: `batch_${Date.now()}`,
      name: '',
      strategy: '',
      status: 'pending',
      progress: 0,
    }]);
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Update item
  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Start batch generation
  const startBatch = async () => {
    if (items.length === 0 || isRunning) return;

    setIsRunning(true);
    const completedItems: BatchItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setCurrentIndex(i);

      // Update status to generating
      updateItem(item.id, { status: 'generating', progress: 0 });

      try {
        // Call the generation API
        const res = await fetch('/api/generate-from-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: item.strategy || item.name,
            strategyName: item.strategy,
            title: item.name,
          }),
        });

        updateItem(item.id, { progress: 50 });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Generation failed');
        }

        // Success
        updateItem(item.id, {
          status: 'completed',
          progress: 100,
          result: {
            pptx_base64: data.pptx_base64,
            filename: data.filename,
            slide_count: data.slide_count || 0,
          },
        });

        completedItems.push({ ...item, status: 'completed', progress: 100, result: data });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        updateItem(item.id, {
          status: 'error',
          error: errorMsg,
        });
      }

      // Small delay between items
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setCurrentIndex(-1);
    onComplete?.(completedItems);
  };

  // Download all completed items as ZIP
  const downloadAll = async () => {
    const completed = items.filter(item => item.status === 'completed' && item.result);
    if (completed.length === 0) return;

    // For now, download each individually
    // In a real implementation, we'd create a ZIP file
    for (const item of completed) {
      if (item.result) {
        const blob = new Blob(
          [Uint8Array.from(atob(item.result.pptx_base64), c => c.charCodeAt(0))],
          { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
        );
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = item.result.filename;
        a.click();
        URL.revokeObjectURL(a.href);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }
  };

  // Download single item
  const downloadItem = (item: BatchItem) => {
    if (!item.result) return;
    
    const blob = new Blob(
      [Uint8Array.from(atob(item.result.pptx_base64), c => c.charCodeAt(0))],
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = item.result.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Clear all
  const clearAll = () => {
    if (isRunning) return;
    setItems([]);
  };

  const completedCount = items.filter(i => i.status === 'completed').length;
  const errorCount = items.filter(i => i.status === 'error').length;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#FEC00F]">Batch Generator</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Generate multiple presentations at once
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning}
              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-600 disabled:opacity-40 transition-colors"
            >
              📄 Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>No items in batch</p>
            <p className="text-xs mt-1">Upload a CSV or add items manually</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`bg-[#0a0a0a] rounded-lg p-3 border transition-colors ${
                item.status === 'generating' ? 'border-[#FEC00F]/50' :
                item.status === 'completed' ? 'border-green-500/30' :
                item.status === 'error' ? 'border-red-500/30' :
                'border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Index */}
                <span className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded text-xs text-gray-400">
                  {index + 1}
                </span>

                {/* Name input */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder="Presentation name"
                  disabled={isRunning}
                  className="flex-1 bg-transparent border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FEC00F] disabled:opacity-50"
                />

                {/* Strategy input */}
                <input
                  type="text"
                  value={item.strategy}
                  onChange={(e) => updateItem(item.id, { strategy: e.target.value })}
                  placeholder="Strategy"
                  disabled={isRunning}
                  className="w-32 bg-transparent border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FEC00F] disabled:opacity-50"
                />

                {/* Status */}
                {item.status === 'generating' && (
                  <div className="w-16 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-[#FEC00F] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-[#FEC00F]">{item.progress}%</span>
                  </div>
                )}
                {item.status === 'completed' && (
                  <button
                    onClick={() => downloadItem(item)}
                    className="text-green-400 hover:text-green-300 text-xs"
                  >
                    ⬇ Download
                  </button>
                )}
                {item.status === 'error' && (
                  <span className="text-red-400 text-xs" title={item.error}>
                    ❌ Error
                  </span>
                )}

                {/* Remove */}
                {!isRunning && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-500 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {item.status === 'generating' && (
                <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FEC00F] transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {/* Error message */}
              {item.status === 'error' && item.error && (
                <p className="mt-1 text-[10px] text-red-400">{item.error}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700 bg-[#141414]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={addItem}
              disabled={isRunning}
              className="text-xs text-[#FEC00F] hover:text-yellow-300 disabled:opacity-40"
            >
              + Add Item
            </button>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                disabled={isRunning}
                className="text-xs text-gray-500 hover:text-white disabled:opacity-40"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {completedCount > 0 && (
              <button
                onClick={downloadAll}
                disabled={isRunning}
                className="text-xs text-green-400 hover:text-green-300 disabled:opacity-40"
              >
                ⬇ Download All ({completedCount})
              </button>
            )}
            {errorCount > 0 && (
              <span className="text-xs text-red-400">{errorCount} failed</span>
            )}
            <button
              onClick={startBatch}
              disabled={isRunning || items.length === 0}
              className="px-4 py-2 bg-[#FEC00F] text-[#212121] font-bold rounded-lg text-xs hover:bg-yellow-400 disabled:opacity-40 transition-all"
            >
              {isRunning ? `Generating ${currentIndex + 1}/${items.length}...` : `Start Batch (${items.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* CSV Format Help */}
      <div className="px-4 py-2 border-t border-gray-700 bg-[#0a0a0a]">
        <p className="text-[10px] text-gray-500">
          <strong>CSV Format:</strong> name,title, strategy_name (one row per presentation)
        </p>
      </div>
    </div>
  );
}