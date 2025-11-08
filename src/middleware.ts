import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Enhanced headers for Whop iframe compatibility
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.delete('X-Frame-Options'); // Remove it entirely to let CSP handle framing

  // Comprehensive CSP for Whop iframe embedding
  const csp = [
    "frame-ancestors 'self' https://whop.com https://*.whop.com https://*.apps.whop.com",
    "default-src 'self' https://*.whop.com https://*.apps.whop.com",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.whop.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.whop.com https://*.apps.whop.com https://*.supabase.co wss://*.supabase.co",
    "font-src 'self' data:",
    "frame-src 'self' https://*.whop.com",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // CORS headers for Whop domains
  const origin = request.headers.get('origin');
  if (origin && (
    origin.includes('whop.com') ||
    origin.includes('apps.whop.com')
  )) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
