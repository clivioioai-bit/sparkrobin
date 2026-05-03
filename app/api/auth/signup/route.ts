import { NextRequest, NextResponse } from 'next/server';
import { ensureProvisionedUser } from '@/lib/account-provisioning';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, authRateLimiter } from '@/lib/rate-limiter';

export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (5 attempts per 15 minutes per IP)
    const rateLimitResponse = await rateLimit(request, authRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        full_name: fullName || '',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    let userData;
    try {
      userData = await ensureProvisionedUser({
        id: authData.user.id,
        email,
        user_metadata: {
          full_name: fullName || '',
        },
      });
    } catch (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        subscription_plan: userData.subscription_plan,
        credits_balance: userData.credits_balance ?? 0,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
