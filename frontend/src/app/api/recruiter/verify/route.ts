import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // Use server-side URL (resolves Docker 'backend' hostname correctly)
    const backendUrl = process.env.BACKEND_URL_INTERNAL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://careersync-backend:8000';

    console.log(`[Proxy] Forwarding recruiter-verify request to: ${backendUrl}/api/recruiter-verify`);

    const response = await fetch(`${backendUrl}/api/recruiter-verify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Recruiter verification failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Proxy] Recruiter Verify Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to verification engine. Ensure backend is live.' },
      { status: 500 }
    );
  }
}
