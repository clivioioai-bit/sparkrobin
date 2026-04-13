import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectParams = new URLSearchParams(searchParams);
  redirectParams.set('provider', 'dodo');
  redirectParams.set('legacy_provider', 'creem');

  return NextResponse.redirect(new URL(`/pricing?${redirectParams.toString()}`, request.url));
}
