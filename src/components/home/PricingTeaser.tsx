"use client";

import React, { useState } from 'react';
import AuthModal from '@/components/AuthModal';
import SubscriptionPlans from '@/components/pricing/SubscriptionPlans';
import { useTranslations } from 'next-intl';

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
            {t('chooseYourPlan')}
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
