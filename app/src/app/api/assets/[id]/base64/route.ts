import { NextRequest, NextResponse } from 'next/server';
import { assetDb } from '@/lib/db';
import { readFile } from 'fs/promises';

/**
 * GET /api/assets/[id]/base64 - Get asset file as base64 string
 * Used by the generator to embed images in PPTX files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = assetDb.getById(id);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(asset.file_path);
    const base64 = fileBuffer.toString('base64');
    const dataUri = `data:${asset.mime_type || 'image/png'};base64,${base64}`;

    return NextResponse.json({
      id: asset.id,
      name: asset.name,
      mime_type: asset.mime_type,
      base64,
      dataUri,
      width: asset.width,
      height: asset.height,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
