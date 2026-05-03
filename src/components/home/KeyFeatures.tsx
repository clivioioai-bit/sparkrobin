"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { X, DollarSign, Zap, Film, Image, Share2, Sparkles } from 'lucide-react';

const KeyFeatures = () => {
  const t = useTranslations('keyFeatures');
  
  const features = [
    {
      icon: X,
      title: t('noWatermark.title'),
      description: t('noWatermark.description')
    },
    {
      icon: DollarSign,
      title: t('bestCostPerformance.title'),
      description: t('bestCostPerformance.description')
    },
    {
      icon: Zap,
      title: t('fastConvenient.title'),
      description: t('fastConvenient.description')
    },
    {
      icon: Film,
      title: t('textToVideoImageToVideo.title'),
      description: t('textToVideoImageToVideo.description')
    },
    {
      icon: Image,
      title: t('socialReady.title'),
      description: t('socialReady.description')
    },
    {
      icon: Share2,
      title: t('bestCostPerformance.title'),
      description: t('bestCostPerformance.description')
    }
  ];

  return (
    <section className="py-24 gradient-bg dark:gradient-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section 1: Header */}
        <div className="mb-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 mb-8 shadow-glow">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 gradient-text dark:gradient-text-dark">
            {t('title')}
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-8 border-2 border-border/50 hover:border-primary/60 transition-all duration-300 hover:shadow-glow hover:-translate-y-2 glass-card group">
                <div className="flex items-center gap-5 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-primary/15 group-hover:bg-primary/25 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Section 4: Try Sora3 Free */}
        <div className="text-center">
          <Card className="p-12 lg:p-16 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/30 shadow-glow">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 gradient-text dark:gradient-text-dark">
              {t('trySora3Free.title')}
            </h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
              {t('trySora3Free.description')}
            </p>
            <Button
              size="lg"
              asChild
              className="text-lg px-14 py-7 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300"
            >
              <Link href="/spark-robin-text-to-video">
                {t('trySora3Free.startGenerating')}
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
