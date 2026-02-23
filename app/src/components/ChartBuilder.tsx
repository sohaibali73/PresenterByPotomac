'use client';

import { useState, useCallback } from 'react';

// Potomac brand colors
const POTOMAC_COLORS = [
  '#FEC00F', // Yellow (primary)
  '#212121', // Dark
  '#FFFFFF', // White
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
];

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter';
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartOptions;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
}

export interface ChartOptions {
  legend?: boolean;
  gridLines?: boolean;
  xAxesLabel?: string;
  yAxesLabel?: string;
  stacked?: boolean;
}

interface ChartBuilderProps {
  onChartReady: (config: ChartConfig, imageUrl: string) => void;
  onCancel?: () => void;
  initialConfig?: Partial<ChartConfig>;
}

export default function ChartBuilder({ onChartReady, onCancel, initialConfig }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<ChartConfig['type']>(initialConfig?.type || 'bar');
  const [title, setTitle] = useState(initialConfig?.title || '');
  const [labels, setLabels] = useState<string[]>(initialConfig?.labels || ['Q1', 'Q2', 'Q3', 'Q4']);
  const [datasets, setDatasets] = useState<ChartDataset[]>(
    initialConfig?.datasets || [{ label: 'Series 1', data: [10, 20, 30, 40] }]
  );
  const [options, setOptions] = useState<ChartOptions>(
    initialConfig?.options || { legend: true, gridLines: true }
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Update labels from textarea
  const handleLabelsChange = (value: string) => {
    const newLabels = value.split('\n').map(l => l.trim()).filter(Boolean);
    setLabels(newLabels);
  };

  // Update dataset data from textarea
  const handleDataChange = (datasetIndex: number, value: string) => {
    const newData = value.split('\n').map(l => parseFloat(l.trim())).filter(n => !isNaN(n));
    setDatasets(prev => prev.map((ds, i) => 
      i === datasetIndex ? { ...ds, data: newData } : ds
    ));
  };

  // Add a new dataset
  const addDataset = () => {
    const colorIndex = datasets.length % POTOMAC_COLORS.length;
    setDatasets(prev => [...prev, {
      label: `Series ${prev.length + 1}`,
      data: labels.map(() => 0),
      backgroundColor: chartType === 'line' ? POTOMAC_COLORS[colorIndex] : POTOMAC_COLORS.slice(0, labels.length),
      borderColor: POTOMAC_COLORS[colorIndex],
    }]);
  };

  // Remove a dataset
  const removeDataset = (index: number) => {
    setDatasets(prev => prev.filter((_, i) => i !== index));
  };

  // Update dataset label
  const updateDatasetLabel = (index: number, label: string) => {
    setDatasets(prev => prev.map((ds, i) => 
      i === index ? { ...ds, label } : ds
    ));
  };

  // Generate chart using QuickChart API
  const generateChart = useCallback(async () => {
    setGenerating(true);
    try {
      const chartConfig: ChartConfig = {
        type: chartType,
        title,
        labels,
        datasets: datasets.map((ds, i) => ({
          ...ds,
          backgroundColor: chartType === 'pie' || chartType === 'doughnut'
            ? POTOMAC_COLORS.slice(0, labels.length)
            : (ds.backgroundColor || POTOMAC_COLORS[i % POTOMAC_COLORS.length]),
          borderColor: ds.borderColor || POTOMAC_COLORS[i % POTOMAC_COLORS.length],
        })),
        options,
      };

      // Build QuickChart URL
      const chart = {
        type: chartType,
        data: {
          labels,
          datasets: chartConfig.datasets.map(ds => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.backgroundColor,
            borderColor: ds.borderColor,
            fill: ds.fill,
          })),
        },
        options: {
          title: {
            display: !!title,
            text: title,
            fontColor: '#FFFFFF',
            fontSize: 18,
            fontFamily: 'Rajdhani',
          },
          legend: {
            display: options.legend,
            labels: {
              fontColor: '#FFFFFF',
              fontFamily: 'Quicksand',
            },
          },
          scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
            xAxes: [{
              gridLines: { color: '#444444', display: options.gridLines },
              ticks: { fontColor: '#FFFFFF', fontFamily: 'Quicksand' },
              scaleLabel: options.xAxesLabel ? {
                display: true,
                labelString: options.xAxesLabel,
                fontColor: '#FEC00F',
              } : undefined,
            }],
            yAxes: [{
              gridLines: { color: '#444444', display: options.gridLines },
              ticks: { fontColor: '#FFFFFF', fontFamily: 'Quicksand' },
              scaleLabel: options.yAxesLabel ? {
                display: true,
                labelString: options.yAxesLabel,
                fontColor: '#FEC00F',
              } : undefined,
              stacked: options.stacked,
            }],
          } : undefined,
        },
      };

      // Encode for QuickChart
      const encodedChart = encodeURIComponent(JSON.stringify(chart));
      const chartUrl = `https://quickchart.io/chart?c=${encodedChart}&bgcolor=%23212121&width=800&height=450`;
      
      setPreviewUrl(chartUrl);

      // Convert to base64 for embedding
      const response = await fetch(chartUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChartReady(chartConfig, base64);
      };
      reader.readAsDataURL(blob);

    } catch (error) {
      console.error('Failed to generate chart:', error);
    } finally {
      setGenerating(false);
    }
  }, [chartType, title, labels, datasets, options, onChartReady]);

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-[#FEC00F]">Chart Builder</h3>
        <p className="text-xs text-gray-400 mt-0.5">Create charts with Potomac branding</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Chart Type Selection */}
        <div>
          <label className="text-xs text-gray-500 block mb-2">Chart Type</label>
          <div className="flex gap-2">
            {(['bar', 'line', 'pie', 'doughnut'] as const).map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  chartType === type
                    ? 'bg-[#FEC00F] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Chart Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., PERFORMANCE COMPARISON"
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F]"
          />
        </div>

        {/* Labels (X-axis) */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Labels (one per line)</label>
          <textarea
            value={labels.join('\n')}
            onChange={e => handleLabelsChange(e.target.value)}
            placeholder="Q1&#10;Q2&#10;Q3&#10;Q4"
            rows={3}
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FEC00F] font-mono"
          />
        </div>

        {/* Datasets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Data Series</label>
            <button
              onClick={addDataset}
              className="text-xs text-[#FEC00F] hover:text-yellow-300"
            >
              + Add Series
            </button>
          </div>
          
          {datasets.map((dataset, index) => (
            <div key={index} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={dataset.label}
                  onChange={e => updateDatasetLabel(index, e.target.value)}
                  placeholder="Series name"
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                {datasets.length > 1 && (
                  <button
                    onClick={() => removeDataset(index)}
                    className="text-gray-500 hover:text-red-400 text-xs ml-2"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                value={dataset.data.join('\n')}
                onChange={e => handleDataChange(index, e.target.value)}
                placeholder="10&#10;20&#10;30&#10;40"
                rows={3}
                className="w-full bg-transparent border border-gray-800 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono"
              />
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={options.legend}
              onChange={e => setOptions(prev => ({ ...prev, legend: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#FEC00F] focus:ring-[#FEC00F]"
            />
            Show Legend
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={options.gridLines}
              onChange={e => setOptions(prev => ({ ...prev, gridLines: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#FEC00F] focus:ring-[#FEC00F]"
            />
            Show Grid Lines
          </label>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-[#141414] text-xs text-gray-400">Preview</div>
            <img src={previewUrl} alt="Chart preview" className="w-full" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={generateChart}
            disabled={generating || labels.length === 0 || datasets[0]?.data.length === 0}
            className="flex-1 px-4 py-2.5 bg-[#FEC00F] text-[#212121] font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-[#212121] border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Chart'
            )}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Quick chart generator for one-off charts
 */
export function QuickChartGenerator({ 
  onInsert 
}: { 
  onInsert: (imageUrl: string) => void 
}) {
  const [showBuilder, setShowBuilder] = useState(false);

  if (!showBuilder) {
    return (
      <button
        onClick={() => setShowBuilder(true)}
        className="w-full px-3 py-2.5 bg-gray-800 text-[#FEC00F] hover:text-yellow-300 rounded-lg text-xs transition-colors border border-[#FEC00F]/30 flex items-center justify-center gap-1"
      >
        📊 Create Chart
      </button>
    );
  }

  return (
    <ChartBuilder
      onChartReady={(config, imageUrl) => {
        onInsert(imageUrl);
        setShowBuilder(false);
      }}
      onCancel={() => setShowBuilder(false)}
    />
  );
}