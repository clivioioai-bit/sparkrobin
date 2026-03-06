"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CAPABILITY_VIDEO_PATHS } from '@/config/demoVideos';

const Sora3Capabilities = () => {
  const t = useTranslations('sora3Capabilities');
  const [activeIndex, setActiveIndex] = useState(0);

  const capabilities = [
    {
      title: t('cinematicRealism.title'),
      description: t('cinematicRealism.description'),
      videoUrl: CAPABILITY_VIDEO_PATHS.cinematic,
      tag: 'Film-Grade',
    },
    {
      title: t('naturalCameraMotion.title'),
      description: t('naturalCameraMotion.description'),
      videoUrl: CAPABILITY_VIDEO_PATHS.camera,
      tag: 'Camera AI',
    },
    {
      title: t('consistentCharacters.title'),
      description: t('consistentCharacters.description'),
      videoUrl: CAPABILITY_VIDEO_PATHS.characters,
      tag: 'Characters',
    },
    {
      title: t('longFormPlatformReady.title'),
      description: t('longFormPlatformReady.description'),
      videoUrl: CAPABILITY_VIDEO_PATHS.longform,
      tag: '25-Second',
    },
    {
      title: t('advancedSceneIntelligence.title'),
      description: t('advancedSceneIntelligence.description'),
      videoUrl: CAPABILITY_VIDEO_PATHS.scene,
      tag: 'Scene AI',
    },
    {
      title: t('audioSoundGeneration.title'),
      description: t('audioSoundGeneration.description'),
      videoUrl: CAPABILITY_VIDEO_PATHS.audio,
      tag: 'Audio',
    },
  ];

  const active = capabilities[activeIndex];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setIsPlaying(false);
    setHasError(false);
    const timer = setTimeout(() => {
      if (videoRef.current && active.videoUrl) videoRef.current.load();
    }, 80);
    return () => clearTimeout(timer);
  }, [activeIndex, active.videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active.videoUrl) return;

    const onLoaded = async () => {
      setIsLoading(false);
      try {
        video.muted = true;
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };
    const onError = () => { setIsLoading(false); setHasError(true); };
    const onCanPlay = () => setIsLoading(false);
    const onLoadStart = () => setIsLoading(true);

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('error', onError);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadstart', onLoadStart);
    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadstart', onLoadStart);
    };
  }, [active.videoUrl, activeIndex]);

  const handleVideoClick = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try { await video.play(); setIsPlaying(true); } catch {}
    } else {
      video.pause(); setIsPlaying(false);
    }
  };

  return (
    <section className="py-24 sm:py-32 lg:py-40 bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
          >
            {t('title')}
          </h2>
        </div>

        {/* iOS-style segmented control */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.04] border border-border backdrop-blur-xl w-max mx-auto">
              {capabilities.map((cap, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  aria-pressed={activeIndex === i}
                  className={`relative px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    activeIndex === i
                      ? 'bg-white text-black shadow-[0_1px_6px_rgba(0,0,0,0.4)]'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {cap.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main showcase card */}
        <div className="rounded-3xl overflow-hidden bg-card/80 backdrop-blur-xl border border-border/50 shadow-[0_32px_80px_rgba(0,0,0,0.6)] max-w-5xl mx-auto">

          {/* Video */}
          <div
            className="relative aspect-video w-full bg-black cursor-pointer"
            onClick={handleVideoClick}
          >
            {active.videoUrl && (
              <video
                ref={videoRef}
                key={`${activeIndex}-${active.videoUrl}`}
                loop
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
                onError={() => { setHasError(true); setIsLoading(false); }}
                onLoadedMetadata={() => setIsLoading(false)}
              >
                <source src={active.videoUrl} type="video/mp4" />
              </video>
            )}

            {/* Loading spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
              </div>
            )}

            {/* Error */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <button
                  onClick={(e) => { e.stopPropagation(); setHasError(false); setIsLoading(true); videoRef.current?.load(); }}
                  className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-xl border border-white/10 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Play button */}
            {!isPlaying && !isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/[0.15] backdrop-blur-xl border border-white/20 flex items-center justify-center transition-transform hover:scale-110">
                  <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Tag badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 text-[10px] font-semibold rounded-full bg-black/50 backdrop-blur-xl text-white/70 border border-white/10 uppercase tracking-widest">
                {active.tag}
              </span>
            </div>
          </div>

          {/* Description panel */}
          <div className="px-7 sm:px-10 py-7 sm:py-9 bg-card/60 backdrop-blur-xl border-t border-border/50">
            <h3
              className="text-xl sm:text-2xl font-semibold text-white mb-3 tracking-tight"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
            >
              {active.title}
            </h3>
            <p className="text-sm sm:text-base text-white/40 leading-relaxed whitespace-pre-line">
              {active.description}
            </p>
          </div>
        </div>

        {/* SEO hidden headings */}
        <div className="sr-only" aria-hidden="true">
          {capabilities.map((cap, i) => <h3 key={i}>{cap.title}</h3>)}
        </div>
      </div>
    </section>
  );
};

export default Sora3Capabilities;
