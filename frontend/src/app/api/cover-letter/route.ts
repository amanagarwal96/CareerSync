import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://careersync-backend:8000';
    
    console.log(`[Proxy] Forwarding cover letter request to: ${backendUrl}/api/cover-letter`);

    const response = await fetch(`${backendUrl}/api/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Backend generation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Proxy] Cover Letter Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to strategist engine. Verify backend is live.' },
      { status: 500 }
    );
  }
}
