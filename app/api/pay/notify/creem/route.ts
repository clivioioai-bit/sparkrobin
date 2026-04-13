import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Creem payments are deprecated. Dodo Payments is the only active provider.',
      provider: 'dodo',
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Creem webhooks are deprecated. Disable this webhook in Creem and use Dodo Payments only.',
      provider: 'dodo',
    },
    { status: 410 }
  );
}
