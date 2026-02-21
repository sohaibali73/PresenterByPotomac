import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, layoutType } = body;

    const systemPrompt = `You are a PowerPoint template designer for Potomac. Generate slide template configurations as JSON.

POTOMAC BRAND GUIDELINES (MANDATORY):
- Company name: "Potomac" (NOT "Potomac Fund Management")
- Tagline: "Built to Conquer Risk®" (always include ® symbol)

COLOR PALETTE:
- Potomac Yellow (PRIMARY): #FEC00F - Use across all communications
- Potomac Dark Gray (TEXT): #212121 - Headers on web/design, NOT for body text
- White: #FFFFFF - Backgrounds, text on dark
- Gray: #737373 - Secondary text, subtle elements
- Light Gray: #C6C6C6 - Borders, dividers
- Turquoise: #00DED1 - ONLY for Investment Strategies/Funds content
- Pink: #EB2F5C - Sparingly for accents/CTAs

TYPOGRAPHY:
- Headlines: Rajdhani font, ALWAYS ALL CAPS, weights: Bold/Medium/Light
- Body: Quicksand font, weights: Bold/Medium/Light
- Never mix fonts beyond these two
- Title text: fontSize 28-48
- Body text: fontSize 12-18

DESIGN RULES:
- Never use more than 3 brand colors per slide
- Keep slides clean and uncluttered with ample white space
- Yellow strategically as accent color (bars, highlights, shapes)
- Dark backgrounds (#212121) with white text and yellow accents
- OR white backgrounds with dark text and yellow accents
- Logo placement: top-left (w:2.0, h:0.41 on cover; w:1.6, h:0.5 elsewhere)
- Badge/icon: top-right corner

Slide dimensions: 13.33" x 7.5" (widescreen 16:9)

Return a JSON object with this EXACT structure:
{
  "name": "Template Name",
  "description": "Brief description",
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

Position guidelines:
- x: 0.4 to 12.9 (leave 0.4" margins)
- y: 0.2 to 7.0 (leave 0.5" top/bottom margins)
- Use shapes (type:"shape") with options:{fill:"#FEC00F"} for accent bars, dividers
- Include 3-8 elements per template for practical use
- All headline text content must be ALL CAPS`;

    const userPrompt = prompt || `Create a ${layoutType || 'content'} slide template suitable for investment presentations. Include placeholder text and appropriate visual elements.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt + `

AVAILABLE LOGO ASSETS (use these real URLs for image elements):
- Full logo (dark bg): "/potomac-logo-white.png" - use on dark backgrounds, w:2.0, h:0.41
- Full logo (light bg): "/potomac-logo.png" - use on light/yellow backgrounds, w:2.0, h:0.41
- Icon only: "/potomac-icon.png" - use as badge, w:0.7, h:0.7

MULTI-SLIDE TEMPLATES:
Generate a complete multi-slide template set. Return an array of slides in this format:
{
  "name": "Template Set Name",
  "description": "Description",
  "category": "custom",
  "layout_type": "content",
  "slide_config": {
    "slides": [
      {
        "name": "Cover",
        "background": { "color": "#FEC00F" },
        "elements": [...]
      },
      {
        "name": "Content",
        "background": { "color": "#212121" },
        "elements": [...]
      }
    ]
  }
}

Each slide in the slides array should have: name, background, and elements array.
For image elements referencing logos, use: {"id":"logo","type":"image","x":0.4,"y":0.2,"w":2.0,"h":0.41,"content":"/potomac-logo-white.png","options":{}}

IMPORTANT: Return ONLY the JSON object, no code blocks, no markdown. Start with { and end with }.`,
      messages: [{ role: 'user', content: userPrompt + '\n\nGenerate multiple slides. Return ONLY raw JSON, no code blocks.' }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('AI template response length:', text.length);
    
    // Extract JSON - try multiple approaches
    let jsonString = '';
    
    // Approach 1: Check for code blocks (greedy to handle truncation)
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]+?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }
    
    // Approach 2: Find first { and use brace counting
    if (!jsonString) {
      let braceCount = 0;
      let startIdx = text.indexOf('{');
      
      if (startIdx !== -1) {
        for (let i = startIdx; i < text.length; i++) {
          if (text[i] === '{') braceCount++;
          else if (text[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonString = text.substring(startIdx, i + 1);
            break;
          }
        }
        
        // If braces didn't close (truncated), repair the JSON
        if (!jsonString && startIdx !== -1) {
          jsonString = text.substring(startIdx);
          
          // Fix unterminated strings - find last unmatched quote
          let inString = false;
          let lastQuoteIdx = -1;
          for (let j = 0; j < jsonString.length; j++) {
            if (jsonString[j] === '"' && (j === 0 || jsonString[j-1] !== '\\')) {
              inString = !inString;
              if (inString) lastQuoteIdx = j;
            }
          }
          if (inString) {
            // Close the unterminated string
            jsonString += '"';
          }
          
          // Remove trailing incomplete elements (after last complete value)
          jsonString = jsonString.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
          jsonString = jsonString.replace(/,\s*\{[^}]*$/, '');
          jsonString = jsonString.replace(/,\s*$/, '');
          
          // Close unclosed braces/brackets
          const openBraces = (jsonString.match(/{/g) || []).length;
          const closeBraces = (jsonString.match(/}/g) || []).length;
          const openBrackets = (jsonString.match(/\[/g) || []).length;
          const closeBrackets = (jsonString.match(/\]/g) || []).length;
          
          for (let j = 0; j < openBrackets - closeBrackets; j++) jsonString += ']';
          for (let j = 0; j < openBraces - closeBraces; j++) jsonString += '}';
        }
      }
    }
    
    if (!jsonString) {
      console.error('No JSON found in AI response');
      throw new Error('AI did not return valid JSON');
    }

    const templateConfig = JSON.parse(jsonString);
    
    // Ensure slide_config has elements array
    if (templateConfig.slide_config && !Array.isArray(templateConfig.slide_config.elements)) {
      templateConfig.slide_config.elements = [];
    }
    if (!templateConfig.slide_config) {
      templateConfig.slide_config = { background: { color: '#212121' }, elements: [] };
    }

    return NextResponse.json({ template: templateConfig });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}