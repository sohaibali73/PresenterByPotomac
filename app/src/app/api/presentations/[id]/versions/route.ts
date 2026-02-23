import { NextRequest, NextResponse } from 'next/server';
import { presentationDb, versionDb } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - List all versions for a presentation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if presentation exists
    const presentation = presentationDb.getById(id);
    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    const versions = versionDb.getByPresentationId(id);
    
    return NextResponse.json({
      presentation_id: id,
      presentation_title: presentation.title,
      versions: versions.map(v => ({
        id: v.id,
        version_number: v.version_number,
        theme: v.theme,
        change_description: v.change_description,
        slide_count: v.outline?.slides?.length || 0,
        created_at: v.created_at,
      })),
      total_versions: versions.length,
    });
  } catch (error) {
    console.error('Failed to fetch versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

// POST - Create a new version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { outline, theme, change_description } = body;

    if (!outline) {
      return NextResponse.json({ error: 'Outline is required' }, { status: 400 });
    }

    // Check if presentation exists
    const presentation = presentationDb.getById(id);
    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    // Get next version number
    const versionNumber = versionDb.getNextVersionNumber(id);

    // Create version
    const version = versionDb.create({
      id: randomUUID(),
      presentation_id: id,
      version_number: versionNumber,
      outline,
      theme: theme || presentation.theme,
      change_description,
    });

    // Update the presentation's outline
    presentationDb.update(id, {
      outline,
      theme: theme || presentation.theme,
      slide_count: outline?.slides?.length || 0,
    });

    // Clean up old versions (keep last 20)
    versionDb.deleteOldVersions(id, 20);

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        version_number: version.version_number,
        theme: version.theme,
        change_description: version.change_description,
        created_at: version.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to create version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}