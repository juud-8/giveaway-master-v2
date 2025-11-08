import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopUserToken } from '@/lib/whop-sdk';

/**
 * Whop Context API Endpoint
 * Extracts user and company context from the Whop JWT token in headers
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Whop user token from headers
    const userToken = request.headers.get('x-whop-user-token');

    console.log('[Whop Context API] Headers:', {
      hasUserToken: !!userToken,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    });

    if (!userToken) {
      // If no token in headers, try to get from cookies or query params
      const cookies = request.cookies;
      const searchParams = request.nextUrl.searchParams;

      const cookieToken = cookies.get('whop-user-token')?.value;
      const queryToken = searchParams.get('token');

      console.log('[Whop Context API] Alternative sources:', {
        hasCookieToken: !!cookieToken,
        hasQueryToken: !!queryToken,
      });

      if (!cookieToken && !queryToken) {
        return NextResponse.json(
          {
            error: 'No Whop user token found',
            message: 'This endpoint must be called from within a Whop iframe with proper authentication',
            debug: {
              checkedHeaders: ['x-whop-user-token'],
              checkedCookies: ['whop-user-token'],
              checkedQuery: ['token'],
            },
          },
          { status: 401 }
        );
      }

      // Use cookie or query token as fallback
      const tokenToVerify = cookieToken || queryToken;
      if (tokenToVerify) {
        const context = await verifyWhopUserToken(tokenToVerify);
        console.log('[Whop Context API] Context from fallback:', context);

        return NextResponse.json({
          success: true,
          context,
          source: cookieToken ? 'cookie' : 'query',
        });
      }
    }

    // Verify and decode the token
    const context = await verifyWhopUserToken(userToken!);

    console.log('[Whop Context API] Context from header:', context);

    return NextResponse.json({
      success: true,
      context,
      source: 'header',
    });
  } catch (error) {
    console.error('[Whop Context API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify Whop user token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
