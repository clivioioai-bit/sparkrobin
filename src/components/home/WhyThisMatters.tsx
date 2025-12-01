"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { X, DollarSign, Film, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Convert hex to rgba with opacity
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const WhyThisMatters = () => {
  const t = useTranslations('whyThisMatters');
  
  const features = [
    {
      icon: X,
      title: t('noWatermark.title'),
      description: t('noWatermark.description'),
      color: "#4A90E2"
    },
    {
      icon: DollarSign,
      title: t('costPerformance.title'),
      description: t('costPerformance.description'),
      color: "#3DBE7A"
    },
    {
      icon: Film,
      title: t('multiModel.title'),
      description: t('multiModel.description'),
      color: "#8F6AF5"
    },
    {
      icon: Share2,
      title: t('storyboard.title'),
      description: t('storyboard.description'),
      color: "#F1746C"
    }
  ];

  return (
    <section className="py-20 gradient-bg dark:gradient-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight gradient-text dark:gradient-text-dark">
            {t('title')}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const bgColor = hexToRgba(feature.color, 0.15);
            const borderColor = hexToRgba(feature.color, 0.3);
            return (
              <Card 
                key={index}
                className="p-8 border-2 border-border/50 hover:border-primary/60 transition-all duration-300 hover:shadow-glow hover:-translate-y-2 glass-card group"
              >
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform border-2 shadow-sm"
                    style={{ 
                      backgroundColor: bgColor,
                      borderColor: borderColor
                    }}
                  >
                    <Icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-foreground">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyThisMatters;
