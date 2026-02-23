import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Chart data structure for pptxgenjs
interface ChartSlideData {
  chart_type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  chart_title: string;
  chart_data: Array<{
    name: string;
    labels: string[];
    values: number[];
  }>;
  chart_caption?: string;
  show_legend?: boolean;
  show_values?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, chartType, title, theme } = body;

    // Use AI to generate realistic chart data
    const prompt = `Generate realistic financial chart data for a Potomac investment presentation.

Chart Type: ${chartType || 'bar'}
Title: ${title || 'Performance Data'}
Description: ${description}

Return ONLY a JSON object with this exact structure:
{
  "chart_type": "${chartType || 'bar'}",
  "chart_title": "Chart title in UPPERCASE",
  "chart_data": [
    {
      "name": "Dataset name",
      "labels": ["Label1", "Label2", "Label3", "Label4", "Label5"],
      "values": [100, 200, 150, 300, 250]
    }
  ],
  "chart_caption": "Source: FastTrack as of 12/31/2025",
  "show_legend": true,
  "show_values": true
}

For financial presentations, typical data includes:
- Performance returns (1-Year, 5-Year, 10-Year)
- Risk metrics (Max Drawdown, Standard Deviation, Beta)
- Allocation percentages
- Strategy comparisons

Use realistic investment numbers. For comparison charts, include 2 datasets (e.g., Strategy vs Benchmark).`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse the JSON from the response
    let chartData: ChartSlideData;
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      chartData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Fallback to default chart
      chartData = {
        chart_type: chartType || 'bar',
        chart_title: (title || 'PERFORMANCE').toUpperCase(),
        chart_data: [{
          name: 'Returns',
          labels: ['1-Year', '3-Year', '5-Year', '10-Year'],
          values: [17.5, 12.8, 14.2, 11.9]
        }],
        chart_caption: 'Source: FastTrack as of 12/31/2025',
        show_legend: true,
        show_values: true
      };
    }

    // Convert to pptxgenjs format
    const pptxChartData = chartData.chart_data.map(dataset => ({
      name: dataset.name,
      labels: dataset.labels,
      values: dataset.values
    }));

    return NextResponse.json({
      success: true,
      slide: {
        layout: 'chart',
        chart_type: chartData.chart_type,
        chart_title: chartData.chart_title,
        chart_data: pptxChartData,
        chart_caption: chartData.chart_caption,
        show_legend: chartData.show_legend,
        show_values: chartData.show_values
      },
      raw: chartData
    });
  } catch (error) {
    console.error('Chart generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chart generation failed' },
      { status: 500 }
    );
  }
}