import { NextRequest, NextResponse } from 'next/server';
import { assetDb, Asset } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
if (!existsSync(uploadsDir)) {
  mkdir(uploadsDir, { recursive: true }).catch(() => {});
}

// GET /api/assets - List all assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const category = searchParams.get('category') || undefined;
    
    const assets = assetDb.getAll(type, category);
    
    // Convert file paths to public URLs
    const assetsWithUrls = assets.map(asset => ({
      ...asset,
      url: `/api/assets/${asset.id}/file`
    }));
    
    return NextResponse.json({ assets: assetsWithUrls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/assets - Upload new asset
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const type = formData.get('type') as Asset['type'] || 'image';
    const category = formData.get('category') as string || 'general';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Generate unique ID and filename
    const id = randomUUID();
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${id}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Get image dimensions if it's an image
    let width: number | undefined;
    let height: number | undefined;
    if (file.type.startsWith('image/')) {
      try {
        // Simple image dimension detection
        const { default: sharp } = await import('sharp');
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch (e) {
        // Sharp not available, skip dimensions
      }
    }
    
    // Create asset record
    const asset = assetDb.create({
      id,
      name: name || file.name,
      type,
      category,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      width,
      height
    });
    
    return NextResponse.json({
      asset: {
        ...asset,
        url: `/api/assets/${asset.id}/file`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}