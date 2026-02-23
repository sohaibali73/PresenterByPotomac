import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface SuggestionRequest {
  type: 'title' | 'bullet' | 'tone' | 'extract' | 'rephrase';
  content: string;
  context?: string;
  tone?: 'formal' | 'conversational' | 'technical';
}

interface Suggestion {
  id: string;
  type: string;
  original: string;
  suggestion: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();
    const { type, content, context, tone = 'formal' } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // If no OpenAI key, return mock suggestions
    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        suggestions: generateMockSuggestions(type, content),
      });
    }

    const prompts: Record<string, string> = {
      title: `You are a presentation title expert. Suggest 3 improved versions of this slide title.
Make them concise (under 50 chars), impactful, and professional for a financial/investment context.
Return as JSON array with format: [{"suggestion": "...", "reason": "..."}]

Original title: "${content}"
${context ? `Context: ${context}` : ''}`,

      bullet: `You are a presentation content optimizer. Improve this bullet point.
Options: shorten (< 10 words), expand (add detail), or rephrase for clarity.
Return as JSON array with 3 options: [{"suggestion": "...", "type": "shorten|expand|rephrase", "reason": "..."}]

Original: "${content}"`,

      tone: `You are a tone adjustment expert. Rewrite this content in a ${tone} tone.
Keep the same meaning but adjust language, formality, and style.
Return as JSON: {"suggestion": "...", "changes": ["...", "..."]}

Original: "${content}"`,

      extract: `You are a key point extraction expert. Extract 3-5 key points from this content.
Make each point concise and actionable.
Return as JSON array: ["point 1", "point 2", "point 3"]

Content: "${content}"`,

      rephrase: `You are a writing improvement expert. Rephrase this content to be clearer and more professional.
Return 3 options as JSON array: [{"suggestion": "...", "focus": "clarity|impact|brevity"}]

Original: "${content}"`,
    };

    const prompt = prompts[type] || prompts.rephrase;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a presentation content expert. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      return NextResponse.json({
        suggestions: generateMockSuggestions(type, content),
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '[]';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = generateMockSuggestions(type, content);
    }

    const suggestions: Suggestion[] = (Array.isArray(parsed) ? parsed : [parsed]).map((s: any, i: number) => ({
      id: `sugg-${Date.now()}-${i}`,
      type,
      original: content,
      suggestion: s.suggestion || s,
      reason: s.reason || s.focus || s.changes?.join(', ') || 'Improved version',
    }));

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('AI suggest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions', suggestions: [] },
      { status: 500 }
    );
  }
}

function generateMockSuggestions(type: string, content: string): Suggestion[] {
  const mockData: Record<string, Suggestion[]> = {
    title: [
      {
        id: `mock-${Date.now()}-1`,
        type: 'title',
        original: content,
        suggestion: content.length > 30 ? content.substring(0, 30) + '...' : content.toUpperCase(),
        reason: 'Made more concise and impactful',
      },
      {
        id: `mock-${Date.now()}-2`,
        type: 'title',
        original: content,
        suggestion: `The ${content.toLowerCase()} Strategy`,
        reason: 'Added clarity with descriptive format',
      },
      {
        id: `mock-${Date.now()}-3`,
        type: 'title',
        original: content,
        suggestion: content.split(' ').slice(0, 4).join(' '),
        reason: 'Shortened for better visual impact',
      },
    ],
    bullet: [
      {
        id: `mock-${Date.now()}-1`,
        type: 'bullet',
        original: content,
        suggestion: content.split(' ').slice(0, 8).join(' '),
        reason: 'Shortened for slide readability',
      },
      {
        id: `mock-${Date.now()}-2`,
        type: 'bullet',
        original: content,
        suggestion: `${content}. This drives measurable results.`,
        reason: 'Added impact statement',
      },
    ],
    tone: [
      {
        id: `mock-${Date.now()}-1`,
        type: 'tone',
        original: content,
        suggestion: content.replace(/very|really|quite/gi, '').trim(),
        reason: 'Removed qualifiers for professional tone',
      },
    ],
    extract: [
      {
        id: `mock-${Date.now()}-1`,
        type: 'extract',
        original: content,
        suggestion: 'Key point 1: ' + content.split('.')[0],
        reason: 'Extracted main idea',
      },
      {
        id: `mock-${Date.now()}-2`,
        type: 'extract',
        original: content,
        suggestion: 'Key point 2: Supporting detail',
        reason: 'Secondary insight',
      },
    ],
    rephrase: [
      {
        id: `mock-${Date.now()}-1`,
        type: 'rephrase',
        original: content,
        suggestion: content.charAt(0).toUpperCase() + content.slice(1),
        reason: 'Improved capitalization',
      },
      {
        id: `mock-${Date.now()}-2`,
        type: 'rephrase',
        original: content,
        suggestion: content.replace(/\s+/g, ' ').trim(),
        reason: 'Cleaned up spacing',
      },
    ],
  };

  return mockData[type] || mockData.rephrase;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'rephrase';
  const content = searchParams.get('content') || '';

  if (!content) {
    return NextResponse.json({ suggestions: [] });
  }

  // For GET requests, return mock data
  return NextResponse.json({
    suggestions: generateMockSuggestions(type, content),
  });
}