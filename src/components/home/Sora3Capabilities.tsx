"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

// Convert hex to rgba with opacity
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Sora3Capabilities = () => {
  const t = useTranslations('sora3Capabilities');
  
  const capabilities = [
    {
      icon: "🎬",
      title: t('cinematicRealism.title'),
      description: t('cinematicRealism.description'),
      color: "#4A90E2"
    },
    {
      icon: "📷",
      title: t('naturalCameraMotion.title'),
      description: t('naturalCameraMotion.description'),
      color: "#E249A8"
    },
    {
      icon: "👤",
      title: t('consistentCharacters.title'),
      description: t('consistentCharacters.description'),
      color: "#3DBE7A"
    },
    {
      icon: "⏱",
      title: t('longFormPlatformReady.title'),
      description: t('longFormPlatformReady.description'),
      color: "#F1746C"
    },
    {
      icon: "🌍",
      title: t('advancedSceneIntelligence.title'),
      description: t('advancedSceneIntelligence.description'),
      color: "#8F6AF5"
    },
    {
      icon: "🔊",
      title: t('audioSoundGeneration.title'),
      description: t('audioSoundGeneration.description'),
      color: "#FFB024"
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
        </div>

        {/* Capabilities Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {capabilities.map((capability, index) => {
            const bgColor = hexToRgba(capability.color, 0.15);
            const borderColor = hexToRgba(capability.color, 0.3);
            return (
              <Card 
                key={index}
                className="p-8 border-2 border-border/50 hover:border-primary/60 transition-all duration-300 hover:shadow-glow hover:-translate-y-2 glass-card group"
              >
                <div className="flex items-start gap-4 rtl:flex-row-reverse">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-2xl border-2 shadow-sm"
                    style={{ 
                      backgroundColor: bgColor,
                      borderColor: borderColor
                    }}
                  >
                    {capability.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-3 text-foreground">
                      {capability.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {capability.description}
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

export default Sora3Capabilities;
