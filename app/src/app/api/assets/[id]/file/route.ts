import { NextRequest, NextResponse } from 'next/server';
import { assetDb } from '@/lib/db';
import { readFile, stat } from 'fs/promises';

// GET /api/assets/[id]/file - Serve asset file
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
    
    // Read file
    const fileBuffer = await readFile(asset.file_path);
    
    // Set appropriate headers
    const headers: Record<string, string> = {
      'Content-Type': asset.mime_type || 'application/octet-stream',
      'Content-Length': String(asset.file_size || fileBuffer.length),
      'Cache-Control': 'public, max-age=31536000, immutable'
    };
    
    // For images, allow inline display
    if (asset.mime_type?.startsWith('image/')) {
      headers['Content-Disposition'] = `inline; filename="${asset.name}"`;
    } else {
      headers['Content-Disposition'] = `attachment; filename="${asset.name}"`;
    }
    
    return new NextResponse(fileBuffer, { headers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/assets/[id]/file - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = assetDb.delete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}