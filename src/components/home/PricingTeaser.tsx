"use client";

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import AuthModal from '@/components/AuthModal';
import { useTranslations } from 'next-intl';

const SubscriptionPlans = dynamic(() => import('@/components/pricing/SubscriptionPlans'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-card p-5">
          <div className="space-y-4 animate-pulse">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="mx-auto h-5 w-24 rounded bg-muted" />
                <div className="mx-auto h-10 w-32 rounded bg-muted" />
                <div className="mx-auto h-4 w-28 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-8 rounded-lg bg-muted" />
              <div className="h-8 rounded-lg bg-muted" />
              <div className="h-8 rounded-lg bg-muted" />
            </div>
            <div className="h-10 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  ),
});

const PricingTeaser = () => {
  const t = useTranslations('pricing');
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <section className="py-20 sm:py-28 bg-card/30 backdrop-blur-xl relative overflow-hidden">
      {/* Subtle top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            VEO 4 Pricing
          </h2>
          <p className="text-base sm:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
            {t('teaserSubtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <SubscriptionPlans
          variant="teaser"
          defaultInterval="year"
          onRequireAuth={() => setShowAuthModal(true)}
        />
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </section>
  );
};

export default PricingTeaser;
