import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const LOGO_PATH = path.join(process.cwd(), 'skills', 'JSPPTXPotomac', 'brand-assets', 'logos', 'potomac-full-logo.png');
const GENERATOR_SCRIPT = path.join(process.cwd(), 'scripts', 'generate-pptx.js');
const NODE_MODULES = path.join(process.cwd(), 'node_modules');

const REFINE_SYSTEM = `You are a Potomac presentation editor. You receive the current presentation JSON outline and a user instruction to modify it.

Rules:
- Return the COMPLETE modified JSON outline (not just the changed parts)
- Keep ALL existing slides unless the user explicitly asks to remove them
- ALL titles must remain UPPERCASE
- Maintain the same JSON structure: { "title": "...", "strategy_name": "...", "slides": [...] }
- Always end with thank_you, disclosures, definitions
- Return ONLY valid JSON, no commentary

Available layouts: cover, section_divider, three_pillars, chart, composite_three, composite_four, five_component_diagram, strategy_table, risk_statistics, use_cases, thank_you, disclosures, definitions`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const client = new Anthropic({ apiKey });
    const body = await request.json();
    const { currentOutline, instruction, regenerate } = body;

    if (!currentOutline || !instruction) {
      return NextResponse.json({ error: 'Missing outline or instruction' }, { status: 400 });
    }

    const userMessage = `Current presentation JSON:
${JSON.stringify(currentOutline, null, 2)}

USER INSTRUCTION: ${instruction}

Return the complete modified JSON outline.`;

    console.log('Refining presentation:', instruction.substring(0, 80));
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      system: REFINE_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let jsonStr = text.trim();
    const fenced = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenced) jsonStr = fenced[1].trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse refined outline' }, { status: 500 });

    let refined;
    try { refined = JSON.parse(jsonMatch[0]); } catch {
      return NextResponse.json({ error: 'Invalid JSON from refinement' }, { status: 500 });
    }

    // If regenerate requested, build the PPTX
    if (regenerate) {
      const ts = Date.now();
      const tmpDir = os.tmpdir();
      const outlinePath = path.join(tmpDir, `refine_${ts}.json`);
      const outputPath = path.join(tmpDir, `potomac_refine_${ts}.pptx`);
      
      fs.writeFileSync(outlinePath, JSON.stringify(refined), 'utf-8');
      
      try {
        const stdout = execSync(
          `node "${GENERATOR_SCRIPT}" "${outlinePath}" "${outputPath}" "${LOGO_PATH}"`,
          { timeout: 60000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, env: { ...process.env, NODE_PATH: NODE_MODULES } }
        );
        const result = JSON.parse(stdout);
        try { fs.unlinkSync(outlinePath); } catch {}
        try { fs.unlinkSync(outputPath); } catch {}
        
        return NextResponse.json({
          outline: refined,
          pptx_base64: result.pptx_base64,
          slide_manifest: result.slide_manifest || [],
          slide_count: result.slide_count || 0,
        });
      } catch (err: unknown) {
        const errMsg = err && typeof err === 'object' ? String((err as Record<string, unknown>).stderr || '') : '';
        try { fs.unlinkSync(outlinePath); } catch {}
        return NextResponse.json({ error: `Regeneration failed: ${errMsg.substring(0, 300)}` }, { status: 500 });
      }
    }

    return NextResponse.json({ outline: refined });
  } catch (error: unknown) {
    console.error('Refine error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
