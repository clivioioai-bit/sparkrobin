import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ensureProvisionedUser, getDefaultUserSummary } from '@/lib/account-provisioning';
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

    const fallback = {
      ...getDefaultUserSummary(user),
      generation_count: 0,
      subscription: null,
    };
    let summary: AccountSummary = fallback;
    let adminClient;

    try {
      adminClient = getSupabaseAdmin();
    } catch (error) {
      console.warn('[API] account summary admin client unavailable, using fallback:', error);
    }

    if (adminClient) {
      try {
        const userRow = await ensureProvisionedUser(user);
        summary = {
          ...summary,
          ...userRow,
          subscription_plan: userRow.subscription_plan || 'free',
          subscription_status: userRow.subscription_status || 'active',
          credits_balance: Number(userRow.credits_balance || 0),
          credits_total: Number(userRow.credits_total || 0),
          credits_spent: Number(userRow.credits_spent || 0),
        };
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
          const subscriptionPlan = String(subscriptionRow.plan_type || 'free');
          const subscriptionStatus = String(subscriptionRow.plan_status || subscriptionRow.status || '');
          if (subscriptionPlan !== 'free' && subscriptionStatus) {
            summary.subscription_plan = subscriptionPlan;
            summary.subscription_status = subscriptionStatus;
            summary.subscription_end_date = (subscriptionRow.current_period_end as string | null) || summary.subscription_end_date;
          }
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
