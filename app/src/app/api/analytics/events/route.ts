import { NextRequest, NextResponse } from 'next/server';
import { getRecentEvents } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const events = getRecentEvents(limit);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to get recent events:', error);
    return NextResponse.json({ error: 'Failed to get events' }, { status: 500 });
  }
}