import { NextRequest, NextResponse } from 'next/server';

/**
 * Whop Experience API Endpoint
 * This endpoint is called by Whop to verify the app is accessible
 * Returns 200 OK to confirm the app is ready
 */
export async function GET(request: NextRequest) {
  // Get origin header to validate the request is from Whop
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const isWhopRequest =
    origin?.includes('whop.com') ||
    origin?.includes('apps.whop.com') ||
    referer?.includes('whop.com') ||
    referer?.includes('apps.whop.com');

  return NextResponse.json(
    {
      status: 'ok',
      message: 'Giveaway Master is ready',
      iframe_compatible: true,
      timestamp: new Date().toISOString(),
      whop_verified: isWhopRequest,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
