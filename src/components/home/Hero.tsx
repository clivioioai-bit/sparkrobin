"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Play, Film, Circle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

const Hero = () => {
  const t = useTranslations('hero');
  const tCommon = useTranslations('common');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && videoRef.current) {
      // 确保视频播放
      videoRef.current.play().catch((error) => {
        console.log('Video autoplay prevented:', error);
      });
    }
  }, [isMounted]);

  return (
    <section 
      ref={containerRef}
      className="relative h-screen flex items-center justify-center overflow-hidden" 
      style={{ 
        paddingTop: 'calc(5rem + var(--safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom, 0px))',
        height: '100dvh'
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* Fallback background - only shown during SSR or if video fails to load */}
        {!isMounted && (
          <div className="absolute inset-0 bg-white dark:bg-black" />
        )}
        
        {/* Video Background - only render on client */}
        {isMounted && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
            onError={(e) => {
              console.error('Video failed to load:', e);
            }}
          >
            <source src="/videos/sora3.mp4" type="video/mp4" />
          </video>
        )}
        
        {/* Dark overlay for better text readability - reduced opacity to see video */}
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40" style={{ zIndex: 1 }} />
        
        {/* Subtle gradient overlay for depth - reduced opacity */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent dark:from-black/50 dark:via-black/20 dark:to-transparent" style={{ zIndex: 2 }} />
      </div>
      
      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col justify-center py-4 sm:py-6">
        {/* Badge and Heading */}
        <div className="flex flex-col items-center space-y-4 sm:space-y-5 md:space-y-6">
          {/* Modern Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card shadow-glow border border-foreground/20 dark:border-white/30 text-foreground text-xs sm:text-sm font-semibold animate-fade-in hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse" />
            <span>{t('badge')}</span>
          </div>

          {/* Main Heading Section */}
          <div className="relative text-center space-y-3 sm:space-y-4 max-w-5xl mx-auto px-4">
            <span className="absolute top-0 right-0 sm:right-4 text-[10px] sm:text-xs font-mono font-bold text-white bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap tracking-wider shadow-glow animate-pulse rtl:left-0 rtl:right-auto">
              {tCommon('new')}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] sm:leading-[1.2] text-foreground dark:text-white drop-shadow-[0_0_24px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_24px_rgba(0,0,0,0.4)] max-w-4xl mx-auto break-words">
              {t('title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-foreground/90 dark:text-white/90 drop-shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_20px_rgba(0,0,0,0.35)] leading-relaxed max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Action Buttons - Side by Side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-2xl mx-auto">
            {/* Primary CTA - Sora 3 Early Access */}
            <Link href="/sora3-text-to-video" className="w-full sm:w-auto sm:flex-1">
              <Button
                variant="hero"
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 !bg-white !text-primary dark:!bg-primary dark:!text-primary-foreground hover:!bg-white/95 dark:hover:!bg-primary/90 shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300 font-bold rounded-xl"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('trySora3')}
              </Button>
            </Link>
            
            {/* Secondary CTA - Sora 2 Link */}
            <a 
              href="https://saro2.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto sm:flex-1"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 glass-card border-2 border-foreground/30 dark:border-white/40 text-foreground dark:text-white hover:bg-foreground/10 dark:hover:bg-white/25 hover:border-foreground/50 dark:hover:border-white/60 shadow-xl hover:shadow-glow hover:scale-105 transition-all duration-300 font-semibold rounded-xl"
              >
                <Film className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('trySora2')} →
              </Button>
            </a>
          </div>
          
          {/* Sora 2 Description - Below buttons */}
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-white/70 text-center max-w-md px-4 -mt-1">
            {t('sora2Description')}
          </p>

          {/* Feature Points */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 w-full max-w-4xl">
            <div className="flex items-center gap-2.5 px-4 py-2 glass-card rounded-full border border-foreground/15 dark:border-white/20 hover:border-foreground/30 dark:hover:border-white/40 transition-all">
              <Circle className="w-2 h-2 fill-green-500 dark:fill-green-400 text-green-500 dark:text-green-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] dark:drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-xs sm:text-sm text-foreground dark:text-white font-semibold">
                {t('features.noWatermark.title')}
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2 glass-card rounded-full border border-foreground/15 dark:border-white/20 hover:border-foreground/30 dark:hover:border-white/40 transition-all">
              <Circle className="w-2 h-2 fill-green-500 dark:fill-green-400 text-green-500 dark:text-green-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] dark:drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-xs sm:text-sm text-foreground dark:text-white font-semibold">
                {t('features.noRegionalLimits.title')}
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2 glass-card rounded-full border border-foreground/15 dark:border-white/20 hover:border-foreground/30 dark:hover:border-white/40 transition-all">
              <Circle className="w-2 h-2 fill-green-500 dark:fill-green-400 text-green-500 dark:text-green-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] dark:drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-xs sm:text-sm text-foreground dark:text-white font-semibold">
                {t('features.noInviteCode.title')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
