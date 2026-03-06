"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { getDemoVideoUrls } from "@/config/demoVideos";

function VideoCard({ src }: { src: string }) {
  const t = useTranslations('demoGallery');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const tryPlayWithSound = async () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.volume = 1;
    el.currentTime = 0;
    try {
      await el.play();
      setIsMuted(false);
      setIsPlaying(true);
    } catch {
      el.muted = true;
      setIsMuted(true);
      try { await el.play(); setIsPlaying(true); } catch {}
    }
  };

  const pauseAndReset = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
  };

  const toggleMute = async () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.muted = false;
      try {
        await el.play();
        setIsMuted(false);
        setIsPlaying(true);
        return;
      } catch {}
      el.muted = true;
      setIsMuted(true);
      try { await el.play(); setIsPlaying(true); } catch {}
      return;
    }
    if (el.muted) {
      el.muted = false;
      setIsMuted(false);
      try { await el.play(); } catch {}
    } else {
      el.muted = true;
      setIsMuted(true);
      try { await el.play(); } catch {}
    }
  };

  const unmuteOnClick = async () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.muted) {
      el.muted = false;
      setIsMuted(false);
      try { await el.play(); } catch {}
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let timer: NodeJS.Timeout | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timer = setTimeout(() => setShouldLoad(true), 100);
          }
        });
      },
      { rootMargin: '80px', threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => {
      if (timer) clearTimeout(timer);
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  if (hasError) return null;

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 w-[220px] sm:w-[260px] rounded-2xl sm:rounded-3xl overflow-hidden relative group cursor-pointer bg-card/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.28)] transition-all duration-500 snap-start"
      style={{ aspectRatio: '9/16' }}
    >
      {shouldLoad ? (
        <video
          ref={videoRef}
          playsInline
          loop
          preload="none"
          muted={isMuted}
          tabIndex={0}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          onMouseEnter={tryPlayWithSound}
          onMouseLeave={pauseAndReset}
          onTouchStart={toggleMute}
          onClick={toggleMute}
          onKeyDown={(e) => { if (e.key === 'Enter') void toggleMute(); }}
          onError={() => setHasError(true)}
        >
          <source
            src={encodeURI(src)}
            type={src.endsWith('.mov') ? 'video/quicktime' : 'video/mp4'}
          />
        </video>
      ) : (
        <div className="absolute inset-0 bg-card flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-[1.5px] border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Hover play icon */}
      {!isPlaying && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Unmute pill */}
      {isMuted && isPlaying && (
        <button
          onClick={unmuteOnClick}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-medium rounded-full bg-black/60 backdrop-blur-xl text-white border border-white/10 whitespace-nowrap transition-opacity hover:bg-black/80"
        >
          {t('tapToUnmute')}
        </button>
      )}
    </div>
  );
}

const DemoGallery = () => {
  const t = useTranslations('demoGallery');
  const [mounted, setMounted] = useState(false);
  const [videos, setVideos] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      setVideos(getDemoVideoUrls());
    } catch {
      setVideos([]);
    }
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [mounted, videos, updateScrollState]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  const headerSection = (
    <div className="text-center mb-10 sm:mb-14">
      <h2
        className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-white"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
      >
        {t('title')}
      </h2>
      <p className="mt-4 text-base sm:text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
        {t('description')}
      </p>
    </div>
  );

  if (!mounted || videos.length === 0) {
    return (
      <section id="examples" className="py-24 sm:py-32 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {headerSection}
          <div className="flex justify-center items-center min-h-[340px]">
            <div className="w-8 h-8 rounded-full border-[1.5px] border-white/20 border-t-white/80 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="examples" className="py-24 sm:py-32 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {headerSection}
      </div>

      {/* Scroll track — full bleed */}
      <div className="relative">
        {/* Left fade */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-20 sm:w-32 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {/* Right fade */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-20 sm:w-32 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Arrow — left */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] flex items-center justify-center transition-all duration-200 hover:bg-white/[0.15] ${
            canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Arrow — right */}
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] flex items-center justify-center transition-all duration-200 hover:bg-white/[0.15] ${
            canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 sm:px-8 lg:px-16 py-4"
          style={{ scrollPaddingLeft: '1rem' }}
        >
          {videos.map((v, i) => (
            <VideoCard key={`${v}-${i}`} src={v} />
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mt-10">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white transition-colors group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            {t('seeMoreExamples')}
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DemoGallery;
