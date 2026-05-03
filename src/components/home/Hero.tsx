"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Play, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { getHeroVideoUrl } from '@/config/demoVideos';

const Hero = () => {
  const t = useTranslations('hero');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && videoRef.current) {
      const video = videoRef.current;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const handleUserInteraction = () => {
            video.play().catch(() => {});
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          };
          document.addEventListener('click', handleUserInteraction, { once: true });
          document.addEventListener('touchstart', handleUserInteraction, { once: true });
        });
      }

      const handleLoadedData = () => {
        setVideoReady(true);
        video.play().catch(() => {});
      };

      const handleError = () => {
        setVideoError(true);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };
    }
  }, [isMounted]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-background"
      style={{
        paddingTop: 'calc(5rem + var(--safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom, 0px))',
        height: '100dvh'
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0" suppressHydrationWarning>
        {(!isMounted || videoError) && (
          <div className="absolute inset-0 bg-background" />
        )}
        {isMounted && !videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: 0 }}
            onError={() => setVideoError(true)}
          >
            <source src={getHeroVideoUrl()} type="video/mp4" />
          </video>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-[#06130f]/52" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(167,243,208,0.08),transparent_34%),linear-gradient(to_top,var(--background),rgba(6,19,15,0.22)_48%,rgba(4,20,16,0.45))]" style={{ zIndex: 2 }} />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col justify-center">
        <div className="flex flex-col items-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="glass-chip inline-flex items-center gap-2 rounded-full px-4 py-1.5 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">{t('badge')}</span>
          </div>

          {/* Main Heading */}
          <div className="text-center space-y-4 sm:space-y-5 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              <span className="gradient-text">{t('brandName')}</span>
              <br />
              <span className="text-white">{t('tagline')}</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto pt-2">
            <Link href="/spark-robin-text-to-video" className="w-full sm:w-auto">
              <Button
                variant="hero"
                size="lg"
                className="glass-button-gradient w-full text-sm sm:text-base px-8 py-5 sm:py-6 text-white hover:scale-[1.02] transition-all duration-300 font-semibold rounded-xl"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" />
                {t('trySora3')}
              </Button>
            </Link>

            <Link href="/spark-robin-image-to-video" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="glass-chip w-full text-sm sm:text-base px-8 py-5 sm:py-6 text-white hover:bg-white/[0.12] hover:border-white/[0.25] hover:scale-[1.02] transition-all duration-300 font-medium rounded-xl"
              >
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('trySora2')}
              </Button>
            </Link>
          </div>

          {/* Feature Points */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
            {['noWatermark', 'noRegionalLimits', 'noInviteCode'].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs sm:text-sm text-white/50 font-medium">
                  {t(`features.${feature}.title`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
