import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const LOGO_PATH = path.join(process.cwd(), 'skills', 'JSPPTXPotomac', 'brand-assets', 'logos', 'potomac-full-logo.png');
const GENERATOR_SCRIPT = path.join(process.cwd(), 'scripts', 'generate-pptx.js');
const NODE_MODULES = path.join(process.cwd(), 'node_modules');

// Regenerate PPTX from a modified outline JSON (no AI call needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline, theme } = body;

    if (!outline || !outline.slides) {
      return NextResponse.json({ error: 'No outline provided' }, { status: 400 });
    }

    const ts = Date.now();
    const tmpDir = os.tmpdir();
    const outlinePath = path.join(tmpDir, `regen_${ts}.json`);
    const outputPath = path.join(tmpDir, `potomac_regen_${ts}.pptx`);

    fs.writeFileSync(outlinePath, JSON.stringify(outline), 'utf-8');

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
      return NextResponse.json({ error: `Generation failed: ${errMsg.substring(0, 300)}` }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch {
      if (fs.existsSync(outputPath)) {
        const buf = fs.readFileSync(outputPath);
        result = { pptx_base64: buf.toString('base64'), slide_count: outline.slides.length, slide_manifest: [] };
      } else {
        return NextResponse.json({ error: 'No output produced' }, { status: 500 });
      }
    }

    try { fs.unlinkSync(outlinePath); } catch {}
    try { fs.unlinkSync(outputPath); } catch {}

    const fname = `Potomac_${(outline.strategy_name || outline.title || 'Presentation').replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;

    return NextResponse.json({
      pptx_base64: result.pptx_base64,
      slide_manifest: result.slide_manifest || [],
      filename: fname,
      slide_count: result.slide_count || 0,
      outline,
    });
  } catch (error: unknown) {
    console.error('Regenerate error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
