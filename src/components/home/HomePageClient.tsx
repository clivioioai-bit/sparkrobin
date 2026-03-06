"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Hero from '@/components/home/Hero'
import ToolsSection from '@/components/home/ToolsSection'
import Footer from '@/components/Footer'

const DemoGallery = dynamic(() => import('@/components/home/DemoGallery'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const PricingTeaser = dynamic(() => import('@/components/home/PricingTeaser'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const FaqTeaser = dynamic(() => import('@/components/home/FaqTeaser'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const Sora3Capabilities = dynamic(() => import('@/components/home/Sora3Capabilities'), {
  loading: () => <div className="h-96" />,
  ssr: true
});

function ErrorHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');
    const hashParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.substring(1)) : null;
    const hashError = hashParams?.get('error');
    const hashErrorDescription = hashParams?.get('error_description');

    const isDatabaseError =
      (error === 'server_error' && errorDescription?.includes('Database error saving new user')) ||
      (hashError === 'server_error' && hashErrorDescription?.includes('Database error saving new user'));

    if (isDatabaseError) {
      const fixUserRecord = async () => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .single();

            if (fetchError?.code === 'PGRST116' || !existingUser) {
              const { supabase: supabaseClient } = await import("@/lib/supabase");
              const { error: createError } = await supabaseClient
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || session.user.email,
                  subscription_plan: 'free',
                  subscription_status: 'active',
                  credits_balance: 3,
                  credits_total: 3,
                  credits_spent: 0,
                  credits_limit: 50,
                });

              if (createError) {
                try {
                  await fetch('/api/users/fix-missing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.user.id }),
                  });
                } catch (apiError) {
                  // silently fail
                }
              }
            }

            const { supabase: supabaseClient2 } = await import("@/lib/supabase");
            const { data: existingSub, error: subFetchError } = await supabaseClient2
              .from('user_subscriptions')
              .select('user_id')
              .eq('user_id', session.user.id)
              .single();

            if (subFetchError?.code === 'PGRST116' || !existingSub) {
              await supabaseClient2
                .from('user_subscriptions')
                .insert({ user_id: session.user.id });
            }

            const cleanUrl = window.location.pathname;
            router.replace(cleanUrl);

            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } catch (error) {
          // silently fail
        }
      };

      fixUserRecord();
    }
  }, [searchParams, router]);

  return null;
}

export default function HomePageClient() {
  return (
    <>
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>
      <main>
        <Hero />
        <ToolsSection />
        <Suspense fallback={<div className="h-96" />}>
          <Sora3Capabilities />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <DemoGallery />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <PricingTeaser />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <FaqTeaser />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
