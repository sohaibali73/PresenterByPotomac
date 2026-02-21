import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const isConfigured = !!apiKey && apiKey !== 'your_key_here';
  return NextResponse.json({ configured: isConfigured });
}
