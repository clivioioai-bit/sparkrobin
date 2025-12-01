"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, ShoppingBag, Building2, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const WhoThisIsFor = () => {
  const t = useTranslations('whoThisIsFor');
  
  const targetAudiences = [
    {
      icon: Users,
      title: t('creators.title'),
      description: t('creators.description')
    },
    {
      icon: ShoppingBag,
      title: t('ecommerce.title'),
      description: t('ecommerce.description')
    },
    {
      icon: Building2,
      title: t('businesses.title'),
      description: t('businesses.description')
    },
    {
      icon: BarChart3,
      title: t('marketers.title'),
      description: t('marketers.description')
    }
  ];
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Target Audiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {targetAudiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <Card 
                key={index}
                className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4 rtl:flex-row-reverse">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {audience.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {audience.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhoThisIsFor;




