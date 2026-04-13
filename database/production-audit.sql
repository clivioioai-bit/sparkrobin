-- Production audit for user sync, subscriptions, payments, and credits.
-- Run each query block independently in Supabase SQL Editor.

-- =========================================================
-- 1. User Sync
-- =========================================================

-- 1.1 Count auth vs public users
select 'auth.users' as source, count(*) as total from auth.users
union all
select 'public.users' as source, count(*) as total from public.users;

-- 1.2 Users present in auth but missing in public
select
  au.id,
  au.email,
  au.created_at
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
order by au.created_at desc
limit 100;

-- 1.3 Users present in public but missing in auth
select
  pu.id,
  pu.email,
  pu.created_at
from public.users pu
left join auth.users au on au.id = pu.id
where au.id is null
order by pu.created_at desc
limit 100;

-- 1.4 Recent 20 users and whether sync looks healthy
select
  au.id,
  au.email,
  au.created_at as auth_created_at,
  pu.id as public_user_id,
  pu.subscription_plan,
  pu.subscription_status,
  pu.credits_balance,
  pu.flex_credits_balance,
  pu.subscription_credits_balance
from auth.users au
left join public.users pu on pu.id = au.id
order by au.created_at desc
limit 20;

-- =========================================================
-- 2. Subscription Audit
-- =========================================================

-- 2.1 Recent subscriptions
select
  us.id,
  us.user_id,
  pu.email,
  us.plan_type,
  us.plan_status,
  us.status,
  us.subscription_id,
  us.creem_subscription_id,
  us.current_period_start,
  us.current_period_end,
  us.created_at,
  us.updated_at
from public.user_subscriptions us
left join public.users pu on pu.id = us.user_id
order by us.created_at desc
limit 100;

-- 2.2 Users marked subscribed in public.users but with no subscription record
select
  pu.id,
  pu.email,
  pu.subscription_plan,
  pu.subscription_status,
  pu.subscription_end_date
from public.users pu
left join public.user_subscriptions us on us.user_id = pu.id
where pu.subscription_plan <> 'free'
  and coalesce(pu.subscription_status, '') = 'active'
  and us.id is null
order by pu.updated_at desc
limit 100;

-- 2.3 Subscription records whose user top-level state disagrees
select
  pu.id,
  pu.email,
  pu.subscription_plan as user_plan,
  pu.subscription_status as user_status,
  us.plan_type as subscription_plan,
  coalesce(us.plan_status, us.status) as subscription_status,
  us.current_period_end,
  us.updated_at
from public.user_subscriptions us
join public.users pu on pu.id = us.user_id
where coalesce(pu.subscription_plan, 'free') <> coalesce(us.plan_type, 'free')
   or coalesce(pu.subscription_status, '') <> coalesce(us.plan_status, us.status, '')
order by us.updated_at desc
limit 100;

-- =========================================================
-- 3. Payment Audit
-- =========================================================

-- 3.1 Recent payments
select
  p.id,
  p.user_id,
  pu.email,
  p.subscription_id,
  p.payment_id,
  p.external_payment_id,
  p.creem_payment_id,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  p.created_at
from public.payments p
left join public.users pu on pu.id = p.user_id
order by p.created_at desc
limit 100;

-- 3.2 Payments missing external identifier
select
  p.id,
  pu.email,
  p.payment_id,
  p.external_payment_id,
  p.creem_payment_id,
  p.status,
  p.payment_method,
  p.created_at
from public.payments p
left join public.users pu on pu.id = p.user_id
where coalesce(p.external_payment_id, p.creem_payment_id, p.payment_id) is null
order by p.created_at desc
limit 100;

-- 3.3 Succeeded payments with no matching credit transaction by paymentId metadata
select
  p.id,
  pu.email,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  coalesce(p.external_payment_id, p.creem_payment_id, p.payment_id) as effective_payment_id,
  p.created_at
