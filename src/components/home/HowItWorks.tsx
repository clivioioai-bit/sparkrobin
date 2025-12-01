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
    <section className="py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center group">
                {/* Step Number Circle */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-black rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-card border-2 border-background rounded-full flex items-center justify-center shadow-md">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>

                  {/* Connecting Line (except last step) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(100%+1rem)] w-full h-0.5 bg-primary/50 rtl:right-[calc(100%+1rem)] rtl:left-auto">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 rtl:left-0 rtl:right-auto">
                        <div className="w-2 h-2 bg-primary/50 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed text-sm">
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
