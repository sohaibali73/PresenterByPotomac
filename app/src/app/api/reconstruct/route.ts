import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const body = await request.json();
    const { fileBase64, fileType, fileName } = body;

    if (!fileBase64) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Use Claude vision to analyze the file and extract slide structure
    const analysisPrompt = `Analyze this ${fileType === 'application/pdf' ? 'PDF' : 'PowerPoint'} file named "${fileName}".

Extract the following information:
1. Main title/topic of the presentation
2. All slides/pages with their content (title, key points, layout type)
3. Overall presentation structure

Map each slide/page to one of these Potomac layouts:
- cover (title slide)
- section_divider (section header)
- three_pillars (3-point framework)
- chart (data/chart slide)
- composite_three (A + B = C formula)
- composite_four (3 inputs → result)
- five_component_diagram (hub & spoke)
- strategy_table (table of data)
- risk_statistics (risk/performance stats)
- use_cases (4 use case circles)
- thank_you
- disclosures
- definitions

Return a JSON object ONLY (no markdown):
{
  "presentation_title": "...",
  "strategy_name": "...",
  "slides": [
    {
      "slide_number": 1,
      "layout": "cover",
      "title": "TITLE IN CAPS",
      "content": { ...layout-specific fields... }
    }
  ],
  "outline": "Full text outline of the presentation"
}`;

    const messageContent: Anthropic.MessageParam['content'] = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: fileType === 'application/pdf' ? 'application/pdf' : 'application/pdf',
          data: fileBase64,
        },
      } as Anthropic.DocumentBlockParam,
      {
        type: 'text',
        text: analysisPrompt,
      },
    ];

    console.log('Analyzing uploaded file with Claude vision...');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: messageContent }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Analysis response length:', responseText.length);

    // Parse JSON from response
    let analysis;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch {
        console.error('JSON parse failed:', jsonMatch[0].substring(0, 200));
      }
    }

    if (!analysis) {
      // Fallback: extract what we can from text response
      analysis = {
        presentation_title: fileName.replace(/\.(pdf|pptx)$/i, '').replace(/_/g, ' '),
        strategy_name: '',
        slides: [],
        outline: responseText,
      };
    }

    return NextResponse.json({
      analysis,
      outline: analysis.outline || responseText,
      slides: analysis.slides || [],
      presentation_title: analysis.presentation_title || '',
      strategy_name: analysis.strategy_name || '',
    });
  } catch (error: unknown) {
    console.error('Reconstruct error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Analysis failed' }, { status: 500 });
  }
}
