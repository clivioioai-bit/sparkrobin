import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

type AccountSummary = {
  id: string;
  email: string;
  full_name: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_end_date: string | null;
  credits_balance: number;
  credits_total: number;
  credits_spent: number;
  created_at: string;
  updated_at: string;
  generation_count: number;
  subscription: Record<string, unknown> | null;
};

function defaultSummaryFromAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): AccountSummary {
  const now = new Date().toISOString();
  return {
    id: user.id,
    email: user.email || '',
    full_name: String(user.user_metadata?.full_name || user.email || ''),
    subscription_plan: 'free',
    subscription_status: 'active',
    subscription_end_date: null,
    credits_balance: 0,
    credits_total: 0,
    credits_spent: 0,
    created_at: now,
    updated_at: now,
    generation_count: 0,
    subscription: null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const fallback = defaultSummaryFromAuthUser(user);
    let summary: AccountSummary = fallback;
    let adminClient;

    try {
      adminClient = getSupabaseAdmin();
    } catch (error) {
      console.warn('[API] account summary admin client unavailable, using fallback:', error);
    }

    if (adminClient) {
      try {
        const { data: userRow, error: userError } = await adminClient
          .from('users')
          .select('id, email, full_name, subscription_plan, subscription_status, subscription_end_date, credits_balance, credits_total, credits_spent, created_at, updated_at')
          .eq('id', user.id)
          .maybeSingle();

        if (userError) {
          console.warn('[API] account summary users lookup failed:', {
            code: (userError as any)?.code,
            message: (userError as any)?.message,
          });
        } else if (!userRow) {
          const { data: createdUser, error: createError } = await adminClient
            .from('users')
            .upsert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email || '',
              subscription_plan: 'free',
              subscription_status: 'active',
              credits_balance: 0,
              credits_total: 0,
              credits_spent: 0,
            }, { onConflict: 'id' })
            .select('id, email, full_name, subscription_plan, subscription_status, subscription_end_date, credits_balance, credits_total, credits_spent, created_at, updated_at')
            .single();

          if (createError) {
            console.warn('[API] account summary user auto-provision failed:', createError);
          } else if (createdUser) {
            summary = {
              ...summary,
              ...createdUser,
              subscription_plan: createdUser.subscription_plan || 'free',
              subscription_status: createdUser.subscription_status || 'active',
              credits_balance: Number(createdUser.credits_balance || 0),
              credits_total: Number(createdUser.credits_total || 0),
              credits_spent: Number(createdUser.credits_spent || 0),
            };
          }
        } else {
          summary = {
            ...summary,
            ...userRow,
            subscription_plan: userRow.subscription_plan || 'free',
            subscription_status: userRow.subscription_status || 'active',
            credits_balance: Number(userRow.credits_balance || 0),
            credits_total: Number(userRow.credits_total || 0),
            credits_spent: Number(userRow.credits_spent || 0),
          };
        }
      } catch (error) {
        console.warn('[API] account summary user fetch failed unexpectedly:', error);
      }

      try {
        const { data: subscriptionRow } = await adminClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionRow) {
          summary.subscription = subscriptionRow;
        }
      } catch (error) {
        console.warn('[API] account summary subscription lookup failed:', error);
      }

      try {
        const { count, error: countError } = await adminClient
          .from('video_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!countError) {
          summary.generation_count = count || 0;
        }
      } catch (error) {
        console.warn('[API] account summary generation count failed:', error);
      }
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[API] account summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
