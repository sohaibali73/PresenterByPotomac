import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, trackEvent } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  try {
    const summary = getAnalyticsSummary(days);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, event_data, user_id, session_id } = body;

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    }

    // Get client info
    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
    const user_agent = request.headers.get('user-agent') || undefined;

    trackEvent({
      event_type,
      event_data,
      user_id,
      session_id,
      ip_address,
      user_agent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track event:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}