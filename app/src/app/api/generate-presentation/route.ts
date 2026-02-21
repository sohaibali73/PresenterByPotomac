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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const body = await request.json();
    const { outline, title, strategyName, presentationType, instructions, mode, theme, contextImages, experimental, chartsEnabled, chartDescription, assetNames } = body;
    // contextImages: Array of { name: string, dataUri: string }
    // assetNames: Array of string - names of selected library assets

    if (!outline) {
      return NextResponse.json({ error: 'No outline provided' }, { status: 400 });
    }

    // Build a rich, context-aware user message
    const modeInstruction = mode === 'reconstruct'
      ? 'RECONSTRUCT MODE: This is raw content (possibly a PDF dump or document). Extract all meaningful data — strategy names, fund tickers, performance numbers, process descriptions, risk metrics — and map them into the full Potomac deck arc. Preserve exact numbers and terminology from the source.'
      : 'GENERATE MODE: Transform this outline into a complete Potomac strategy presentation following the 5-act structure. Expand sparse content into compelling slides, and use precise data when provided.';

    const strategyContext = strategyName 
      ? `Strategy Name: ${strategyName} (use this as the section_tag on strategy-specific slides)`
      : '';

    const typeHint = presentationType === 'strategy' 
      ? 'This is a STRATEGY DECK — follow the full Bull Bear-style arc with process explanation, composites, allocations, performance data, and use cases.'
      : presentationType === 'research'
      ? 'This is a RESEARCH/EDUCATIONAL deck — emphasize process, methodology, and analytical frameworks.'
      : presentationType === 'overview'
      ? 'This is a COMPANY OVERVIEW deck — focus on Potomac\'s capabilities, team, and multi-strategy offerings.'
      : '';

    const experimentalInstruction = experimental ? `
🧪 EXPERIMENTAL MODE ACTIVE — FREESTYLE DESIGN
You are NOT required to follow the rigid 5-act template structure. Instead:
- Be CREATIVE with layout choices — mix and match layouts freely
- Use unexpected layout combinations that best serve the content
- Don't follow the standard arc (Hook→Process→Strategy→Application→Close) — organize slides in whatever order makes the most compelling narrative
- You can use multiple section_dividers, skip chart slides, use composite layouts back-to-back, etc.
- Feel free to use 8-20 slides — whatever serves the content best
- STILL use Potomac brand voice (ALL CAPS titles, bold/authoritative tone, financial precision)
- STILL use only the available layout types: cover, section_divider, three_pillars, chart, composite_three, composite_four, five_component_diagram, strategy_table, risk_statistics, use_cases, thank_you, disclosures, definitions
- STILL end with thank_you + disclosures + definitions
- The goal is a more UNIQUE, CREATIVE presentation that doesn't feel templated
` : '';

    // Build asset and chart context
    const assetContext = assetNames?.length > 0 ? `\nASSETS PROVIDED: The user has selected these assets from their library to use in the presentation: ${assetNames.join(', ')}. Reference these assets where appropriate in the slide content.` : '';
    const chartContext = chartsEnabled
      ? `\nCHARTS: The user has uploaded chart images. ${chartDescription ? `Chart description: "${chartDescription}".` : ''} Include chart slides (layout: "chart") in the presentation to reference these charts. Use the chart description as the chart_caption.`
      : '\nCHARTS: Do NOT include any chart slides (layout: "chart") — the user has not uploaded chart images.';

    const userMessage = `${modeInstruction}
${experimentalInstruction}
PRESENTATION DETAILS:
- Title: ${title || 'Potomac Presentation'}
${strategyContext ? `- ${strategyContext}` : ''}
${typeHint ? `- Deck Type: ${typeHint}` : ''}
${instructions ? `- Special Instructions: ${instructions}` : ''}
${assetContext}${chartContext}

═══ CONTENT TO TRANSFORM ═══
${outline.substring(0, 16000)}
═══ END CONTENT ═══

${experimental ? 'EXPERIMENTAL MODE: Freestyle the design creatively. Break the template mold while staying on-brand. Return ONLY the JSON object.' : 'Now produce the complete JSON outline following the Potomac deck formula. Remember: ALL titles UPPERCASE, 12-16 slides, full 5-act arc, end with thank_you + disclosures + definitions. Return ONLY the JSON object.'}`;

    console.log('Calling Claude with comprehensive brand guide...');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      system: POTOMAC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Claude response:', text.length, 'chars');

    // Extract JSON
    let jsonStr = text.trim();
    const fenced = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenced) jsonStr = fenced[1].trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse outline. Please try again.' }, { status: 500 });
    }

    let parsedOutline;
    try {
      parsedOutline = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON from Claude. Please try again.' }, { status: 500 });
    }

    // Ensure ending slides
    const slides = parsedOutline.slides || [];
    const layouts = slides.map((s: { layout?: string }) => s.layout);
    if (!layouts.includes('thank_you')) slides.push({ layout: 'thank_you' });
    if (!layouts.includes('disclosures')) slides.push({ layout: 'disclosures' });
    if (!layouts.includes('definitions')) slides.push({ layout: 'definitions' });
    parsedOutline.slides = slides;

    // Write outline JSON to temp file
    const ts = Date.now();
    const tmpDir = os.tmpdir();
    const outlinePath = path.join(tmpDir, `outline_${ts}.json`);
    const outputPath = path.join(tmpDir, `potomac_${ts}.pptx`);

    fs.writeFileSync(outlinePath, JSON.stringify(parsedOutline), 'utf-8');
    console.log('Outline saved:', outlinePath);

    // Run the fixed generator script
    let stdout = '';
    try {
      const themeName = theme || 'classic';
      stdout = execSync(
        `node "${GENERATOR_SCRIPT}" "${outlinePath}" "${outputPath}" "${LOGO_PATH}" "${themeName}"`,
        { timeout: 60000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, env: { ...process.env, NODE_PATH: NODE_MODULES } }
      );
      console.log('Generator completed, output:', stdout.length, 'chars');
    } catch (err: unknown) {
      let errMsg = '';
      if (err && typeof err === 'object') {
        errMsg = String((err as Record<string, unknown>).stderr || (err as Record<string, unknown>).stdout || '');
      }
      console.error('Generator error:', errMsg || err);
      try { fs.unlinkSync(outlinePath); } catch {}
      return NextResponse.json({ error: `Generation failed: ${errMsg.substring(0, 400)}` }, { status: 500 });
    }

    // Parse result
    let result;
    try {
      result = JSON.parse(stdout);
    } catch {
      if (fs.existsSync(outputPath)) {
        const buf = fs.readFileSync(outputPath);
        result = { pptx_base64: buf.toString('base64'), slide_count: slides.length, filename: `Potomac_${ts}.pptx`, slide_manifest: [] };
      } else {
        return NextResponse.json({ error: 'Generator produced no output.' }, { status: 500 });
      }
    }

    // Cleanup
    try { fs.unlinkSync(outlinePath); } catch {}
    try { fs.unlinkSync(outputPath); } catch {}

    const fname = `Potomac_${(strategyName || title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;

    return NextResponse.json({
      pptx_base64: result.pptx_base64,
      slide_manifest: result.slide_manifest || [],
      filename: fname,
      slide_count: result.slide_count || 0,
      outline: parsedOutline,
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
