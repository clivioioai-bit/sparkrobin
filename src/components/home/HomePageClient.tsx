"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Hero from '@/components/home/Hero'
import ToolsSection from '@/components/home/ToolsSection'
import Footer from '@/components/Footer'
import WhatIsVeo4Section from '@/components/home/WhatIsVeo4Section'

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
const Veo4KnowledgeSection = dynamic(() => import('@/components/home/Veo4KnowledgeSection'), {
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
            await fetch('/api/users/fix-missing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: session.user.id }),
            });

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
        <WhatIsVeo4Section />
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
          <Veo4KnowledgeSection />
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
