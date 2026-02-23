import { NextRequest, NextResponse } from 'next/server';
import { versionDb, presentationDb } from '@/lib/db';

// GET - Get a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    const { versionId } = params;
    
    const version = versionDb.getById(versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
      version: {
        id: version.id,
        presentation_id: version.presentation_id,
        version_number: version.version_number,
        outline: version.outline,
        theme: version.theme,
        change_description: version.change_description,
        created_at: version.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch version:', error);
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
  }
}

// POST - Restore a version (make it the current version)
export async function POST(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    const { versionId } = params;
    const body = await request.json();
    const { create_backup = true } = body;
    
    const version = versionDb.getById(versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const presentation = presentationDb.getById(version.presentation_id);
    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    // Optionally create a backup of the current state before restoring
    if (create_backup && presentation.outline) {
      const backupVersionNumber = versionDb.getNextVersionNumber(version.presentation_id);
      versionDb.create({
        id: crypto.randomUUID(),
        presentation_id: version.presentation_id,
        version_number: backupVersionNumber,
        outline: presentation.outline,
        theme: presentation.theme,
        change_description: `Backup before restoring version ${version.version_number}`,
      });
    }

    // Update the presentation with the restored version
    presentationDb.update(version.presentation_id, {
      outline: version.outline,
      theme: version.theme,
      slide_count: version.outline?.slides?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: `Restored to version ${version.version_number}`,
      restored_version: {
        id: version.id,
        version_number: version.version_number,
        outline: version.outline,
        theme: version.theme,
      },
    });
  } catch (error) {
    console.error('Failed to restore version:', error);
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }
}

// DELETE - Delete a specific version
export async function DELETE(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    const { versionId } = params;
    
    const deleted = versionDb.delete(versionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete version:', error);
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
  }
}