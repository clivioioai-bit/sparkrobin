"use client";

// Twitter Widgets types
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
  }
}

import React, { useState, useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { Play, FileText, Sparkles, AlertTriangle, Layers, Smartphone, Download, Film, Target, Star, Quote, CheckCircle, Zap, Users, Clock, ImageIcon, Menu } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import GenerateSidebar from "@/components/generate/GenerateSidebar";
import VideoPreview from "@/components/generate/VideoPreview";
import useJobsPolling from "@/hooks/useJobsPolling";
import { useStoryboardPolling } from "@/hooks/useStoryboardPolling";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/contexts/CreditsContext";
import { StoryboardParams, StoryboardJob } from "@/types/storyboard";
import { StoryboardManager } from "@/components/storyboard/StoryboardManager";
import AuthModal from "@/components/AuthModal";
import SubscriptionRequiredModal from "@/components/SubscriptionRequiredModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations, useLocale } from 'next-intl';
import { safeJsonParse } from '@/lib/utils';
import { getVideoUrl, DEMO_VIDEO_PATHS } from "@/config/demoVideos";
import { useIsMobile } from "@/hooks/use-mobile";

const Storyboard = () => {
  const locale = useLocale();
  const t = useTranslations('navigation');
  const tGenerate = useTranslations('generate');
  const { user, isAuthenticated } = useAuth();
  const { subscription, calculateCredits } = useCredits();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Storyboard state
  const [storyboardParams, setStoryboardParams] = useState<StoryboardParams>({
    shots: [
      {
        prompt: 'Setting: Neon-lit city street after rain. A handsome man steps off a black motorcycle, removes his helmet. His eyes lock on a stunning woman.',
        duration: 8
      },
      {
        prompt: 'Setting: The woman raises her hand — the air ripples. The scene melts into a dream-like digital world.She and the man float in an ethereal light field, surrounded by glowing pixels.',
        duration: 8
      },
      {
        prompt: 'Back to reality. The man watches the AI-generated video on his phone. He stands on a rooftop overlooking the neon skyline. The music swells, blending dream and reality.',
        duration: 9
      }
    ],
    n_frames: "25",
    aspect_ratio: 'portrait',
    image_file: undefined
  });

  const [currentJob, setCurrentJob] = useState<StoryboardJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingCost, setPendingCost] = useState<number | undefined>(undefined);

  // Load Twitter Widgets
  useEffect(() => {
    const loadTwitterWidgets = () => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      }
    };

    // Load widgets after component mounts
    const timer = setTimeout(loadTwitterWidgets, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate credit cost based on total duration
  const getCreditCost = (n_frames: string) => {
    switch (n_frames) {
      case "10": return 125;
      case "15": return 225;
      case "25": return 225;
      default: return 125;
    }
  };

  const creditCost = getCreditCost(storyboardParams.n_frames);
  const userCredits = subscription?.credits || 0;

  // Job polling for status updates
  const [jobs, setJobs] = useState<StoryboardJob[]>([]);

  const handleJobUpdate = useCallback((job: StoryboardJob) => {
    setJobs(prev => {
      const existingIndex = prev.findIndex(j => j.jobId === job.jobId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = job;
        return updated;
      } else {
        return [...prev, job];
      }
    });
  }, []);

  // Use the new storyboard-specific polling hook
  const { startPolling: startStoryboardPolling } = useStoryboardPolling({
    jobs,
    onJobUpdate: handleJobUpdate
  });

  // Handle form submission
  const handleGenerate = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    // Check credits
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }

    // Validate form
    const newErrors: Record<string, string> = {};
    if (storyboardParams.shots.length === 0) {
      newErrors.shots = "At least one shot is required";
    }
    if (storyboardParams.shots.some(shot => !shot.prompt.trim())) {
      newErrors.prompt = "All shots must have a prompt";
    }

    // Check duration allocation
    const totalUsedDuration = storyboardParams.shots.reduce((sum, shot) => sum + shot.duration, 0);
    const maxDuration = parseInt(storyboardParams.n_frames);

    if (totalUsedDuration > maxDuration) {
      newErrors.duration = `Total shot duration (${totalUsedDuration}s) exceeds maximum duration (${maxDuration}s)`;
    } else if (totalUsedDuration < maxDuration) {
      newErrors.duration = `Duration not allocated right. Total shot duration (${totalUsedDuration}s) is less than maximum duration (${maxDuration}s). Please allocate all remaining duration.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('shots', JSON.stringify(storyboardParams.shots));
      formData.append('n_frames', storyboardParams.n_frames);
      formData.append('aspect_ratio', storyboardParams.aspect_ratio);

      // Add image file if selected
      if (storyboardParams.image_file) {
        formData.append('image_file', storyboardParams.image_file);
      }

      const response = await fetch('/api/storyboard/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await safeJsonParse(response);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || 'Failed to generate storyboard');
      }

      const result = await safeJsonParse(response);

      // Create job object
      const newJob: StoryboardJob = {
        jobId: result.jobId,
        taskId: result.taskId || result.jobId,
        status: 'pending',
        progress: 0,
        params: storyboardParams,
        created_at: new Date().toISOString(),
        visibility: 'private',
        creditCost: creditCost
      };

      setCurrentJob(newJob);
      setJobs(prev => [newJob, ...prev]);
      startStoryboardPolling(result.jobId);

    } catch (error) {
      console.error('Error generating storyboard:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate storyboard';

      if (errorMessage.includes('credit')) {
        setPendingCost(creditCost);
        setShowSubscriptionModal(true);
      } else {
        setErrors({ prompt: errorMessage });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isAuthenticated, user, userCredits, creditCost, storyboardParams, startStoryboardPolling]);

  // Handle job completion
  useEffect(() => {
    if (currentJob && jobs.length > 0) {
      const job = jobs.find(j => j.jobId === currentJob.jobId);
      if (job && (job.status !== currentJob.status || job.progress !== currentJob.progress)) {
        setCurrentJob(prev => prev ? { ...prev, ...job } : null);

        if (job.status === 'completed' || job.status === 'failed') {
          setIsGenerating(false);
        }
      }
    }
  }, [jobs]); // 只依赖 jobs，移除 currentJob

  // Handle retry
  const handleRetry = useCallback(async (job: StoryboardJob) => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }

    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }

    setErrors({});
    setIsGenerating(true);

    try {
      const response = await fetch('/api/storyboard/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job.params),
      });

      if (!response.ok) {
        throw new Error('Failed to retry storyboard generation');
      }

      const result = await safeJsonParse(response);

      const newJob: StoryboardJob = {
        ...job,
        jobId: result.jobId,
        taskId: result.taskId || result.jobId,
        status: 'pending',
        progress: 0,
        created_at: new Date().toISOString(),
        error: undefined,
        creditCost: creditCost
      };

      setJobs(prev => [newJob, ...prev]);
      setCurrentJob(newJob);
      startStoryboardPolling(result.jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry job';
      setErrors({ prompt: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  }, [user, userCredits, creditCost, startStoryboardPolling]);

  // Get localized SEO content
  const getSEOTitle = () => {
    if (locale === 'ru') {
      return 'Gemini Omni Flash Pro Storyboard | Multi-Scene Workflow';
    } else if (locale === 'ar') {
      return 'Gemini Omni Flash Pro Storyboard | Multi-Scene Workflow';
    } else if (locale === 'ja') {
      return 'Gemini Omni Flash Pro Storyboard | Multi-Scene Workflow';
    }
    return 'Gemini Omni Flash Pro Storyboard | Multi-Scene Workflow';
  };

  const getSEODescription = () => {
    if (locale === 'ru') {
      return 'Gemini Omni Flash Pro Storyboard helps teams plan scenes, references, shot notes, and reviewable AI video drafts for short-form workflows.';
    } else if (locale === 'ar') {
      return 'Gemini Omni Flash Pro Storyboard helps teams plan scenes, references, shot notes, and reviewable AI video drafts for short-form workflows.';
    } else if (locale === 'ja') {
      return 'Gemini Omni Flash Pro Storyboard helps teams plan scenes, references, shot notes, and reviewable AI video drafts for short-form workflows.';
    }
    return 'Gemini Omni Flash Pro Storyboard helps teams plan scenes, references, shot notes, and reviewable AI video drafts for short-form workflows.';
  };

  const canonicalUrl = locale === 'en'
    ? 'https://omniflashai.io/gemini-omni-flash-storyboard'
    : `https://omniflashai.io/${locale}/gemini-omni-flash-storyboard`;

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead
        title={getSEOTitle()}
        description={getSEODescription()}
        canonical={canonicalUrl}
        keywords="Gemini Omni Flash Pro Storyboard,gemini-omni-flash storyboard,AI video storyboard,multi-scene video,TikTok video generator,Instagram Reels,YouTube Shorts,AI video creator,Gemini Omni Flash,storyboard generator,AI video maker,social media video creator"
        image="https://omniflashai.io/og-sora3-storyboard.jpg"
      />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Gemini Omni Flash Pro Storyboard",
            "description": "Plan multi-scene AI video drafts with scene-by-scene notes, reference images, continuity rules, and review context using Gemini Omni Flash Pro Storyboard.",
            "url": "https://omniflashai.io/gemini-omni-flash-storyboard",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "19",
              "priceCurrency": "USD",
              "priceSpecification": {
                "@type": "PriceSpecification",
                "price": "19",
                "priceCurrency": "USD",
                "billingIncrement": "Monthly"
              }
            },
            "creator": {
              "@type": "Organization",
              "name": "ivido",
              "url": "https://omniflashai.io"
            },
            "featureList": [
              "Multi-scene draft planning",
              "Scene-by-scene control",
              "Shot notes and pacing",
              "Channel version planning",
              "Reference image support",
              "Portrait and landscape modes"
            ],
            "screenshot": "https://omniflashai.io/sora3-storyboard-screenshot.jpg",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            }
          })
        }}
      />
      <GenerateSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

      <div
        className="flex-1 transition-all duration-300 pb-16 bg-background"
        style={{ marginLeft: !mounted || isMobile ? '0' : 'var(--sidebar-width, 220px)' }}
      >
      {mounted && isMobile && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-[4.25rem] left-3 z-40 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
          style={{ touchAction: 'manipulation' }}
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      )}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-[5.25rem] md:pt-24">
          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errors.duration || errors.prompt || errors.shots || Object.values(errors)[0]}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel: Storyboard Configuration */}
            <div className="space-y-6">
              <div className="relative bg-card/80 border-2 border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Video Generator</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border border-primary/20">
                      <span>{tGenerate('credits')}: {userCredits}</span>
                    </span>
                  </div>
                </div>

                {/* Tab switcher */}
                <div className="flex items-center bg-muted/60 border border-border rounded-xl p-1 mb-5 gap-1">
                  <Link
                    href="/gemini-omni-flash-text-to-video"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <FileText className="w-4 h-4" />
                    Single Shot
                  </Link>
                  <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center bg-background shadow-sm text-primary border border-border/50">
                    <Layers className="w-4 h-4" />
                    Storyboard
                  </span>
                </div>

                <StoryboardManager
                  params={storyboardParams}
                  onParamsChange={setStoryboardParams}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  creditCost={creditCost}
                />
              </div>
            </div>

            {/* Right Panel: Output */}
            <div className="space-y-6">
              <div className="bg-card/80 border-2 border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Video Preview</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border whitespace-nowrap">
                    {t('storyboard')} {tGenerate('video')}
                  </span>
                </div>

                {currentJob ? (
                  <>
                    {/* Generation time info */}
                    {currentJob.status === 'processing' && (
                      <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                          <span className="text-sm font-medium text-primary">
                            {tGenerate('storyboard.generatingStoryboard')}
                          </span>
                        </div>
                        <p className="text-xs text-primary mt-1">
                          {tGenerate('storyboard.generationTimeNote')}
                        </p>
                      </div>
                    )}

                    <VideoPreview
                    currentJob={{
                      jobId: currentJob.jobId,
                      status: currentJob.status === 'completed' ? 'SUCCEEDED' : currentJob.status === 'failed' ? 'FAILED' : currentJob.status === 'processing' ? 'RUNNING' : 'PENDING',
                      progress: currentJob.progress,
                      preview_url: currentJob.thumbnailUrl,
                      result_url: currentJob.videoUrl,
                      error: currentJob.error ? { code: 'UNKNOWN', message: currentJob.error } : undefined,
                      params: {
                        prompt: storyboardParams.shots?.[0]?.prompt || 'Storyboard video',
                        duration_sec: 16,
                        aspect_ratio: storyboardParams.aspect_ratio === 'portrait' ? '9:16' : '16:9',
                        cfg_scale: 7,
                        reference_image_url: undefined // Image will be uploaded separately
                      },
                      created_at: currentJob.created_at,
                      creditCost: currentJob.creditCost
                    }}
                    onRetry={async () => { await handleRetry(currentJob); }}
                  />
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-accent" />
                        <span className="font-bold text-accent-foreground/80">{tGenerate('exampleVideo')}</span>
                      </div>
                      <p className="text-sm text-accent-foreground/80">
                        {tGenerate('storyboard.exampleDescription')}
                      </p>
                    </div>

                    <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        poster=""
                        preload="metadata"
                      >
                        <source
                          src={getVideoUrl(DEMO_VIDEO_PATHS.storyboardExample)}
                          type="video/mp4"
                        />
                        {tGenerate('browserNotSupportVideo')}
                      </video>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['storyboard', 'multi-scene', 'cinematic'].map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {tGenerate('storyboard.exampleNote')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page Title - below the functional area */}
          <header className="text-center mt-10 mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t('storyboard')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('storyboardDescription')}
            </p>
          </header>

          {/* Feature Description */}
          <section className="mt-16 mb-8">
            {/* Pricing Banner */}
            <div className="mb-12">
              <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  <span className="font-bold inline-block">{tGenerate('storyboard.pricing')}:</span> <Link href="/pricing" className="inline-block text-foreground hover:text-primary underline decoration-primary/30 hover:decoration-primary transition-colors">{tGenerate('storyboard.pricingDescription')}</Link>
                </p>
              </div>
            </div>

            {/* What is Gemini Omni Flash Pro Storyboard */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
                {tGenerate('storyboard.whatIsSora3ProStoryboard')}
              </h2>
              <Card className="p-8 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="max-w-4xl mx-auto text-center">
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    {tGenerate('storyboard.sora3ProStoryboardDescription')}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      {tGenerate('storyboard.upTo25sDuration')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      {tGenerate('storyboard.multiSceneControl')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      {tGenerate('storyboard.socialMediaReady')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-card border border-border rounded-full">
                      {tGenerate('storyboard.hdQualityAudio')}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* X (Twitter) Showcase */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                {tGenerate('storyboard.whatPeopleAreSaying')}
              </h2>
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sora3 Updates Tweet */}
                  <Card className="p-4 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                    <blockquote className="twitter-tweet">
                      <p lang="en" dir="ltr">
                        2 Gemini Omni Flash updates:<br/><br/>
                        - Storyboard workflows help teams plan scenes before generation<br/>
                        - Reference notes and prompt systems make draft reviews easier
                        <a href="https://t.co/iINg7alWGL">pic.twitter.com/iINg7alWGL</a>
                      </p>
                      <a href="https://twitter.com/status/1978661828419822066?ref_src=twsrc%5Etfw">October 16, 2025</a>
                    </blockquote>
                  </Card>

                  {/* Dustin Hollywood Tweet */}
                  <Card className="p-4 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                    <blockquote className="twitter-tweet">
                      <p lang="en" dir="ltr">
                        SORA Update!!! IT'S HUGE!! THE STORYBOARD!!!<br/><br/>
                        This is the way..<br/><br/>
                        - NEW UI<br/>
                        - Unlimited Scene Planning<br/>
                        - Scene time allotment (custom timing)<br/>
                        - An increase in Pro to 25-Seconds!<br/>
                        - Start frame redesign!<br/>
                        - Better scene/shot transition designing now<br/><br/>
                        Go on the web to SORA, click…
                        <a href="https://t.co/d040XEE0FS">pic.twitter.com/d040XEE0FS</a>
                      </p>
                      &mdash; Dustin Hollywood (@dustinhollywood)
                      <a href="https://twitter.com/dustinhollywood/status/1978545835978703340?ref_src=twsrc%5Etfw">October 15, 2025</a>
                    </blockquote>
                  </Card>

                  {/* Cody Baker Tweet */}
                  <Card className="p-4 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                    <blockquote className="twitter-tweet">
                      <p lang="en" dir="ltr">
                        Here's an example of a 25s video I made in Gemini Omni Flash using the new storyboard feature.<br/><br/>
                        Still learning what's the best way to use this…
                        <a href="https://t.co/urYyCy3gqz">pic.twitter.com/urYyCy3gqz</a>
                      </p>
                      &mdash; Cody Baker 🇺🇸 (@CodyBaker_xx)
                      <a href="https://twitter.com/CodyBaker_xx/status/1978813530292851188?ref_src=twsrc%5Etfw">October 16, 2025</a>
                    </blockquote>
                  </Card>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                {tGenerate('storyboard.keyFeatures')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('storyboard.multiSceneSequencing')}</h3>
                      <p className="text-muted-foreground">
                        {tGenerate('storyboard.multiSceneSequencingDescription')}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('storyboard.visualConsistency')}</h3>
                      <p className="text-muted-foreground">
                        {tGenerate('storyboard.visualConsistencyDescription')}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('storyboard.flexibleOutputControl')}</h3>
                      <p className="text-muted-foreground">
                        {tGenerate('storyboard.flexibleOutputControlDescription')}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('storyboard.referenceImageSupport')}</h3>
                      <p className="text-muted-foreground">
                        {tGenerate('storyboard.referenceImageSupportDescription')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* How to Use */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                {tGenerate('storyboard.howToUse')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 text-center bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('storyboard.step1DefineScenes')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {tGenerate('storyboard.step1Description')}
                  </p>
                </Card>

                <Card className="p-6 text-center bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('storyboard.step2SetParameters')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {tGenerate('storyboard.step2Description')}
                  </p>
                </Card>

                <Card className="p-6 text-center bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('storyboard.step3UploadReference')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {tGenerate('storyboard.step3Description')}
                  </p>
                </Card>

                <Card className="p-6 text-center bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">4</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('storyboard.step4Generate')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {tGenerate('storyboard.step4Description')}
                  </p>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <p className="text-muted-foreground">
                    {tGenerate('storyboard.perfectFor')} <Link href="/pricing" className="text-primary hover:underline">{tGenerate('storyboard.pricingPlans')}</Link>.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              {tGenerate('storyboard.powerfulStoryboardFeatures')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <Layers className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('storyboard.sceneBySceneControl')}</h3>
                <p className="text-muted-foreground">{tGenerate('storyboard.sceneBySceneControlDescription')}</p>
              </Card>
              <Card className="p-6 text-center bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <Smartphone className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('storyboard.socialMediaFormats')}</h3>
                <p className="text-muted-foreground">{tGenerate('storyboard.socialMediaFormatsDescription')}</p>
              </Card>
              <Card className="p-6 text-center bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <Download className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('storyboard.fastExportShare')}</h3>
                <p className="text-muted-foreground">{tGenerate('storyboard.fastExportShareDescription')}</p>
              </Card>
            </div>
          </section>

          {/* Gemini Omni Flash Pro Storyboard Application */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              <span suppressHydrationWarning>Gemini Omni Flash Pro Storyboard Application</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Film className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Gemini Omni Flash Storyboard AI Videos</h3>
                    <p className="text-muted-foreground">
                      Gemini Omni Flash Pro Storyboard API lets you design complete multi-scene video flows where every shot follows your creative vision.
                      You define each scene's visuals and pacing using text or image prompts, while the API ensures natural transitions
                      and consistent visual style throughout the video.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Cinematic Ads & Storytelling</h3>
                    <p className="text-muted-foreground">
                      The API helps brands and creators structure professional-grade short films or ad visuals.
                      You can plan camera movements, transitions, and tone precisely, producing cinematic ads
                      that clearly express your brand's story and aesthetic identity.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Concept Videos & Prototypes</h3>
                    <p className="text-muted-foreground">
                      Yes. It's ideal for turning creative concepts into structured visual prototypes.
                      Each scene becomes part of a connected flow, allowing you to test how storylines,
                      pacing, and compositions work together before moving into full-scale production.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Character-Driven Animation</h3>
                    <p className="text-muted-foreground">
                      You can maintain the same characters, environments, and tone across different shots to produce
                      cohesive narrative sequences. This is especially useful for storytelling videos, product explainers,
                      or social clips that depend on emotional and visual continuity.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Creator Stories */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              What Creators Are Saying
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <Quote className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground italic mb-4">"Gemini Omni Flash Pro Storyboard transformed my content creation. My engagement has skyrocketed!"</p>
                <p className="font-semibold text-foreground">- Sarah Chen <span className="text-sm text-muted-foreground">(@sarahcreates)</span></p>
                <p className="text-sm text-primary mt-2 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> +300% Engagement</p>
              </Card>
              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <Quote className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground italic mb-4">"The scene-by-scene control is a game-changer. I can now tell complex stories with ease."</p>
                <p className="font-semibold text-foreground">- Marcus Johnson <span className="text-sm text-muted-foreground">(@marcusvlogs)</span></p>
                <p className="text-sm text-primary mt-2 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> +150% Watch Time</p>
              </Card>
              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <Quote className="w-8 h-8 text-primary mb-4" />
                <p className="text-muted-foreground italic mb-4">"Finally, an AI tool that understands visual consistency across multiple shots. My clients love it!"</p>
                <p className="font-semibold text-foreground">- Elena Rodriguez <span className="text-sm text-muted-foreground">(@elenabrand)</span></p>
                <p className="text-sm text-primary mt-2 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> 100% Client Satisfaction</p>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto space-y-4">
              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      How can Gemini Omni Flash Pro Storyboard API help in creating multi-scene AI videos?
                    </h3>
                    <p className="text-muted-foreground">
                      Gemini Omni Flash Pro Storyboard API lets you design complete Gemini Omni Flash Storyboard video flows where every shot follows your creative vision.
                      You define each scene's visuals and pacing using text or image prompts, while the API ensures natural transitions
                      and consistent visual style throughout the video.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      How can brands use Gemini Omni Flash Pro Storyboard API for cinematic ads and storytelling?
                    </h3>
                    <p className="text-muted-foreground">
                      The API helps brands and creators structure professional-grade short films or ad visuals.
                      You can plan camera movements, transitions, and tone precisely, producing cinematic ads
                      that clearly express your brand's story and aesthetic identity.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Can Gemini Omni Flash Pro Storyboard API be used for concept videos or visual prototypes?
                    </h3>
                    <p className="text-muted-foreground">
                      Yes. It's ideal for turning creative concepts into structured visual prototypes.
                      Each scene becomes part of a connected flow, allowing you to test how storylines,
                      pacing, and compositions work together before moving into full-scale production.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      How does Gemini Omni Flash Pro Storyboard API enable character-driven animation sequences?
                    </h3>
                    <p className="text-muted-foreground">
                      You can maintain the same characters, environments, and tone across different shots to produce
                      cohesive narrative sequences. This is especially useful for storytelling videos, product explainers,
                      or social clips that depend on emotional and visual continuity.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      What video durations are supported by Gemini Omni Flash Pro Storyboard?
                    </h3>
                    <p className="text-muted-foreground">
                      Gemini Omni Flash Pro Storyboard costs 250 credits per 10-second video and 450 credits per 15–25 second video.
                      You can distribute the total duration across multiple scenes as needed.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Can I upload reference images for Gemini Omni Flash Pro Storyboard generation?
                    </h3>
                    <p className="text-muted-foreground">
                      Yes, you can upload a reference image to guide the Gemini Omni Flash Pro Storyboard generation process.
                      This helps ensure visual consistency throughout your Gemini Omni Flash Storyboard video. The image is applied globally
                      to all scenes in your storyboard.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>


          {/* Mobile: Fixed Generate Button */}
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
            <button
              className="w-full bg-primary text-primary-foreground font-bold py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 transition-all duration-200 backdrop-blur-sm"
              onClick={handleGenerate}
              disabled={isGenerating || userCredits < creditCost}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent flex-shrink-0" />
                  <span className="whitespace-nowrap">Generating...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current flex-shrink-0" />
                  <span className="whitespace-nowrap">Generate Storyboard</span>
                </>
              )}
            </button>

            {/* Generation time hint */}
            {isGenerating && (
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  ⏱️ Storyboard generation typically takes 5-15 minutes
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please keep this page open while generating
                </p>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="generate videos"
      />

      {/* Twitter Widgets Script */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load();
          }
        }}
      />
    </div>
  );
};

export default Storyboard;
