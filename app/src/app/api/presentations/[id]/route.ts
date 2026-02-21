import { NextRequest, NextResponse } from 'next/server';
import { presentationDb } from '@/lib/db';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// GET /api/presentations/[id] - Get presentation with PPTX data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');

    const presentation = presentationDb.getById(id);
    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    // If download requested, serve the PPTX file
    if (download && presentation.file_path && existsSync(presentation.file_path)) {
      const fileBuffer = await readFile(presentation.file_path);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${presentation.title}.pptx"`,
        }
      });
    }

    // Otherwise return JSON with base64 PPTX
    let pptx_base64 = '';
    if (presentation.file_path && existsSync(presentation.file_path)) {
      const fileBuffer = await readFile(presentation.file_path);
      pptx_base64 = fileBuffer.toString('base64');
    }

    return NextResponse.json({
      presentation: {
        ...presentation,
        pptx_base64
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/presentations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = presentationDb.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