from public.payments p
left join public.users pu on pu.id = p.user_id
where p.status = 'succeeded'
  and not exists (
    select 1
    from public.credit_transactions ct
    where ct.user_id = p.user_id
      and ct.metadata->>'paymentId' = coalesce(p.external_payment_id, p.creem_payment_id, p.payment_id)
  )
order by p.created_at desc
limit 100;

-- =========================================================
-- 4. Credit Audit
-- =========================================================

-- 4.1 Recent credit transactions
select
  ct.id,
  ct.user_id,
  pu.email,
  ct.amount,
  ct.transaction_type,
  ct.reason,
  ct.metadata,
  ct.created_at
from public.credit_transactions ct
left join public.users pu on pu.id = ct.user_id
order by ct.created_at desc
limit 100;

-- 4.2 Users with inconsistent credit totals
select
  pu.id,
  pu.email,
  pu.credits_balance,
  pu.subscription_credits_balance,
  pu.flex_credits_balance,
  (coalesce(pu.subscription_credits_balance, 0) + coalesce(pu.flex_credits_balance, 0)) as computed_balance,
  pu.credits_total,
  pu.credits_spent,
  pu.updated_at
from public.users pu
where coalesce(pu.credits_balance, 0) <> (coalesce(pu.subscription_credits_balance, 0) + coalesce(pu.flex_credits_balance, 0))
order by pu.updated_at desc
limit 100;

-- 4.3 Users with negative balances
select
  id,
  email,
  credits_balance,
  subscription_credits_balance,
  flex_credits_balance,
  credits_total,
  credits_spent,
  updated_at
from public.users
where coalesce(credits_balance, 0) < 0
   or coalesce(subscription_credits_balance, 0) < 0
   or coalesce(flex_credits_balance, 0) < 0
order by updated_at desc
limit 100;

-- 4.4 Duplicate subscription reset candidates
select
  ct.user_id,
  pu.email,
  ct.metadata->>'subscriptionId' as subscription_id,
  ct.metadata->>'currentPeriodEnd' as current_period_end,
  count(*) as duplicate_count,
  min(ct.created_at) as first_seen,
  max(ct.created_at) as last_seen
from public.credit_transactions ct
left join public.users pu on pu.id = ct.user_id
where ct.reason = 'subscription_period_reset'
group by ct.user_id, pu.email, ct.metadata->>'subscriptionId', ct.metadata->>'currentPeriodEnd'
having count(*) > 1
order by last_seen desc
limit 100;

-- =========================================================
-- 5. Kelly-specific spot check
-- =========================================================

select
  pu.id,
  pu.email,
  pu.subscription_plan,
  pu.subscription_status,
  pu.credits_balance,
  pu.subscription_credits_balance,
  pu.flex_credits_balance,
  pu.credits_total,
  pu.credits_spent,
  pu.created_at,
  pu.updated_at
from public.users pu
where lower(pu.email) = 'kellyzhaoning@gmail.com';

select
  us.id,
  us.plan_type,
  us.plan_status,
  us.status,
  us.subscription_id,
  us.current_period_end,
  us.created_at
from public.user_subscriptions us
join public.users pu on pu.id = us.user_id
where lower(pu.email) = 'kellyzhaoning@gmail.com'
order by us.created_at desc
limit 20;

select
  p.id,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  coalesce(p.external_payment_id, p.creem_payment_id, p.payment_id) as effective_payment_id,
  p.created_at
from public.payments p
join public.users pu on pu.id = p.user_id
where lower(pu.email) = 'kellyzhaoning@gmail.com'
order by p.created_at desc
limit 20;

select
  ct.id,
  ct.amount,
  ct.transaction_type,
  ct.reason,
  ct.metadata,
  ct.created_at
from public.credit_transactions ct
join public.users pu on pu.id = ct.user_id
where lower(pu.email) = 'kellyzhaoning@gmail.com'
order by ct.created_at desc
limit 20;
