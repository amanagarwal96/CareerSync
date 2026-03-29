import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    console.log(`[Proxy] Forwarding resume score request to: ${backendUrl}/api/resume/score`);

    const response = await fetch(`${backendUrl}/api/resume/score`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Backend analysis failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to analysis engine. Verify backend is live.' },
      { status: 500 }
    );
  }
}
