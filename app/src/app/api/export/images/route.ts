import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import JSZip from 'jszip';

const LOGO_PATH = path.join(process.cwd(), 'skills', 'JSPPTXPotomac', 'brand-assets', 'logos', 'potomac-full-logo.png');
const GENERATOR_SCRIPT = path.join(process.cwd(), 'scripts', 'generate-pptx.js');
const NODE_MODULES = path.join(process.cwd(), 'node_modules');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outline, theme = 'classic', format = 'png', scale = 2 } = body;

    if (!outline || !outline.slides) {
      return NextResponse.json({ error: 'No outline provided' }, { status: 400 });
    }

    const validFormats = ['png', 'jpg', 'jpeg', 'svg'];
    if (!validFormats.includes(format.toLowerCase())) {
      return NextResponse.json({ error: `Invalid format. Use: ${validFormats.join(', ')}` }, { status: 400 });
    }

    const ts = Date.now();
    const tmpDir = os.tmpdir();
    const outputDir = path.join(tmpDir, `slides_${ts}`);
    
    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    // Generate slide images using html-to-image or similar
    // For now, we'll generate the PPTX and extract slide images using LibreOffice
    
    const outlinePath = path.join(tmpDir, `img_outline_${ts}.json`);
    const pptxPath = path.join(tmpDir, `potomac_img_${ts}.pptx`);

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

    // Try to extract images using LibreOffice
    let imageFiles: string[] = [];
    
    try {
      // LibreOffice can export to images with a trick
      // First convert to PDF, then extract images from PDF
      
      const pdfPath = path.join(tmpDir, `slides_${ts}.pdf`);
      execSync(
        `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${pptxPath}"`,
        { timeout: 60000, encoding: 'utf-8' }
      );

      // If PDF was created, we can use pdftoppm or similar to extract images
      if (fs.existsSync(pdfPath)) {
        try {
          // Try pdftoppm (part of poppler-utils)
          const outputPrefix = path.join(outputDir, 'slide');
          execSync(
            `pdftoppm -png -r ${150 * scale} "${pdfPath}" "${outputPrefix}"`,
            { timeout: 60000, encoding: 'utf-8' }
          );
          
          // Collect generated images
          const files = fs.readdirSync(outputDir);
          imageFiles = files
            .filter(f => f.endsWith('.png'))
            .map(f => path.join(outputDir, f))
            .sort();
          
        } catch (pdftoppmErr) {
          // pdftoppm not available
          console.log('pdftoppm not available for image extraction');
        }
        
        try { fs.unlinkSync(pdfPath); } catch {}
      }
    } catch (libreErr) {
      console.log('LibreOffice not available for image export');
    }

    // Cleanup
    try { fs.unlinkSync(outlinePath); } catch {}
    try { fs.unlinkSync(pptxPath); } catch {}

    if (imageFiles.length > 0) {
      // Create a ZIP file with all images
      const zip = new JSZip();
      
      for (let i = 0; i < imageFiles.length; i++) {
        const imageData = fs.readFileSync(imageFiles[i]);
        const fileName = `Slide_${String(i + 1).padStart(2, '0')}.${format}`;
        zip.file(fileName, imageData);
        
        // Cleanup individual image
        try { fs.unlinkSync(imageFiles[i]); } catch {}
      }
      
      // Try to remove output directory
      try { fs.rmdirSync(outputDir); } catch {}

      const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
      
      return NextResponse.json({
        zip_base64: zipContent.toString('base64'),
        filename: `${outline.title || 'Potomac'}_Slides.zip`,
        slide_count: imageFiles.length,
        format: format,
      });
    } else {
      // Return the PPTX if image extraction failed
      const pptxBuffer = fs.readFileSync(pptxPath);
      
      return NextResponse.json({
        pptx_base64: pptxBuffer.toString('base64'),
        filename: `${outline.title || 'Potomac'}_Presentation.pptx`,
        slide_count: outline.slides.length,
        note: 'Image export requires LibreOffice and pdftoppm. PPTX returned instead.',
      });
    }
  } catch (error) {
    console.error('Image export error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Export failed' }, { status: 500 });
  }
}