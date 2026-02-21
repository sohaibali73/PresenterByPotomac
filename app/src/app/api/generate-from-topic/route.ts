import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { POTOMAC_SYSTEM_PROMPT } from '@/lib/potomac-brand-guide';

const LOGO_PATH = path.join(process.cwd(), 'skills', 'JSPPTXPotomac', 'brand-assets', 'logos', 'potomac-full-logo.png');
const GENERATOR_SCRIPT = path.join(process.cwd(), 'scripts', 'generate-pptx.js');
const NODE_MODULES = path.join(process.cwd(), 'node_modules');

/**
 * POST /api/generate-from-topic
 * Generate a full presentation from just a topic/title — no outline needed.
 * Claude creates both the outline AND the content from scratch.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const body = await request.json();
    const { topic, presentationType, theme, instructions, experimental } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'No topic provided' }, { status: 400 });
    }

    const typeGuidance: Record<string, string> = {
      strategy: `Create a STRATEGY DECK following the full Potomac deck arc: process explanation with three pillars, composites showing how systems combine, allocation breakdown, performance comparison table, risk statistics, and advisor use cases. Invent plausible but clearly illustrative data points.`,
      research: `Create a RESEARCH/EDUCATIONAL deck emphasizing methodology, analytical frameworks, and data-driven insights. Focus on teaching the audience about this topic.`,
      overview: `Create a COMPANY OVERVIEW deck focusing on capabilities, team strengths, and multi-strategy offerings around this topic.`,
      pitch: `Create a PITCH DECK that persuasively presents this topic with clear value propositions, differentiation, and a call to action.`,
      outlook: `Create a MARKET OUTLOOK deck analyzing current conditions, forecasts, and strategic positioning around this topic.`,
      custom: `Create a comprehensive presentation about this topic following the Potomac deck formula.`,
    };

    const experimentalNote = experimental ? `
🧪 EXPERIMENTAL MODE: You are NOT required to follow the rigid 5-act template. FREESTYLE the design:
- Mix and match layouts creatively — use unexpected combinations
- Organize slides in whatever narrative order is most compelling
- Use 8-20 slides — whatever serves the content best
- Be bold and creative while staying within Potomac brand voice
- STILL use available layout types and end with thank_you + disclosures + definitions
` : '';

    const userMessage = `GENERATE FROM TOPIC MODE: Create a complete Potomac-branded presentation from scratch about the following topic. You must invent compelling content, plausible data points (marked as illustrative), and a complete narrative arc.
${experimentalNote}
TOPIC: ${topic}
${presentationType ? `DECK TYPE: ${typeGuidance[presentationType] || typeGuidance.custom}` : ''}
${instructions ? `SPECIAL INSTRUCTIONS: ${instructions}` : ''}

IMPORTANT:
${experimental ? '- Be CREATIVE and FREESTYLE the layout — break the template mold' : '- Create a full 12-16 slide deck following ALL 5 acts of the Potomac deck formula'}
- ALL titles must be UPPERCASE and bold declarative statements  
- Include specific (illustrative) data points, percentages, and metrics
- Make the content feel authoritative and institutional
- Mark any invented data with "For illustrative purposes only" disclaimers
- End with thank_you, disclosures, and definitions slides

Return ONLY the complete JSON outline object.`;

    console.log('Generating from topic:', topic);
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      system: POTOMAC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON
    let jsonStr = text.trim();
    const fenced = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenced) jsonStr = fenced[1].trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate presentation. Please try again.' }, { status: 500 });
    }

    let parsedOutline;
    try {
      parsedOutline = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Invalid response from AI. Please try again.' }, { status: 500 });
    }

    // Ensure ending slides
    const slides = parsedOutline.slides || [];
    const layouts = slides.map((s: { layout?: string }) => s.layout);
    if (!layouts.includes('thank_you')) slides.push({ layout: 'thank_you' });
    if (!layouts.includes('disclosures')) slides.push({ layout: 'disclosures' });
    if (!layouts.includes('definitions')) slides.push({ layout: 'definitions' });
    parsedOutline.slides = slides;

    // Generate PPTX
    const ts = Date.now();
    const tmpDir = os.tmpdir();
    const outlinePath = path.join(tmpDir, `topic_${ts}.json`);
    const outputPath = path.join(tmpDir, `potomac_topic_${ts}.pptx`);

    fs.writeFileSync(outlinePath, JSON.stringify(parsedOutline), 'utf-8');

    let stdout = '';
    try {
      const themeName = theme || 'classic';
      stdout = execSync(
        `node "${GENERATOR_SCRIPT}" "${outlinePath}" "${outputPath}" "${LOGO_PATH}" "${themeName}"`,
        { timeout: 60000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, env: { ...process.env, NODE_PATH: NODE_MODULES } }
      );
    } catch (err: unknown) {
      const errMsg = err && typeof err === 'object' ? String((err as Record<string, unknown>).stderr || '') : '';
      try { fs.unlinkSync(outlinePath); } catch {}
      return NextResponse.json({ error: `Generation failed: ${errMsg.substring(0, 400)}` }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch {
      if (fs.existsSync(outputPath)) {
        const buf = fs.readFileSync(outputPath);
        result = { pptx_base64: buf.toString('base64'), slide_count: slides.length, slide_manifest: [] };
      } else {
        return NextResponse.json({ error: 'Generator produced no output.' }, { status: 500 });
      }
    }

    try { fs.unlinkSync(outlinePath); } catch {}
    try { fs.unlinkSync(outputPath); } catch {}

    const safeTopic = topic.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 40).trim().replace(/\s+/g, '_');
    const fname = `Potomac_${safeTopic}.pptx`;

    return NextResponse.json({
      pptx_base64: result.pptx_base64,
      slide_manifest: result.slide_manifest || [],
      filename: fname,
      slide_count: result.slide_count || 0,
      outline: parsedOutline,
    });
  } catch (error: unknown) {
    console.error('Topic generation error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
