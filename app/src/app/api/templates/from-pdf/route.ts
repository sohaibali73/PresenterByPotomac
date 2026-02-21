import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileBase64, fileType } = body;

    if (!fileBase64) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine media type
    const mediaType = fileType || 'application/pdf';

    const systemPrompt = `You are a PowerPoint template designer for Potomac. Analyze the provided document and create a matching slide template that follows Potomac brand guidelines.

POTOMAC BRAND GUIDELINES (MANDATORY - adapt document style to these):
- Company name: "Potomac" (NOT "Potomac Fund Management")
- Tagline: "Built to Conquer Risk®"

COLOR PALETTE:
- Potomac Yellow (PRIMARY): #FEC00F
- Potomac Dark Gray (TEXT): #212121
- White: #FFFFFF
- Gray: #737373
- Turquoise: #00DED1 (ONLY for Investment Strategies/Funds)
- Pink: #EB2F5C (sparingly for accents)

TYPOGRAPHY:
- Headlines: Rajdhani, ALWAYS ALL CAPS
- Body: Quicksand
- Title fontSize: 28-48, Body fontSize: 12-18

DESIGN RULES:
- Max 3 brand colors per slide
- Clean, uncluttered with ample white space
- Dark backgrounds (#212121) with white text + yellow accents
- OR white backgrounds with dark text + yellow accents

Slide dimensions: 13.33" x 7.5" (widescreen 16:9)

Analyze the document's layout structure, colors, typography, and visual elements. Then adapt them to Potomac's brand.

Return a JSON object with this EXACT structure:
{
  "name": "Template Name",
  "description": "Description",
  "category": "custom",
  "layout_type": "content",
  "slide_config": {
    "background": { "color": "#212121" },
    "elements": [
      {
        "id": "el_1",
        "type": "text",
        "x": 0.4,
        "y": 0.6,
        "w": 12.5,
        "h": 1.0,
        "style": { "color": "#FFFFFF", "fontSize": 32, "fontFace": "Rajdhani", "bold": true },
        "content": "TITLE PLACEHOLDER",
        "options": {}
      }
    ]
  }
}

Include 3-8 elements. All headline text must be ALL CAPS.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: fileBase64
              }
            },
            {
              type: 'text',
              text: 'Analyze this document and create a matching PowerPoint slide template. Return only the JSON configuration.'
            }
          ]
        }
      ]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const templateConfig = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ template: templateConfig });
  } catch (error: any) {
    console.error('PDF to template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}