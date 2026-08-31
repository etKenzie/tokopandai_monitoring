import { NextRequest, NextResponse } from 'next/server';

const WMS_API_URL = process.env.WMS_API_URL;
const WMS_API_KEY = process.env.WMS_API_KEY;

export const dynamic = 'force-dynamic';

/**
 * Proxies requests to the WMS API. The upstream requires credentials and only
 * allows its own origin via CORS, so the browser cannot call it directly.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!WMS_API_URL) {
    return NextResponse.json(
      { success: false, message: 'WMS_API_URL is not configured' },
      { status: 500 },
    );
  }

  const { path } = await params;
  const search = request.nextUrl.search;
  const url = `${WMS_API_URL}/${path.join('/')}${search}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (WMS_API_KEY) {
    headers['x-api-key'] = WMS_API_KEY;
  }

  try {
    const upstream = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
    const body = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `WMS API returned ${upstream.status} ${upstream.statusText}`,
          upstream: body.slice(0, 500),
        },
        { status: upstream.status },
      );
    }

    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reach WMS API',
      },
      { status: 502 },
    );
  }
}
