import { NextRequest, NextResponse } from 'next/server';
import { presentationDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const presDir = path.join(process.cwd(), 'data', 'presentations');
if (!existsSync(presDir)) {
  mkdir(presDir, { recursive: true }).catch(() => {});
}

// GET /api/presentations - List all saved presentations
export async function GET() {
  try {
    const presentations = presentationDb.getAll(50);
    return NextResponse.json({ presentations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/presentations - Save a generated presentation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, outline, theme, slide_count, filename, pptx_base64 } = body;

    const id = randomUUID();

    // Save PPTX file to disk
    let file_path = '';
    if (pptx_base64) {
      const pptxFilename = `${id}.pptx`;
      file_path = path.join(presDir, pptxFilename);
      const buffer = Buffer.from(pptx_base64, 'base64');
      await writeFile(file_path, buffer);
    }

    const presentation = presentationDb.create({
      id,
      title: title || filename || 'Untitled Presentation',
      outline: outline || null,
      theme: theme || 'classic',
      file_path,
      slide_count: slide_count || 0
    });

    return NextResponse.json({ presentation: { ...presentation, filename } });
  } catch (error: any) {
    console.error('Save presentation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
