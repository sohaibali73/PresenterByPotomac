import { NextRequest, NextResponse } from 'next/server';
import { templateDb, Template, SlideConfig } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const layoutType = searchParams.get('layout_type') || undefined;
    
    const templates = templateDb.getAll(category, layoutType);
    
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Template POST body keys:', Object.keys(body));
    
    const name = body.name || 'Untitled Template';
    const description = body.description || '';
    const category = body.category || 'custom';
    const layout_type = body.layout_type || 'content';
    const is_public = body.is_public || false;
    
    // Handle slide_config - it might be nested or at the top level
    let slide_config = body.slide_config;
    if (!slide_config) {
      // Maybe the whole body IS the template config
      slide_config = {
        background: body.background || { color: '#212121' },
        elements: body.elements || []
      };
    }
    
    // Ensure elements is an array
    if (!slide_config.elements || !Array.isArray(slide_config.elements)) {
      slide_config.elements = [];
    }
    
    // Ensure background exists
    if (!slide_config.background) {
      slide_config.background = { color: '#212121' };
    }
    
    const id = randomUUID();
    
    const template = templateDb.create({
      id,
      name,
      description,
      category,
      layout_type,
      slide_config: slide_config as SlideConfig,
      is_public
    });
    
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Template save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
