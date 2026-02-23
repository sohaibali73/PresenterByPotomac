import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface SmartGenerateRequest {
  prompt: string;
  presentationType?: string;
  targetSlides?: number;
  theme?: string;
}

const LAYOUT_TYPES = [
  'cover', 'section_divider', 'three_pillars', 'chart', 'composite_three',
  'composite_four', 'five_component_diagram', 'strategy_table', 'risk_statistics',
  'use_cases', 'thank_you', 'disclosures', 'definitions'
];

export async function POST(request: NextRequest) {
  try {
    const body: SmartGenerateRequest = await request.json();
    const { prompt, presentationType = 'strategy', targetSlides = 5, theme = 'classic' } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Generate slides based on prompt
    const slides = await generateSlidesFromPrompt(prompt, presentationType, targetSlides, theme);

    return NextResponse.json({
      slides,
      title: generateTitle(prompt),
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt,
        presentationType,
        theme,
      },
    });

  } catch (error) {
    console.error('Smart generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    );
  }
}

async function generateSlidesFromPrompt(
  prompt: string,
  presentationType: string,
  targetSlides: number,
  theme: string
): Promise<any[]> {
  // If OpenAI key available, use AI generation
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a presentation slide generator for Potomac Fund Management.
Generate a JSON array of slides based on the user's prompt.
Each slide should have: layout (one of: ${LAYOUT_TYPES.join(', ')}), and layout-specific fields.

Common layouts and their fields:
- cover: title, tagline
- section_divider: section_title
- three_pillars: title, subtitle, pillars: [{ label, description }]
- chart: chart_title, chart_caption
- composite_three: headline, components: [{ title, body, is_result }]
- thank_you: thank_you text

Return ONLY valid JSON array of slides, no markdown.`
            },
            {
              role: 'user',
              content: `Generate ${targetSlides} slides for a ${presentationType} presentation about: "${prompt}"

Make it professional, suitable for financial/investment context. Include:
1. A cover slide
2. Content slides about the topic
3. A closing slide (thank you)

Return as JSON array.`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '[]';
        try {
          return JSON.parse(text);
        } catch {
          // Fall through to mock generation
        }
      }
    } catch (err) {
      console.error('OpenAI generation failed:', err);
    }
  }

  // Fallback to template-based generation
  return generateMockSlides(prompt, presentationType, targetSlides);
}

function generateMockSlides(prompt: string, presentationType: string, targetSlides: number): any[] {
  const slides: any[] = [];
  const words = prompt.split(' ').filter(w => w.length > 3);
  const topic = words.slice(0, 3).join(' ') || prompt;

  // Cover slide
  slides.push({
    layout: 'cover',
    title: topic.toUpperCase(),
    tagline: 'Strategic Investment Approach',
  });

  // Section divider
  slides.push({
    layout: 'section_divider',
    section_title: 'OVERVIEW',
  });

  // Three pillars
  slides.push({
    layout: 'three_pillars',
    title: 'KEY PILLARS',
    subtitle: `Our approach to ${topic}`,
    pillars: [
      { label: 'PILLAR ONE', description: 'First strategic element of the approach' },
      { label: 'PILLAR TWO', description: 'Second strategic element of the approach' },
      { label: 'PILLAR THREE', description: 'Third strategic element of the approach' },
    ],
  });

  // Add more content slides if needed
  if (targetSlides > 4) {
    slides.push({
      layout: 'section_divider',
      section_title: 'PERFORMANCE',
    });

    slides.push({
      layout: 'chart',
      chart_title: 'PERFORMANCE METRICS',
      chart_caption: 'Historical performance data',
    });
  }

  if (targetSlides > 6) {
    slides.push({
      layout: 'composite_three',
      headline: 'INVESTMENT COMPOSITE',
      components: [
        { title: 'ALPHA', body: 'Excess return generation', is_result: false },
        { title: 'BETA', body: 'Market exposure management', is_result: false },
        { title: 'RESULT', body: 'Combined strategy outcome', is_result: true },
      ],
    });
  }

  // Thank you slide
  slides.push({
    layout: 'thank_you',
    thank_you: 'THANK YOU',
  });

  return slides.slice(0, targetSlides + 1);
}

function generateTitle(prompt: string): string {
  const words = prompt.split(' ').slice(0, 4);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Generate single slide
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, afterSlide, presentationContext } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Determine best layout for the prompt
    const layout = detectLayoutFromPrompt(prompt);
    const slide = generateSingleSlide(prompt, layout);

    return NextResponse.json({
      slide,
      insertAfter: afterSlide,
    });

  } catch (error) {
    console.error('Single slide generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate slide' },
      { status: 500 }
    );
  }
}

function detectLayoutFromPrompt(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('cover') || lower.includes('title') || lower.includes('start')) {
    return 'cover';
  }
  if (lower.includes('section') || lower.includes('divider') || lower.includes('break')) {
    return 'section_divider';
  }
  if (lower.includes('pillar') || lower.includes('three') || lower.includes('process')) {
    return 'three_pillars';
  }
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('performance')) {
    return 'chart';
  }
  if (lower.includes('compare') || lower.includes('component') || lower.includes('formula')) {
    return 'composite_three';
  }
  if (lower.includes('table') || lower.includes('statistics') || lower.includes('data')) {
    return 'strategy_table';
  }
  if (lower.includes('thank') || lower.includes('end') || lower.includes('contact')) {
    return 'thank_you';
  }
  if (lower.includes('disclosure') || lower.includes('legal') || lower.includes('risk')) {
    return 'disclosures';
  }

  // Default based on keywords
  return 'three_pillars';
}

function generateSingleSlide(prompt: string, layout: string): any {
  const title = prompt.split(' ').slice(0, 4).join(' ').toUpperCase();

  switch (layout) {
    case 'cover':
      return {
        layout,
        title,
        tagline: 'Strategic Investment Approach',
      };
    case 'section_divider':
      return {
        layout,
        section_title: title,
      };
    case 'three_pillars':
      return {
        layout,
        title,
        subtitle: 'Key strategic elements',
        pillars: [
          { label: 'PILLAR ONE', description: 'First element description' },
          { label: 'PILLAR TWO', description: 'Second element description' },
          { label: 'PILLAR THREE', description: 'Third element description' },
        ],
      };
    case 'chart':
      return {
        layout,
        chart_title: title,
        chart_caption: 'Performance metrics and analysis',
      };
    case 'composite_three':
      return {
        layout,
        headline: title,
        components: [
          { title: 'COMPONENT A', body: 'First component', is_result: false },
          { title: 'COMPONENT B', body: 'Second component', is_result: false },
          { title: 'RESULT', body: 'Combined outcome', is_result: true },
        ],
      };
    case 'thank_you':
      return {
        layout,
        thank_you: 'THANK YOU',
      };
    case 'disclosures':
      return {
        layout,
        header: 'DISCLOSURES',
        disclosure_text: 'Important disclosures and risk factors.',
      };
    default:
      return {
        layout,
        title,
      };
  }
}