import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter';
  title: string;
  data: ChartData;
  options?: {
    showLegend?: boolean;
    showGrid?: boolean;
    showValues?: boolean;
    horizontal?: boolean;
    stacked?: boolean;
  };
}

// Generate SVG chart from data
function generateSVGChart(config: ChartConfig): string {
  const { type, title, data, options = {} } = config;
  const width = 800;
  const height = 500;
  const padding = { top: 60, right: 40, bottom: 80, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Colors from Potomac brand
  const colors = ['#FEC00F', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6', '#F97316', '#14B8A6', '#EC4899'];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#212121"/>`;
  
  // Title
  svg += `<text x="${width/2}" y="35" text-anchor="middle" fill="#FEC00F" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${escapeXml(title)}</text>`;

  const { labels, datasets } = data;
  const maxValue = Math.max(...datasets.flatMap(d => d.data)) * 1.1;

  if (type === 'bar' || type === 'line' || type === 'area') {
    // Draw grid
    if (options.showGrid !== false) {
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#374151" stroke-width="1"/>`;
        const value = Math.round(maxValue * (1 - i / 5));
        svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="12">${value}</text>`;
      }
    }

    // Draw axes
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#6B7280" stroke-width="2"/>`;
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#6B7280" stroke-width="2"/>`;

    const barGroupWidth = chartWidth / labels.length;
    const barWidth = Math.min(barGroupWidth * 0.7 / datasets.length, 40);

    datasets.forEach((dataset, datasetIdx) => {
      const color = dataset.color || colors[datasetIdx % colors.length];

      if (type === 'bar') {
        dataset.data.forEach((value, idx) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding.left + barGroupWidth * idx + barGroupWidth * 0.15 + barWidth * datasetIdx;
          const y = height - padding.bottom - barHeight;

          svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>`;
          
          if (options.showValues) {
            svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="11">${value}</text>`;
          }
        });
      } else if (type === 'line' || type === 'area') {
        let points = '';
        dataset.data.forEach((value, idx) => {
          const x = padding.left + barGroupWidth * idx + barGroupWidth / 2;
          const y = height - padding.bottom - (value / maxValue) * chartHeight;
          points += `${x},${y} `;
        });

        if (type === 'area') {
          const areaPoints = points.trim().split(' ').map(p => p.split(','));
          const firstPoint = areaPoints[0];
          const lastPoint = areaPoints[areaPoints.length - 1];
          svg += `<polygon points="${padding.left},${height - padding.bottom} ${points} ${lastPoint[0]},${height - padding.bottom}" fill="${color}" opacity="0.3"/>`;
        }

        svg += `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
        
        // Draw points
        dataset.data.forEach((value, idx) => {
          const x = padding.left + barGroupWidth * idx + barGroupWidth / 2;
          const y = height - padding.bottom - (value / maxValue) * chartHeight;
          svg += `<circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`;
          if (options.showValues) {
            svg += `<text x="${x}" y="${y - 10}" text-anchor="middle" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="11">${value}</text>`;
          }
        });
      }
    });

    // X-axis labels
    labels.forEach((label, idx) => {
      const x = padding.left + barGroupWidth * idx + barGroupWidth / 2;
      svg += `<text x="${x}" y="${height - padding.bottom + 25}" text-anchor="middle" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="12">${escapeXml(label)}</text>`;
    });

  } else if (type === 'pie' || type === 'doughnut') {
    const total = datasets[0].data.reduce((a, b) => a + b, 0);
    const cx = width / 2;
    const cy = height / 2 + 10;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 40;
    const innerRadius = type === 'doughnut' ? radius * 0.5 : 0;

    let startAngle = -Math.PI / 2;

    datasets[0].data.forEach((value, idx) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const color = colors[idx % colors.length];

      const x1 = cx + Math.cos(startAngle) * radius;
      const y1 = cy + Math.sin(startAngle) * radius;
      const x2 = cx + Math.cos(endAngle) * radius;
      const y2 = cy + Math.sin(endAngle) * radius;

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      let path;
      if (innerRadius > 0) {
        const ix1 = cx + Math.cos(startAngle) * innerRadius;
        const iy1 = cy + Math.sin(startAngle) * innerRadius;
        const ix2 = cx + Math.cos(endAngle) * innerRadius;
        const iy2 = cy + Math.sin(endAngle) * innerRadius;
        path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
      } else {
        path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }

      svg += `<path d="${path}" fill="${color}"/>`;

      // Label
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius + 25;
      const lx = cx + Math.cos(midAngle) * labelRadius;
      const ly = cy + Math.sin(midAngle) * labelRadius;
      const percentage = Math.round((value / total) * 100);
      svg += `<text x="${lx}" y="${ly}" text-anchor="middle" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="11">${labels[idx]} (${percentage}%)</text>`;

      startAngle = endAngle;
    });
  }

  // Legend
  if (options.showLegend !== false && datasets.length > 1) {
    const legendY = height - 25;
    let legendX = padding.left;
    
    datasets.forEach((dataset, idx) => {
      const color = dataset.color || colors[idx % colors.length];
      svg += `<rect x="${legendX}" y="${legendY - 10}" width="12" height="12" fill="${color}" rx="2"/>`;
      svg += `<text x="${legendX + 18}" y="${legendY}" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="11">${escapeXml(dataset.label)}</text>`;
      legendX += 100;
    });
  }

  svg += '</svg>';
  return svg;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, chartType, title, dataHint } = body;

    // Use AI to generate chart data
    const prompt = `Generate realistic chart data for a presentation chart.

Chart Type: ${chartType || 'bar'}
Title: ${title || 'Performance Data'}
Description: ${description}
${dataHint ? `Data Context: ${dataHint}` : ''}

Return a JSON object with this exact structure:
{
  "type": "${chartType || 'bar'}",
  "title": "Chart title",
  "data": {
    "labels": ["Label1", "Label2", "Label3", "Label4", "Label5"],
    "datasets": [
      {
        "label": "Dataset name",
        "data": [100, 200, 150, 300, 250]
      }
    ]
  },
  "options": {
    "showLegend": true,
    "showGrid": true,
    "showValues": true
  }
}

Make the data realistic and relevant to the description. Use 5-8 data points.
For comparison charts, include 2-3 datasets.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse the JSON from the response
    let chartConfig: ChartConfig;
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      chartConfig = JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Fallback to default chart
      chartConfig = {
        type: chartType || 'bar',
        title: title || 'Chart',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{ label: 'Value', data: [100, 150, 200, 175] }],
        },
        options: { showLegend: true, showGrid: true, showValues: true },
      };
    }

    // Generate SVG
    const svg = generateSVGChart(chartConfig);

    // Convert to base64
    const base64 = Buffer.from(svg).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64}`;

    return NextResponse.json({
      success: true,
      svg,
      svg_base64: base64,
      data_uri: dataUri,
      config: chartConfig,
    });
  } catch (error) {
    console.error('Chart generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chart generation failed' },
      { status: 500 }
    );
  }
}