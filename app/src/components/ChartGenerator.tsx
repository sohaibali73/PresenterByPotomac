'use client';

import { useState } from 'react';

interface ChartGeneratorProps {
  onInsert?: (chartData: { svg: string; dataUri: string; config: any }) => void;
}

export default function ChartGenerator({ onInsert }: ChartGeneratorProps) {
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut' | 'area'>('bar');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ svg: string; dataUri: string; config: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: 'B' },
    { value: 'line', label: 'Line Chart', icon: 'L' },
    { value: 'area', label: 'Area Chart', icon: 'A' },
    { value: 'pie', label: 'Pie Chart', icon: 'P' },
    { value: 'doughnut', label: 'Doughnut', icon: 'D' },
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe the chart you want');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch('/api/generate-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          chartType,
          title: title || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPreview({
        svg: data.svg,
        dataUri: data.data_uri,
        config: data.config,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (preview && onInsert) {
      onInsert(preview);
    }
  };

  const handleDownload = () => {
    if (!preview) return;
    
    const blob = new Blob([preview.svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chart-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-[#212121]">
        <h3 className="text-sm font-semibold text-[#FEC00F]">AI Chart Generator</h3>
        <p className="text-xs text-gray-400 mt-0.5">Describe your chart and let AI create it</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Chart Type Selection */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Chart Type</label>
          <div className="flex gap-2 flex-wrap">
            {chartTypes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setChartType(ct.value as any)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  chartType === ct.value
                    ? 'bg-[#FEC00F] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <span>{ct.icon}</span>
                <span>{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Chart Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Quarterly Performance"
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Describe Your Chart</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Compare Bull Bear strategy returns vs S&P 500 over the last 5 years..."
            className="w-full h-24 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#FEC00F]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="w-full bg-[#FEC00F] text-[#212121] font-bold py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate Chart</>
          )}
        </button>

        {/* Preview */}
        {preview && (
          <div className="space-y-3">
            <div className="bg-[#0a0a0a] rounded-lg p-2 border border-gray-700">
              <div 
                className="w-full aspect-video flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: preview.svg }}
              />
            </div>
            
            {/* Config Preview */}
            {preview.config && (
              <div className="text-xs text-gray-500 bg-[#0a0a0a] rounded-lg p-2 border border-gray-700">
                <p><strong>Labels:</strong> {preview.config.data?.labels?.join(', ')}</p>
                <p><strong>Values:</strong> {preview.config.data?.datasets?.[0]?.data?.join(', ')}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors"
              >
                ⬇ Download SVG
              </button>
              {onInsert && (
                <button
                  onClick={handleInsert}
                  className="flex-1 py-2 bg-[#FEC00F] text-[#212121] rounded-lg text-xs font-bold hover:bg-yellow-400 transition-colors"
                >
                  ✓ Insert Chart
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}