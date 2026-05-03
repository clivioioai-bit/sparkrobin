import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET() {
  return NextResponse.json(
    {
      error: 'Creem webhook endpoint has been retired. Dodo Payments is the only active provider.',
      provider: 'dodo',
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Creem webhook endpoint has been retired. Disable Creem webhooks and use /api/webhooks/dodo only.',
      provider: 'dodo',
    },
    { status: 410 }
  );
}
