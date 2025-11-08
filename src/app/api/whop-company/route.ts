import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getCompanyDetails } from '@/lib/whop';

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get('identifier')?.trim();

  if (!identifier) {
    return NextResponse.json(
      { error: 'Missing required query parameter "identifier"' },
      { status: 400 }
    );
  }

  try {
    const company = await getCompanyDetails(identifier);

    return NextResponse.json(
      { company },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        return NextResponse.json(
          {
            error: `No Whop company found for identifier "${identifier}"`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Whop API request failed',
          status: error.response.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Unexpected error resolving Whop company identifier' },
      { status: 500 }
    );
  }
}

