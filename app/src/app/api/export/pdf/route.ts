import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const LOGO_PATH = path.join(process.cwd(), 'skills', 'JSPPTXPotomac', 'brand-assets', 'logos', 'potomac-full-logo.png');
const GENERATOR_SCRIPT = path.join(process.cwd(), 'scripts', 'generate-pptx.js');
const NODE_MODULES = path.join(process.cwd(), 'node_modules');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline, theme = 'classic' } = body;

    if (!outline || !outline.slides) {
      return NextResponse.json({ error: 'No outline provided' }, { status: 400 });
    }

    const ts = Date.now();
    const tmpDir = os.tmpdir();
    const outlinePath = path.join(tmpDir, `pdf_outline_${ts}.json`);
    const pptxPath = path.join(tmpDir, `potomac_pdf_${ts}.pptx`);
    const pdfPath = path.join(tmpDir, `potomac_${ts}.pdf`);

    // Write outline
    fs.writeFileSync(outlinePath, JSON.stringify(outline), 'utf-8');

    // Generate PPTX first
    try {
      execSync(
        `node "${GENERATOR_SCRIPT}" "${outlinePath}" "${pptxPath}" "${LOGO_PATH}" "${theme}"`,
        { timeout: 60000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, env: { ...process.env, NODE_PATH: NODE_MODULES } }
      );
    } catch (err: unknown) {
      const errMsg = err && typeof err === 'object' ? String((err as Record<string, unknown>).stderr || '') : '';
      try { fs.unlinkSync(outlinePath); } catch {}
      return NextResponse.json({ error: `PPTX generation failed: ${errMsg.substring(0, 300)}` }, { status: 500 });
    }

    // Convert PPTX to PDF using LibreOffice (if available) or return instructions
    let pdfBase64: string | null = null;
    
    try {
      // Try using LibreOffice for conversion
      execSync(
        `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${pptxPath}"`,
        { timeout: 60000, encoding: 'utf-8' }
      );
      
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        pdfBase64 = pdfBuffer.toString('base64');
        fs.unlinkSync(pdfPath);
      }
    } catch (libreErr) {
      // LibreOffice not available - return the PPTX instead with instructions
      console.log('LibreOffice not available for PDF conversion');
    }

    // Cleanup
    try { fs.unlinkSync(outlinePath); } catch {}
    try { fs.unlinkSync(pptxPath); } catch {}

    if (pdfBase64) {
      return NextResponse.json({
        pdf_base64: pdfBase64,
        filename: `${outline.title || 'Potomac'}_Presentation.pdf`,
        slide_count: outline.slides.length,
      });
    } else {
      // Return PPTX if PDF conversion failed
      const pptxBuffer = fs.readFileSync(pptxPath);
      return NextResponse.json({
        pptx_base64: pptxBuffer.toString('base64'),
        filename: `${outline.title || 'Potomac'}_Presentation.pptx`,
        slide_count: outline.slides.length,
        note: 'PDF conversion requires LibreOffice. PPTX returned instead.',
      });
    }
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Export failed' }, { status: 500 });
  }
}