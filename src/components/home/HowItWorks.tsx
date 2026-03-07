"use client";

import React from 'react';
import { Palette, Sliders, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

const HowItWorks = () => {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      number: '1',
      icon: Palette,
      title: t('step1.title'),
      description: t('step1.description')
    },
    {
      number: '2',
      icon: Sliders,
      title: t('step2.title'),
      description: t('step2.description')
    },
    {
      number: '3',
      icon: Play,
      title: t('step3.title'),
      description: t('step3.description')
    }
  ];

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center group relative">
                {/* Step Number */}
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white flex items-center justify-center font-bold text-xl sm:text-2xl">
                    {step.number}
                  </div>

                  {/* Icon badge */}
                  <div className="absolute -bottom-2 -right-2 sm:right-[calc(50%-2.5rem-0.5rem)] w-9 h-9 sm:w-10 sm:h-10 bg-background border border-white/[0.1] rounded-xl flex items-center justify-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                  </div>

                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 sm:top-10 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-px bg-white/[0.06] rtl:right-[calc(100%+0.5rem)] rtl:left-auto">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 rtl:left-0 rtl:right-auto">
                        <div className="w-1.5 h-1.5 bg-white/[0.1] rounded-full" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-white/80 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-white/35 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
