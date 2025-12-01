"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Play, AlertTriangle, Sparkles, Film, Wand2, Music2, Eye, Users, Zap, GraduationCap, Rocket, Palette, Quote, ImageIcon, Upload, History } from "lucide-react";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import GenerateSidebar from "@/components/generate/GenerateSidebar";
import VideoPreview from "@/components/generate/VideoPreview";
import useJobsPolling from "@/hooks/useJobsPolling";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/contexts/CreditsContext";
import { useSubscription } from "@/hooks/useSubscription";
// removed subscription gating; rely on credits-only gating
import { Job, CreateJobRequest, FormErrors, Duration } from "@/types/jobs";
import watermarkApi from "@/services/watermarkApi";
import InsufficientCreditsDialog from "@/components/insufficient-credits-dialog";
import { Sora3Mode } from "@/components/generate/modes/sora3mode";
import { ReframeMode } from "@/components/generate/modes/ReframeMode";
import { Veo3Mode } from "@/components/generate/modes/Veo3Mode";
import { Veo3ImageMode } from "@/components/generate/modes/Veo3ImageMode";
import { GenerationMode, ModeParams, Sora3Params, ReframeParams, Veo3Params } from "@/types/generation-modes";
import videoApi from "@/services/videoApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { getRandomSampleVideo, type SampleVideo } from "@/data/sampleVideos";
import { safeJsonParse } from '@/lib/utils';
import { getVideoUrl, DEMO_VIDEO_PATHS } from "@/config/demoVideos";
import SubscriptionRequiredModal from "@/components/SubscriptionRequiredModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronDown, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const createDefaultSora3Params = (): Sora3Params => ({
  prompt: '',
  negative_prompt: '',
  duration: 8,
  aspectRatio: '16:9',
  style: 'realistic',
  n_frames: '10',
  model: 'sora3'
});

const createDefaultReframeParams = (): ReframeParams => ({
  prompt: '',
  targetAspectRatio: '16:9',
  style: 'zoom',
  speed: 'normal',
  model: 'sora3',
  veo3SubModel: 'veo3_fast', // Default to fast for image-to-video
  n_frames: '10'
});

const createDefaultVeo3Params = (): Veo3Params => ({
  prompt: 'A dog playing in a park',
  model: 'veo3_fast',
  generationType: 'TEXT_2_VIDEO',
  aspectRatio: '16:9',
  enableTranslation: true
});

const Generate = () => {
  const t = useTranslations('navigation');
  const tGenerate = useTranslations('generate');
  const tPricing = useTranslations('pricing.plans');
  const { user, isAuthenticated, signOut } = useAuth();
  const { subscription, calculateCredits } = useCredits();
  const { hasActiveSubscription } = useSubscription();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Sample video state
  const [sampleVideo, setSampleVideo] = useState<SampleVideo | null>(null);
  const [showingSample, setShowingSample] = useState(false);
  
  // Mode state
  const [generationMode, setGenerationMode] = useState<GenerationMode>('sora3');
  const [modeParams, setModeParamsState] = useState<ModeParams>(() => ({
    mode: 'sora3',
    params: createDefaultSora3Params()
  }));
  const sora3ParamsCache = useRef<Sora3Params>(
    modeParams.mode === 'sora3'
      ? (modeParams.params as Sora3Params)
      : createDefaultSora3Params()
  );
  const reframeParamsCache = useRef<ReframeParams>(
    modeParams.mode === 'reframe'
      ? (modeParams.params as ReframeParams)
      : createDefaultReframeParams()
  );
  const veo3ParamsCache = useRef<Veo3Params>(
    modeParams.mode === 'veo3'
      ? (modeParams.params as Veo3Params)
      : createDefaultVeo3Params()
  );
  const setModeParams = useCallback(
    (value: ModeParams | ((prev: ModeParams) => ModeParams)) => {
      setModeParamsState(prev => {
        const next =
          typeof value === 'function'
            ? (value as (prev: ModeParams) => ModeParams)(prev)
            : value;

        if (next.mode === 'sora3') {
          sora3ParamsCache.current = next.params as Sora3Params;
        } else if (next.mode === 'reframe') {
          reframeParamsCache.current = next.params as ReframeParams;
        } else if (next.mode === 'veo3') {
          veo3ParamsCache.current = next.params as Veo3Params;
        }

        return next;
      });
    },
    [setModeParamsState]
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user display name and initials
  const getUserDisplayName = useCallback(() => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  }, [user]);

  const getUserInitials = useCallback(() => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [getUserDisplayName]);

  const routeFromMode = useCallback((mode: GenerationMode) => (
    mode === 'reframe' ? '/sora3-image-to-video' : '/sora3-text-to-video'
  ), []);

  const modeFromPathname = useCallback((path: string): GenerationMode => (
    path?.startsWith('/sora3-image-to-video') ? 'reframe' : 'sora3'
  ), []);

  const handleModeChange = useCallback(
    (mode: GenerationMode) => {
      setModeParams(prev => {
        if (prev.mode === mode) {
          return prev;
        }

        if (prev.mode === 'sora3') {
          sora3ParamsCache.current = prev.params as Sora3Params;
        } else {
          reframeParamsCache.current = prev.params as ReframeParams;
        }

        const nextParams =
          mode === 'sora3'
            ? sora3ParamsCache.current
            : reframeParamsCache.current;
        if (mode === 'sora3') {
          return {
            mode: 'sora3',
            params: { ...(nextParams as Sora3Params) }
          } as ModeParams;
        }
        return {
          mode: 'reframe',
          params: { ...(nextParams as ReframeParams) }
        } as ModeParams;
      });

      setGenerationMode(mode);
      // avoid redundant push to prevent history spam
      const target = routeFromMode(mode);
      if (pathname !== target) {
        router.push(target);
      }
    },
    [setModeParams, setGenerationMode, router, pathname, routeFromMode]
  );
  const handleSora3ParamsChange = useCallback(
    (params: Sora3Params) => {
      sora3ParamsCache.current = params;
      
      // If model is veo3.1, switch to veo3 mode
      if (params.model === 'veo3.1') {
        const veo3Params: Veo3Params = {
          prompt: params.prompt,
          model: 'veo3_fast',
          generationType: 'TEXT_2_VIDEO',
          aspectRatio: params.aspectRatio === '16:9' ? '16:9' : params.aspectRatio === '9:16' ? '9:16' : '16:9',
          enableTranslation: true
        };
        veo3ParamsCache.current = veo3Params;
        setModeParams({ mode: 'veo3', params: veo3Params });
      } else {
        setModeParams({ mode: 'sora3', params });
      }
    },
    [setModeParams]
  );
  const handleReframeParamsChange = useCallback(
    (params: ReframeParams) => {
      reframeParamsCache.current = params;
      
      // If model is changed to veo3.1, keep in reframe mode but use Veo3ImageMode
      // If model is changed to sora3, update the model
      if (params.model === 'veo3.1') {
        setModeParams({ mode: 'reframe', params });
      } else {
        setModeParams({ mode: 'reframe', params });
      }
    },
    [setModeParams]
  );
  
  // Handle model change from Veo3Mode or Veo3ImageMode
  const handleModelChange = useCallback(
    (model: 'sora3' | 'veo3.1') => {
      if (model === 'veo3.1') {
        // Already in veo3 mode, do nothing
        return;
      } else if (model === 'sora3') {
        // Switch to sora3 mode
        const sora3Params: Sora3Params = {
          prompt: modeParams.mode === 'veo3' 
            ? (modeParams.params as Veo3Params).prompt 
            : modeParams.mode === 'reframe'
            ? (modeParams.params as ReframeParams).prompt || ''
            : '',
          aspectRatio: modeParams.mode === 'veo3'
            ? (modeParams.params as Veo3Params).aspectRatio === 'Auto' ? '16:9' : (modeParams.params as Veo3Params).aspectRatio
            : modeParams.mode === 'reframe'
            ? (modeParams.params as ReframeParams).targetAspectRatio === 'Auto' ? '16:9' : (modeParams.params as ReframeParams).targetAspectRatio
            : '16:9',
          duration: 8,
          model: 'sora3'
        };
        sora3ParamsCache.current = sora3Params;
        setModeParams({ mode: 'sora3', params: sora3Params });
      }
    },
    [modeParams, setModeParams]
  );
  const handleVeo3ParamsChange = useCallback(
    (params: Veo3Params) => {
      veo3ParamsCache.current = params;
      setModeParams({ mode: 'veo3', params });
    },
    [setModeParams]
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [pendingCost, setPendingCost] = useState<number | undefined>(undefined);
  
  // Job management state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  // subscription modal removed for generation gating
  
  // Watermark remover state
  const [videoUrl, setVideoUrl] = useState('https://sora.chatgpt.com/p/s_68e83bd7eee88191be79d2ba7158516f');
  const [outputUrl, setOutputUrl] = useState<string | undefined>(undefined);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [watermarkError, setWatermarkError] = useState<string | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  
  const userCredits = subscription?.credits || 0;
  
  const isValid = useMemo(() => /^https:\/\/sora\.chatgpt\.com\//.test(videoUrl.trim()), [videoUrl]);

  // Get sample video based on generation mode (consistent with home page)
  const getSampleVideoForMode = useCallback((mode: GenerationMode): SampleVideo | null => {
    if (mode === 'sora3') {
      // Use sushi video for text-to-video (sora3 mode)
      return {
        id: 'sample-sushi',
        prompt: 'A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant. Close-up shots of precise knife work cutting fresh salmon. Rice being molded with practiced hands. Elegant presentation on wooden serving board. Natural window lighting with clean aesthetic. ASMR-style detail focus.',
        videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.sushi),
        thumbnailUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=450&fit=crop',
        aspectRatio: '16:9',
        duration: 8,
        tags: ['food', 'sushi', 'asmr', 'text-to-video']
      };
    } else if (mode === 'reframe') {
      // Image to video example video - use running car video
      return {
        id: 'sample-running-car',
        prompt: 'A car running on a highway with smooth motion and dynamic camera movement. Converted from static image to video with natural motion.',
        videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.runningCar),
        thumbnailUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=450&fit=crop',
        aspectRatio: '16:9',
        duration: 8,
        tags: ['image-to-video', 'animation', 'motion', 'car']
      };
    } else if (mode === 'veo3') {
      // Veo3 mode is also text-to-video, use sushi video
      return {
        id: 'sample-sushi',
        prompt: 'A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant. Close-up shots of precise knife work cutting fresh salmon. Rice being molded with practiced hands. Elegant presentation on wooden serving board. Natural window lighting with clean aesthetic. ASMR-style detail focus.',
        videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.sushi),
        thumbnailUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=450&fit=crop',
        aspectRatio: '16:9',
        duration: 8,
        tags: ['food', 'sushi', 'asmr', 'text-to-video']
      };
    }
    return null;
  }, []);

  // Load sample video based on current mode
  useEffect(() => {
    const sample = getSampleVideoForMode(modeParams.mode);
    if (sample) {
      setSampleVideo(sample);
      // Always show sample video for all users
      setShowingSample(true);
    }
  }, [modeParams.mode, getSampleVideoForMode]);

  // Load sample video on mount for all users
  // Also check for prompt from URL query parameter
  useEffect(() => {
    
    // Check if prompt is provided in URL
    const urlPrompt = searchParams?.get('prompt');
    
    // Pre-fill the prompt with URL parameter if available, otherwise keep empty
    if (urlPrompt) {
      setModeParams(prev => {
        if (prev.mode === 'sora3') {
          return {
            mode: 'sora3',
            params: {
              ...prev.params,
              prompt: decodeURIComponent(urlPrompt),
            }
          };
        }
        return prev;
      });
    }
    
    // Clean up URL parameter after reading
    if (urlPrompt) {
      const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
      newSearchParams.delete('prompt');
      const newUrl = newSearchParams.toString() 
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      router.replace(newUrl);
    }
  }, [setModeParams, searchParams, pathname, router]);

  // Polling for job updates
  const onJobUpdate = useCallback((updatedJob: Job) => {
    const prevJob = jobs.find(j => j.jobId === updatedJob.jobId);
    
    console.log('🔄 onJobUpdate called:', {
      jobId: updatedJob.jobId,
      status: updatedJob.status,
      prevStatus: prevJob?.status,
      hasResultUrl: !!updatedJob.result_url,
      resultUrl: updatedJob.result_url ? updatedJob.result_url.substring(0, 80) + '...' : 'N/A',
      resultUrlFull: updatedJob.result_url, // 完整 URL 用于调试
      resultUrlType: typeof updatedJob.result_url,
      resultUrlLength: updatedJob.result_url?.length,
      progress: updatedJob.progress,
      isCurrentJob: currentJob?.jobId === updatedJob.jobId,
      currentJobHasUrl: !!currentJob?.result_url,
      willUpdateCurrentJob: currentJob?.jobId === updatedJob.jobId || (!currentJob && (updatedJob.status === 'SUCCEEDED' || !!updatedJob.result_url))
    });
    
    // Update jobs list
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.jobId === updatedJob.jobId ? updatedJob : job
      )
    );
    
    // Update current job if it's the one being updated
    // 关键修复：只要有result_url，就应该更新currentJob，无论状态如何
    const hasResultUrl = !!updatedJob.result_url && 
                        typeof updatedJob.result_url === 'string' && 
                        updatedJob.result_url.trim().length > 0;
    
    // 检查是否是当前job或者应该设置为当前job
    const isCurrentJob = currentJob?.jobId === updatedJob.jobId;
    const currentJobHasResultUrl = !!currentJob?.result_url && 
                                   typeof currentJob.result_url === 'string' && 
                                   currentJob.result_url.trim().length > 0;
    
    // 修复：放宽更新条件
    // 1. 如果是当前job，总是更新
    // 2. 如果没有currentJob，且新job有result_url或状态是SUCCEEDED，设置为currentJob
    // 3. 如果新job有result_url，且当前job没有result_url，更新为新的job（即使不是同一个job）
    const shouldSetAsCurrent = !currentJob && (updatedJob.status === 'SUCCEEDED' || hasResultUrl);
    const shouldUpdateCurrent = isCurrentJob || 
                                (currentJob && hasResultUrl && currentJob.jobId === updatedJob.jobId) ||
                                (hasResultUrl && !currentJobHasResultUrl);
    
    console.log('🔍 onJobUpdate currentJob check:', {
      jobId: updatedJob.jobId,
      currentJobId: currentJob?.jobId,
      isCurrentJob: isCurrentJob,
      shouldSetAsCurrent: shouldSetAsCurrent,
      shouldUpdateCurrent: shouldUpdateCurrent,
      hasResultUrl: hasResultUrl,
      currentJobHasResultUrl: currentJobHasResultUrl,
      status: updatedJob.status,
      resultUrl: updatedJob.result_url ? updatedJob.result_url.substring(0, 80) + '...' : 'N/A',
      updateReason: isCurrentJob ? 'isCurrentJob' : 
                    (currentJob && hasResultUrl && currentJob.jobId === updatedJob.jobId) ? 'sameJobWithResultUrl' :
                    (hasResultUrl && !currentJobHasResultUrl) ? 'newJobHasResultUrl' : 'none'
    });
    
    if (shouldUpdateCurrent || shouldSetAsCurrent) {
      console.log('✅ Updating currentJob:', {
        jobId: updatedJob.jobId,
        oldStatus: currentJob?.status,
        newStatus: updatedJob.status,
        oldHasResultUrl: !!currentJob?.result_url,
        oldResultUrl: currentJob?.result_url ? currentJob.result_url.substring(0, 80) + '...' : 'N/A',
        newHasResultUrl: hasResultUrl,
        newResultUrl: updatedJob.result_url ? updatedJob.result_url.substring(0, 80) + '...' : 'N/A',
        newResultUrlFull: updatedJob.result_url, // 完整 URL 用于调试
        resultUrlChanged: currentJob?.result_url !== updatedJob.result_url,
        willShowVideo: hasResultUrl || (updatedJob.status === 'SUCCEEDED' && hasResultUrl),
        reason: isCurrentJob ? 'isCurrentJob' : shouldSetAsCurrent ? 'shouldSetAsCurrent' : 'hasResultUrl'
      });
      // 强制更新，确保result_url被传递
      const updatedCurrentJob = {
        ...updatedJob,
        result_url: updatedJob.result_url // 确保result_url被明确设置
      };
      console.log('📝 Setting currentJob with result_url:', {
        jobId: updatedCurrentJob.jobId,
        status: updatedCurrentJob.status,
        hasResultUrl: !!updatedCurrentJob.result_url,
        resultUrl: updatedCurrentJob.result_url
      });
      setCurrentJob(updatedCurrentJob);
    } else {
      console.log('⏭️ Skipping currentJob update:', {
        jobId: updatedJob.jobId,
        currentJobId: currentJob?.jobId,
        reason: 'Conditions not met',
        hasResultUrl: hasResultUrl,
        status: updatedJob.status
      });
    }
  }, [currentJob, jobs]);

  const { startPolling } = useJobsPolling({
    jobs,
    onJobUpdate
  });

  // Load jobs on mount (only if authenticated)
  const lastLoadedUserIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    // Only load jobs if user ID changed (not just reference)
    const userId = user.id;
    if (lastLoadedUserIdRef.current === userId) {
      return;
    }
    
    const loadJobs = async () => {
      try {
        // Only load recent jobs to reduce polling overhead
        const existingJobs = await videoApi.getJobs(5);
        setJobs(existingJobs);
        console.log(`[GENERATE] Loaded ${existingJobs.length} recent jobs`);
        lastLoadedUserIdRef.current = userId;
      } catch (error) {
        console.error('Failed to load jobs:', error);
      }
    };
    
    loadJobs();
  }, [isAuthenticated, user?.id]);

  // Form validation
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    
    switch (modeParams.mode) {
      case 'veo3': {
        const params = modeParams.params;
        if (!params.prompt?.trim()) {
          newErrors.prompt = "Prompt cannot be empty";
        }
        
        // Validate imageUrls based on generationType
        if (params.generationType === 'FIRST_AND_LAST_FRAMES_2_VIDEO' && (!params.imageUrls || params.imageUrls.length === 0)) {
          newErrors.reference_image = "At least 1 image URL is required for First and Last Frames mode";
        } else if (params.generationType === 'REFERENCE_2_VIDEO' && (!params.imageUrls || params.imageUrls.length === 0)) {
          newErrors.reference_image = "At least 1 image URL is required for Reference mode";
        }
        
        // REFERENCE_2_VIDEO only supports Fast model and 16:9
        if (params.generationType === 'REFERENCE_2_VIDEO') {
          if (params.model !== 'veo3_fast') {
            newErrors.prompt = "REFERENCE_2_VIDEO mode only supports veo3_fast model";
          }
          if (params.aspectRatio !== '16:9') {
            newErrors.prompt = "REFERENCE_2_VIDEO mode only supports 16:9 aspect ratio";
          }
        }
        break;
      }
      
      case 'sora3': {
        const params = modeParams.params;
        if (!params.prompt?.trim()) {
          newErrors.prompt = tGenerate('pleaseEnterPrompt');
        } else if (params.prompt.length > 1000) {
          newErrors.prompt = "Prompt cannot exceed 1000 characters";
        }
        
        if (params.negative_prompt && params.negative_prompt.length > 300) {
          newErrors.negative_prompt = "Negative prompt cannot exceed 300 characters";
        }
        break;
      }
      
      case 'reframe': {
        const params = modeParams.params;
        if (params.model === 'veo3.1') {
          // Veo3.1 requires at least start frame or end frame
          if (!params.startFrame && !params.endFrame) {
            newErrors.reference_image = tGenerate('errors.uploadAtLeastOneImage');
          }
          if (!params.prompt?.trim()) {
            newErrors.prompt = tGenerate('pleaseEnterPrompt');
          }
        } else {
          // Sora3 requires sourceVideo
          if (!params.sourceVideo) {
            newErrors.reference_image = tGenerate('pleaseUploadImage');
          }
          if (!params.prompt?.trim()) {
            newErrors.prompt = tGenerate('pleaseEnterPrompt');
          }
        }
        break;
      }
    }
    
    return newErrors;
  }, [modeParams]);

  // Handle form submission
  const handleGenerate = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    
    // Validate form first (check prompt/image)
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      // Show toast notification for prompt error
      if (validationErrors.prompt === tGenerate('pleaseEnterPrompt')) {
        toast.error('Please enter your prompt');
      }
      setErrors(validationErrors);
      return;
    }
    
    // Check credits balance using unified credit calculator
    const n_frames = modeParams.mode === 'sora3'
      ? (modeParams.params as Sora3Params).n_frames
      : (modeParams.params as ReframeParams).n_frames;
    
    const sora3Params = modeParams.mode === 'sora3' ? (modeParams.params as Sora3Params) : null;
    const reframeParams = modeParams.mode === 'reframe' ? (modeParams.params as ReframeParams) : null;
    const model = sora3Params?.model || reframeParams?.model || 'sora3';
    const quality = sora3Params?.quality || reframeParams?.quality;
    
    const estimatedCost = calculateCredits(
      (modeParams.mode === 'sora3'
        ? (modeParams.params.duration || 8)
        : 8) as number,
      modeParams.mode === 'sora3'
        ? (modeParams.params.aspectRatio || '16:9')
        : (modeParams.params.targetAspectRatio || '16:9'),
      model,
      n_frames,
      quality
    );

    if (userCredits < estimatedCost) {
      setPendingCost(estimatedCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    setErrors({});
    setIsGenerating(true);
    setShowingSample(false); // 关键修复：生成开始时立即隐藏示例视频

    try {
      let request: CreateJobRequest;
      
      // Convert mode-specific params to CreateJobRequest
      if (modeParams.mode === 'veo3') {
        const params = modeParams.params;
        request = {
          prompt: params.prompt.trim(),
          duration_sec: 8 as Duration, // Veo3.1 defaults to 8 seconds
          aspect_ratio: params.aspectRatio === 'Auto' ? '16:9' : params.aspectRatio === '9:16' ? '9:16' : '16:9',
          cfg_scale: 7,
          model: 'veo3.1',
          // Veo3.1 specific fields
          veo3Params: {
            model: params.model,
            generationType: params.generationType,
            imageUrls: params.imageUrls,
            seeds: params.seeds,
            enableTranslation: params.enableTranslation,
            watermark: params.watermark
          }
        };
      } else if (modeParams.mode === 'sora3') {
        const params = modeParams.params;
        request = {
          prompt: params.prompt.trim(),
          negative_prompt: params.negative_prompt?.trim(),
          duration_sec: (params.duration || 8) as Duration,
          aspect_ratio: params.aspectRatio,
          cfg_scale: 7,
          model: params.model || 'sora3',
          n_frames: params.n_frames,
          quality: params.quality // Add quality field for sora3-pro
        };
      } else if (modeParams.mode === 'reframe') {
        const params = modeParams.params;
        
        // Handle Veo3.1 image-to-video
        if (params.model === 'veo3.1') {
          // Upload start and end frames
          const imageUrls: string[] = [];
          
          if (params.startFrame) {
            try {
              const startUrl = await videoApi.uploadVideo(params.startFrame, user.id);
              imageUrls.push(startUrl);
            } catch (uploadError) {
              throw new Error(`Failed to upload start frame: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
            }
          }
          
          if (params.endFrame) {
            try {
              const endUrl = await videoApi.uploadVideo(params.endFrame, user.id);
              imageUrls.push(endUrl);
            } catch (uploadError) {
              throw new Error(`Failed to upload end frame: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
            }
          }

          if (imageUrls.length === 0) {
            throw new Error(tGenerate('errors.atLeastOneImageRequired'));
          }

          request = {
            prompt: params.prompt?.trim() || tGenerate('defaultPrompts.smoothTransition'),
            duration_sec: 8 as Duration,
            aspect_ratio: params.targetAspectRatio === 'Auto' ? '16:9' : params.targetAspectRatio === '9:16' ? '9:16' : '16:9',
            cfg_scale: 7,
            model: 'veo3.1',
            veo3Params: {
              model: params.veo3SubModel || 'veo3_fast', // Use selected sub-model or default to fast
              generationType: imageUrls.length === 1 ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'FIRST_AND_LAST_FRAMES_2_VIDEO',
              imageUrls: imageUrls,
              seeds: params.seeds,
              enableTranslation: true
            }
          };
        } else {
          // Handle Sora3 image-to-video (existing logic)
          // Upload source video first to get public URL
          if (!params.sourceVideo) {
            console.error('Source video is missing:', { params, modeParams });
            throw new Error(tGenerate('errors.referenceImageUrlRequired'));
          }

          let videoUrl: string | undefined;
          try {
            console.log('Uploading source video:', { 
              fileName: params.sourceVideo.name, 
              fileSize: params.sourceVideo.size,
              fileType: params.sourceVideo.type 
            });
            videoUrl = await videoApi.uploadVideo(params.sourceVideo, user.id);
            console.log('Upload successful, videoUrl:', videoUrl);
          } catch (uploadError) {
            // 如果错误信息已经包含详细说明，直接使用；否则添加前缀
            const errorMsg = uploadError instanceof Error ? uploadError.message : 'Unknown error';
            console.error('Upload failed:', { error: uploadError, errorMsg });
            if (errorMsg.includes('Failed to upload') || errorMsg.includes('Permission') || errorMsg.includes('too large')) {
              throw new Error(errorMsg);
            }
            throw new Error(`Failed to upload reference image: ${errorMsg}`);
          }

          if (!videoUrl) {
            console.error('Upload succeeded but videoUrl is empty:', { params, videoUrl });
            throw new Error(tGenerate('errors.referenceImageUrlRequired'));
          }

          request = {
            prompt: params.prompt?.trim() || tGenerate('defaultPrompts.smoothAnimation'),
            duration_sec: 8,
            aspect_ratio: params.targetAspectRatio === 'Auto' ? '16:9' : params.targetAspectRatio === '9:16' ? '9:16' : '16:9',
            cfg_scale: 7,
            reference_image_url: videoUrl,
            model: params.model || 'sora3',
            n_frames: params.n_frames,
            quality: params.quality // Add quality field for sora3-pro
          };
        }
      } else {
        throw new Error('Invalid generation mode');
      }

      const response = await videoApi.createJob(request, modeParams.mode);

      // 验证响应
      if (!response || !response.jobId) {
        console.error('Invalid response from createJob:', response);
        throw new Error(`Invalid response from server: missing jobId. Response: ${JSON.stringify(response)}`);
      }

      // Create initial job object
      const newJob: Job = {
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        params: request,
        created_at: new Date().toISOString(),
        visibility: 'private',
        creditCost: estimatedCost
      };

      console.log('Creating new job:', {
        jobId: newJob.jobId,
        status: newJob.status,
        responseStatus: response.status,
        fullResponse: response
      });

      // 添加更明显的日志
      console.warn('📝 NEW JOB CREATED:', {
        jobId: newJob.jobId,
        status: newJob.status,
        timestamp: new Date().toISOString()
      });

      // Add to jobs list and set as current job
      setJobs(prevJobs => [newJob, ...prevJobs]);
      setCurrentJob(newJob);
      
      // Start polling for this job
      try {
        startPolling(response.jobId);
      } catch (pollingError) {
        console.error('Failed to start polling:', pollingError);
        // 不抛出错误，因为任务已经创建成功
      }
      
    } catch (error) {
      // 首先立即记录原始错误，避免在提取过程中丢失信息
      // 使用更安全的方式记录错误，避免序列化问题
      const errorInfo: any = {
        errorType: typeof error,
        isError: error instanceof Error,
        isNull: error === null,
        isUndefined: error === undefined,
      };
      
      if (error instanceof Error) {
        errorInfo.name = error.name;
        errorInfo.message = error.message;
        errorInfo.stack = error.stack;
        errorInfo.cause = error.cause;
      } else if (error && typeof error === 'object') {
        errorInfo.constructor = error.constructor?.name;
        try {
          errorInfo.keys = Object.keys(error);
          // 尝试获取所有属性（包括不可枚举的）
          errorInfo.ownPropertyNames = Object.getOwnPropertyNames(error);
        } catch (e) {
          errorInfo.keysError = e instanceof Error ? e.message : String(e);
        }
        
        // 尝试获取常见错误属性
        if ('message' in error) errorInfo.message = (error as any).message;
        if ('error' in error) errorInfo.error = (error as any).error;
        if ('details' in error) errorInfo.details = (error as any).details;
        if ('status' in error) errorInfo.status = (error as any).status;
        if ('statusText' in error) errorInfo.statusText = (error as any).statusText;
      } else {
        errorInfo.rawValue = String(error);
      }
      
      console.error('[ERROR] Raw error caught:', errorInfo);
      
      // 提取错误信息，处理各种错误类型
      let errorMessage = 'Failed to create generation job';
      let errorDetails: any = { _rawError: error };
      let errorType = 'unknown';
      
      try {
        if (error === null || error === undefined) {
          errorMessage = 'Error is null or undefined';
          errorType = error === null ? 'null' : 'undefined';
          errorDetails = { type: errorType };
        } else if (error instanceof Error) {
          errorMessage = error.message || 'Unknown error';
          errorType = error.name || 'Error';
          errorDetails = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause
          };
        } else if (typeof error === 'string') {
          errorMessage = error;
          errorType = 'string';
          errorDetails = { message: error };
        } else if (typeof error === 'object') {
          // 安全地获取错误类型
          try {
            errorType = (error as any)?.constructor?.name || 'object';
          } catch {
            errorType = typeof error;
          }
          
          // 获取所有可枚举的属性
          const errorKeys = Object.keys(error as any);
          const errorEntries = Object.entries(error as any);
          
          // 尝试从对象中提取错误信息
          const possibleMessages = [
            (error as any).message,
            (error as any).error,
            (error as any).msg,
            (error as any).description,
            (error as any).toString?.(),
            String(error)
          ].filter(Boolean);
          
          errorMessage = possibleMessages[0] || `Object error with ${errorKeys.length} keys`;
          
          // 安全地序列化错误对象，处理循环引用
          try {
            const seen = new WeakSet();
            const safeEntries = errorEntries.filter(([key]) => 
              !['request', 'response', 'config', 'stack', 'cause'].includes(key)
            );
            
            // 提取所有可序列化的属性
            const serializableProps: any = {};
            for (const [key, value] of safeEntries) {
              try {
                if (typeof value === 'function') {
                  serializableProps[key] = '[Function]';
                } else if (typeof value === 'object' && value !== null) {
                  if (seen.has(value)) {
                    serializableProps[key] = '[Circular]';
                  } else {
                    seen.add(value);
                    serializableProps[key] = value;
                  }
                } else {
                  serializableProps[key] = value;
                }
              } catch {
                serializableProps[key] = '[Cannot serialize]';
              }
            }
            
            errorDetails = {
              keys: errorKeys,
              entryCount: safeEntries.length,
              properties: serializableProps,
              stringified: JSON.stringify(error, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                  if (seen.has(value)) {
                    return '[Circular]';
                  }
                  seen.add(value);
                }
                if (typeof value === 'function') {
                  return '[Function]';
                }
                return value;
              })
            };
          } catch (stringifyError) {
            errorDetails = {
              keys: errorKeys,
              message: String(error),
              stringifyError: stringifyError instanceof Error ? stringifyError.message : String(stringifyError),
              rawError: error
            };
          }
        } else {
          errorType = typeof error;
          errorMessage = String(error);
          errorDetails = { 
            type: errorType,
            raw: error,
            stringified: String(error)
          };
        }
      } catch (extractError) {
        // 如果提取错误信息时出错，使用最基本的方式
        errorMessage = 'Failed to extract error information';
        errorType = 'extraction_failed';
        errorDetails = {
          extractionError: extractError instanceof Error ? extractError.message : String(extractError),
          rawError: String(error),
          originalErrorType: typeof error
        };
      }
      
      console.error('Failed to create job:', {
        errorMessage,
        errorDetails,
        errorType,
        modeParams: {
          mode: modeParams.mode,
          hasParams: !!modeParams.params
        },
        timestamp: new Date().toISOString()
      });

      // Enhanced error handling with specific messages
      if (/\b402\b/.test(errorMessage) || /HTTP\s*402/.test(errorMessage) || errorMessage.includes('Insufficient credits')) {
        // Show subscription modal for insufficient balance
        setPendingCost(estimatedCost);
        setShowSubscriptionModal(true);
      } else if (errorMessage.includes('Insufficient credits')) {
        // Parse the detailed error response
        try {
          const errorData = JSON.parse(errorMessage);
          if (errorData.required && errorData.available !== undefined) {
            setErrors({ 
              prompt: tGenerate('insufficientCreditsWithDetails', {
                required: errorData.required,
                available: errorData.available,
                details: errorData.details || tGenerate('insufficientCredits')
              })
            });
          } else {
            setErrors({ prompt: tGenerate('insufficientCredits') });
          }
        } catch {
          setErrors({ prompt: tGenerate('insufficientCredits') });
        }
      } else if (errorMessage.includes('upload') || errorMessage.includes('video') || errorMessage.includes('bucket') || errorMessage.includes('reference image') || errorMessage.includes('Reference image')) {
        // 检查是否是 bucket 不存在的错误
        if (errorMessage.includes('bucket') || errorMessage.includes('Bucket not found')) {
          setErrors({ 
            reference_image: tGenerate('storageBucketNotConfigured')
          });
        } else {
          setErrors({ reference_image: errorMessage });
        }
      } else if (errorMessage.includes('credit') || errorMessage.includes('Failed to deduct credits')) {
        // 提供更详细的错误信息
        const detailedError = errorMessage.includes('Failed to deduct credits') 
          ? tGenerate('creditDeductionFailed', { error: errorMessage })
          : tGenerate('creditSystemError', { error: errorMessage });
        setErrors({ prompt: detailedError });
      } else {
        setErrors({ prompt: errorMessage });
      }
    } finally {
      setIsGenerating(false);
      // 如果生成失败且没有当前任务，恢复显示示例视频
      // 注意：这里不能直接检查 currentJob，因为它是异步更新的
      // 所以我们在 catch 块中处理
    }
  }, [modeParams, startPolling, user, isAuthenticated, userCredits, validateForm, calculateCredits]);

  // Handle retry
  const handleRetry = useCallback(async (job: Job) => {
    if (!user?.id) {
      console.error('User not authenticated');
      setShowAuthModal(true);
      return;
    }
    
    // Check credits balance
    if (userCredits <= 0) {
      setErrors({ 
        prompt: tGenerate('insufficientCreditsRetry')
      });
      return;
    }
    
    setErrors({});
    
    try {
      const mode = job.params.reference_image_url ? 'reframe' : 'sora3';
      
      // 调试：检查重试参数
      console.log('🔄 Retry parameters:', {
        mode,
        params: job.params,
        hasPrompt: !!job.params.prompt,
        hasDurationSec: !!job.params.duration_sec,
        hasAspectRatio: !!job.params.aspect_ratio,
        hasReferenceImage: !!job.params.reference_image_url
      });
      
      const response = await videoApi.createJob(job.params, mode);

      const retryCost = calculateCredits(
        job.params.duration_sec,
        job.params.aspect_ratio,
        mode,
        job.params.n_frames as '10' | '15' | undefined
      );

      const newJob: Job = {
        ...job,
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        created_at: new Date().toISOString(),
        error: undefined,
        creditCost: retryCost
      };

      setJobs(prevJobs => [newJob, ...prevJobs]);
      setCurrentJob(newJob);
      startPolling(response.jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry job';
      
      if (errorMessage.includes('credit')) {
        setErrors({ prompt: 'Insufficient credits. Please purchase more credits.' });
      } else {
        setErrors({ prompt: errorMessage });
      }
    }
  }, [startPolling, user, userCredits, calculateCredits]);

  // Handle cancel
  const handleCancel = useCallback(async (jobId: string) => {
    try {
      await videoApi.cancelJob(jobId);
      
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.jobId === jobId
            ? { ...job, status: 'CANCELED' as const }
            : job
        )
      );
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  }, []);

  // Handle copy params
  const handleCopyParams = useCallback(
    (job: Job) => {
      const mode = job.params.reference_image_url ? 'reframe' : 'sora3';

      setModeParams(prev => {
        if (prev.mode === 'sora3') {
          sora3ParamsCache.current = prev.params as Sora3Params;
        } else {
          reframeParamsCache.current = prev.params as ReframeParams;
        }

        if (mode === 'reframe') {
          const params: ReframeParams = {
            sourceVideo: undefined,
            targetAspectRatio:
              job.params.aspect_ratio === '1:1'
                ? '16:9'
                : job.params.aspect_ratio,
            style: 'zoom',
            speed: 'normal',
            prompt: job.params.prompt
          };

          return {
            mode: 'reframe',
            params
          };
        }

        const params: Sora3Params = {
          prompt: job.params.prompt,
          negative_prompt: job.params.negative_prompt || '',
          duration: job.params.duration_sec,
          aspectRatio: job.params.aspect_ratio,
          style: 'realistic'
        };

        return {
          mode: 'sora3',
          params
        };
      });

      setGenerationMode(mode);
      const target = routeFromMode(mode);
      if (pathname !== target) {
        router.push(target);
      }
    },
    [setModeParams, setGenerationMode, router, pathname, routeFromMode]
  );

  // Sync external URL -> internal mode
  useEffect(() => {
    const next = modeFromPathname(pathname || '');
    if (next !== generationMode) {
      // only update state; handleModeChange would push again
      setModeParams(prev => {
        if (prev.mode === next) return prev;
        const nextParams = next === 'sora3' ? sora3ParamsCache.current : reframeParamsCache.current;
        if (next === 'sora3') {
          return { mode: 'sora3', params: { ...(nextParams as Sora3Params) } } as ModeParams;
        }
        return { mode: 'reframe', params: { ...(nextParams as ReframeParams) } } as ModeParams;
      });
      setGenerationMode(next);
    }
  }, [pathname, modeFromPathname]);

  // Handle toggle visibility
  const handleToggleVisibility = useCallback((jobId: string, visibility: 'public' | 'private') => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.jobId === jobId
          ? { ...job, visibility }
          : job
      )
    );
  }, []);

  // Watermark remover handler
  const handleWatermarkRun = useCallback(async () => {
    setWatermarkError(undefined);
    setOutputUrl(undefined);

    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (!hasActiveSubscription) { 
      setShowSubscriptionModal(true); 
      return; 
    }
    if (!isValid) {
      setWatermarkError(tGenerate('errors.invalidSoraUrl'));
      return;
    }

    // Pre-check: requires 10 credits
    if ((subscription?.credits || 0) < 10) { 
      setPendingCost(10); 
      setShowBalanceDialog(true); 
      return; 
    }

    setIsRunning(true);
    try {
      const res = await watermarkApi.create(videoUrl);
      setJobId(res.jobId);
      // poll using existing status endpoint
      const poll = async () => {
        try {
          const session = await (await import('@/lib/supabase')).supabase.auth.getSession();
          const token = session.data.session?.access_token;
          
          if (!token) {
            throw new Error('Authentication required');
          }

          let resp: Response;
          try {
            resp = await fetch(`/api/kie/status/${res.jobId}`, { 
              headers: { 
                'Authorization': `Bearer ${token}` 
              }, 
              cache: 'no-store' 
            });
          } catch (fetchError) {
            // Handle network errors (CORS, connection refused, etc.)
            const errorMessage = fetchError instanceof Error 
              ? fetchError.message 
              : (typeof fetchError === 'string' ? fetchError : 'Network error occurred');
            
            console.error('Fetch error in watermark polling:', {
              error: errorMessage,
              url: `/api/kie/status/${res.jobId}`,
              isNetworkError: errorMessage.includes('fetch') || errorMessage.includes('network')
            });
            
            // Retry on network errors
            throw new Error(`Network error: ${errorMessage}. Retrying...`);
          }
          
          if (!resp.ok) {
            const errorText = await resp.text().catch(() => '');
            throw new Error(`Status HTTP ${resp.status}${errorText ? `: ${errorText}` : ''}`);
          }
          
          let data: any;
          try {
            data = await safeJsonParse(resp);
          } catch (parseError) {
            console.error('Failed to parse status response:', parseError);
            throw new Error(`Invalid response from server: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          }
          
          // If video URL is available, consider it completed regardless of status
          if (data.result_url && typeof data.result_url === 'string' && data.result_url.trim().length > 0) {
            setOutputUrl(data.result_url.trim());
            setIsRunning(false);
            return;
          }
          
          // Also handle explicit completed status without URL
          if (data.status === 'completed') {
            if (data.result_url) {
              setOutputUrl(data.result_url);
              setIsRunning(false);
              return;
            } else {
              // Completed but no URL - this is an error
              throw new Error('Task completed but no video URL received');
            }
          }
          
          // Continue polling if not completed
          if (data.status === 'failed' || data.status === 'error') {
            throw new Error(data.error || 'Task failed');
          }
          
          setTimeout(poll, 2000);
        } catch (pollError: any) {
          console.error('Poll error:', pollError);
          const errorMsg = pollError?.message || 'Failed to check status';
          
          // Don't retry on authentication errors or client errors
          if (pollError?.message?.includes('Authentication') || 
              (pollError?.message?.includes('HTTP 4'))) {
            setWatermarkError(errorMsg);
            setIsRunning(false);
            return;
          }
          
          // Retry on network errors
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 1500);
    } catch (e: any) {
      const msg = e?.message || '';
      if (/HTTP\s*402/.test(msg) || /Insufficient\s*credits/i.test(msg)) {
        setPendingCost(10);
        setShowBalanceDialog(true);
      } else {
        setWatermarkError(msg || 'Failed to start task');
      }
      setIsRunning(false);
    }
  }, [isAuthenticated, hasActiveSubscription, isValid, videoUrl, subscription]);

  const isWatermarkRemover = pathname?.includes('/watermark-remover') ?? false;

  return (
    <div className="min-h-screen bg-background flex">
      <SEOHead 
        title={isWatermarkRemover 
          ? tGenerate('watermarkRemover.seoTitle')
          : routeFromMode(generationMode) === '/sora3-image-to-video' 
          ? tGenerate('imageToVideoTitle')
          : tGenerate('textToVideoTitle')}
        description={isWatermarkRemover
          ? tGenerate('watermarkRemover.seoDescription')
          : routeFromMode(generationMode) === '/sora3-image-to-video'
          ? tGenerate('imageToVideoSubtitle')
          : tGenerate('textToVideoSubtitle')}
        canonical={isWatermarkRemover 
          ? 'https://sora3ai.io/watermark-remover'
          : routeFromMode(generationMode) === '/sora3-image-to-video' ? 'https://sora3ai.io/sora3-image-to-video' : 'https://sora3ai.io/sora3-text-to-video'}
        keywords={isWatermarkRemover
          ? "sora3 watermark remover,Sora watermark remover,remove watermark sora,watermark removal Sora3"
          : routeFromMode(generationMode) === '/sora3-image-to-video'
          ? "Sora3 workspace,Sora3 studio,Sora video generator,image to video,Sora3 AI,AI video workflow"
          : "text to video,AI video generator,text to video AI,AI video creator,cinematic video generator,AI video maker"}
      />
      <GenerateSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
      
      <div 
        className="flex-1 transition-all duration-300 pb-16 bg-background" 
        style={{ marginLeft: isMobile ? '0' : 'var(--sidebar-width, 240px)' }}
      >
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-muted transition-colors touch-action: manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
            style={{ touchAction: 'manipulation' }}
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}
        
        {/* Top Right: Language Switcher, Theme Toggle, Login and Start for Free */}
        <div className={`flex justify-end items-center gap-3 px-6 py-4 border-b border-border ${isMobile ? 'pt-16' : ''}`}>
          <LanguageSwitcher />
          <ThemeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-muted/50 transition-colors rounded-full px-2 py-1"
                >
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {getUserInitials()}
                  </div>
                  {/* User Name */}
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {getUserDisplayName()}
                  </span>
                  {/* Dropdown Arrow */}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center space-x-2 p-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {getUserInitials()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <User className="w-4 h-4 mr-2" />
                  {t('dashboard')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('preferences')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                {t('login')}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {t('startForFree')}
              </Button>
            </>
          )}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {isWatermarkRemover ? (
            <>
              <header className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{tGenerate('watermarkRemover.title')}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">{tGenerate('watermarkRemover.description')}</p>
              </header>

              {watermarkError && (
                <div className="mb-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{watermarkError}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-bold text-foreground uppercase tracking-wide">{tGenerate('watermarkRemover.input')}</span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">{tPricing('credits')}: {userCredits}</span>
                    </div>

                    <label className="block text-sm font-medium text-foreground mb-2">{tGenerate('watermarkRemover.videoUrl')}</label>
                    <input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={tGenerate('watermarkRemover.videoUrlPlaceholder')}
                      className={`w-full px-4 py-3 rounded-xl border bg-background ${isValid ? 'border-border' : 'border-red-500'}`}
                    />
                    <p className="text-xs text-muted-foreground mt-2">{tGenerate('watermarkRemover.videoUrlHint')}</p>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => { setVideoUrl(''); setOutputUrl(undefined); setWatermarkError(undefined); }}
                        className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted"
                      >{tGenerate('watermarkRemover.reset')}</button>
                      <button
                        onClick={handleWatermarkRun}
                        disabled={isRunning || !isValid}
                        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        {isRunning ? (
                          <span className="inline-flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> {tGenerate('watermarkRemover.running')}</span>
                        ) : (
                          <span className="inline-flex items-center gap-2"><Play className="w-4 h-4" /> {tGenerate('watermarkRemover.run', { credits: 10 })}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-bold text-foreground uppercase tracking-wide">{tGenerate('watermarkRemover.output')}</span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">video</span>
                    </div>

                    {outputUrl ? (
                      <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                        <video className="w-full h-full object-cover" controls src={outputUrl}>
                          <source src={outputUrl} />
                          {tGenerate('watermarkRemover.browserNotSupportVideo')}
                        </video>
                      </div>
                    ) : showingSample && sampleVideo ? (
                      <div className="space-y-4">
                        <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-accent" />
                            <span className="font-bold text-accent-foreground/80">{tGenerate('watermarkRemover.exampleVideo')}</span>
                          </div>
                          <p className="text-sm text-accent-foreground/80">
                            {tGenerate('watermarkRemover.exampleVideoDescription')}
                          </p>
                        </div>
                        
                        <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                          <video 
                            className="w-full h-full object-cover"
                            controls
                            poster={sampleVideo.thumbnailUrl}
                            src={sampleVideo.videoUrl}
                            preload="metadata"
                          >
                            <source src={sampleVideo.videoUrl} type="video/mp4" />
                            {tGenerate('watermarkRemover.browserNotSupportVideo')}
                          </video>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {sampleVideo.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                        {isRunning ? tGenerate('watermarkRemover.processing') : jobId ? tGenerate('watermarkRemover.waitingForResult') : tGenerate('watermarkRemover.noOutputYet')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 mb-8">
                <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-sm">{tGenerate('watermarkRemover.creditsInfo')}</p>
                </div>
              </div>

              {/* Documentation block */}
              <section className="mt-10 mb-16">
                <h2 className="text-2xl font-bold mb-6">Sora3 Watermark Remover Documentation</h2>

                {/* Feature rows */}
                <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
                  <div>
                    <h3 className="text-lg font-semibold">Intelligent Detection in Sora3 Watermark Remover</h3>
                    <p className="text-muted-foreground mt-2">
                      The <strong>sora3 watermark remover</strong> detects and tracks static or moving overlays with AI. It pinpoints logos, text and stickers, then reconstructs pixels so colors, motion, and structure stay true to the original.
                    </p>
                  </div>
                  <figure className="bg-card border border-border rounded-xl overflow-hidden">
                    <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/4.webp" alt="sora3 watermark remover intelligent detection" className="w-full h-auto" loading="lazy" />
                  </figure>
                </div>

                <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
                  <figure className="bg-card border border-border rounded-xl overflow-hidden order-2 md:order-1">
                    <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/2.webp" alt="sora3 watermark remover frame consistent output" className="w-full h-auto" loading="lazy" />
                  </figure>
                  <div className="order-1 md:order-2">
                    <h3 className="text-lg font-semibold">Remove Watermark with Frame‑Consistent Output</h3>
                    <p className="text-muted-foreground mt-2">
                      With motion‑aware tracking, the <strong>sora3 watermark remover</strong> preserves flow and lighting balance. Your clips stay smooth and stable without flicker—ready for export or re‑edit.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10 items-start mb-12">
                  <div>
                    <h3 className="text-lg font-semibold">Seamless Restoration and Audio Sync</h3>
                    <p className="text-muted-foreground mt-2">
                      Using AI reconstruction, the <strong>sora3 watermark remover</strong> fills removed regions naturally, restoring textures and color while keeping audio perfectly in sync for clean, high‑quality Sora videos.
                    </p>
                  </div>
                  <figure className="bg-card border border-border rounded-xl overflow-hidden">
                    <img src="https://lwugseurlnaogrjjlbqj.supabase.co/storage/v1/object/public/showcase-videos/3.webp" alt="sora3 watermark remover seamless restoration" className="w-full h-auto" loading="lazy" />
                  </figure>
                </div>

                {/* What you can remove */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">What You Can Remove Using Sora3 Watermark Remover</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Capabilities of the <strong>sora3 watermark remover</strong></p>
                <div className="grid md:grid-cols-2 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Sora3</div>
                    <h4 className="text-xl font-semibold mb-2">Remove Watermark from Sora3 Video</h4>
                    <p className="text-muted-foreground">AI tracking clears moving or static overlays while the <strong>sora3 watermark remover</strong> keeps motion smooth and natural.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Sora3 Pro</div>
                    <h4 className="text-xl font-semibold mb-2">Remove Watermark from Sora3 Pro Video</h4>
                    <p className="text-muted-foreground">Optimized for 1080p/cinematic outputs, the <strong>sora3 watermark remover</strong> handles embedded or semi‑transparent overlays.</p>
                  </div>
                </div>

                {/* Why remove */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">Why remove watermarks</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Benefits of using the <strong>sora3 watermark remover</strong></p>
                <div className="grid md:grid-cols-3 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Professional</div>
                    <h4 className="text-xl font-semibold mb-2">Create Clean, Professional Videos</h4>
                    <p className="text-muted-foreground">The <strong>sora3 watermark remover</strong> removes visual noise so clips look polished for marketing, social, and presentations.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Editing</div>
                    <h4 className="text-xl font-semibold mb-2">Prepare Clips for Editing & Reuse</h4>
                    <p className="text-muted-foreground">Start with a clean base—transitions, grading, and effects work better after the <strong>sora3 watermark remover</strong> pass.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-3">Workflow</div>
                    <h4 className="text-xl font-semibold mb-2">Integrate with AI Workflows</h4>
                    <p className="text-muted-foreground">Consistent, watermark‑free outputs make it easy to chain the <strong>sora3 watermark remover</strong> with other AI tools.</p>
                  </div>
                </div>

                {/* How to remove for free */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">How to remove for free</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Three easy steps with the <strong>sora3 watermark remover</strong></p>
                <div className="grid md:grid-cols-3 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">1</div>
                    <h4 className="text-xl font-semibold mb-2">Paste your Sora URL</h4>
                    <p className="text-muted-foreground">Open the playground and paste your video link; the <strong>sora3 watermark remover</strong> prepares it for AI detection.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">2</div>
                    <h4 className="text-xl font-semibold mb-2">Generate</h4>
                    <p className="text-muted-foreground">Click once— the <strong>sora3 watermark remover</strong> detects and removes logos/text across frames.</p>
                  </div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mb-4">3</div>
                    <h4 className="text-xl font-semibold mb-2">Download & integrate</h4>
                    <p className="text-muted-foreground">Preview and save the clean clip; integrate the <strong>sora3 watermark remover</strong> into your workflow.</p>
                  </div>
                </div>

                {/* Use cases */}
                <h3 className="text-3xl sm:text-4xl font-bold text-center mb-4">Use cases</h3>
                <p className="text-xl text-muted-foreground text-center mb-10">Where the <strong>sora3 watermark remover</strong> fits</p>
                <div className="grid md:grid-cols-3 gap-8 mb-14">
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Publish clean AI videos</h4><p className="text-muted-foreground">Use the <strong>sora3 watermark remover</strong> before posting to social, YouTube, or portfolios.</p></div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Editing & remix</h4><p className="text-muted-foreground">A clean base from the <strong>sora3 watermark remover</strong> avoids artifacts in transitions and effects.</p></div>
                  <div className="p-8 border border-border/50 rounded-2xl bg-card hover:border-primary/20 hover:shadow-lg transition-all"><h4 className="text-xl font-semibold mb-2">Automated pipelines</h4><p className="text-muted-foreground">Developers can batch clips through the <strong>sora3 watermark remover</strong> for consistent results.</p></div>
                </div>
              </section>

              {/* FAQ styled like homepage */}
              <section className="py-16 bg-muted/30 rounded-2xl">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3">Frequently asked <span className="text-primary">questions</span></h2>
                    <p className="text-xl text-muted-foreground">Quick answers about the <strong>sora3 watermark remover</strong></p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="divide-y divide-border">
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">How do I remove the watermark from a Sora video?</summary>
                        <div className="text-muted-foreground pt-2">Open the playground, paste the URL, click Generate—the <strong>sora3 watermark remover</strong> does the rest.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Can I use it for free?</summary>
                        <div className="text-muted-foreground pt-2">Yes—try the <strong>sora3 watermark remover</strong> with free credits after sign‑up.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Does it support Sora3 Pro videos?</summary>
                        <div className="text-muted-foreground pt-2">Yes, the <strong>sora3 watermark remover</strong> handles semi‑transparent overlays in Pro outputs.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">What types of watermarks can be removed?</summary>
                        <div className="text-muted-foreground pt-2">Logos, text, and overlays—static or moving—via the <strong>sora3 watermark remover</strong>.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Does removal affect quality?</summary>
                        <div className="text-muted-foreground pt-2">The <strong>sora3 watermark remover</strong> uses reconstruction to keep texture and motion consistent.</div>
                      </details>
                      <details className="group py-3">
                        <summary className="cursor-pointer font-semibold group-open:text-primary">Can I integrate it into my workflow?</summary>
                        <div className="text-muted-foreground pt-2">Yes—call the API directly or chain Sora3 + <strong>sora3 watermark remover</strong>.</div>
                      </details>
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Page Header with H1 */}
              <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {routeFromMode(generationMode) === '/sora3-image-to-video' 
                    ? tGenerate('imageToVideoPageTitle')
                    : tGenerate('textToVideoTitle')}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {routeFromMode(generationMode) === '/sora3-image-to-video'
                    ? tGenerate('imageToVideoPageSubtitle')
                    : tGenerate('textToVideoSubtitle')}
                </p>
              </header>

              {/* Error Display */}
              {Object.keys(errors).length > 0 && (
                <div className="mb-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.prompt || errors.reference_image || Object.values(errors)[0]}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel: Input */}
              <div className="space-y-6 order-1 lg:order-1">
                <div className="relative bg-card border-2 border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                      <span className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {mounted ? tGenerate('input') : 'Input'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border border-primary/20">
                        <span>{mounted ? `${tGenerate('credits')}: ${userCredits}` : `Credits: ${userCredits}`}</span>
                      </span>
                    </div>
                  </div>

                  {/* Mode-specific UI */}
                  {modeParams.mode === 'veo3' && (
                    <Veo3Mode
                      params={modeParams.params as Veo3Params}
                      onChange={handleVeo3ParamsChange}
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                      onModelChange={handleModelChange}
                    />
                  )}

                  {modeParams.mode === 'sora3' && (
                    <Sora3Mode
                      params={modeParams.params as Sora3Params}
                      onChange={handleSora3ParamsChange}
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                    />
                  )}

                  {modeParams.mode === 'reframe' && (
                    <>
                      {(modeParams.params as ReframeParams).model === 'veo3.1' ? (
                        <Veo3ImageMode
                          params={modeParams.params as ReframeParams}
                          onChange={handleReframeParamsChange}
                          onGenerate={handleGenerate}
                          isGenerating={isGenerating}
                          onModelChange={handleModelChange}
                        />
                      ) : (
                        <ReframeMode
                          params={modeParams.params as ReframeParams}
                          onChange={handleReframeParamsChange}
                          onGenerate={handleGenerate}
                          isGenerating={isGenerating}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Panel: Output */}
              <div className="space-y-6 order-2 lg:order-2">
                <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {mounted ? tGenerate('output') : 'Output'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border whitespace-nowrap">
                      {mounted ? tGenerate('video') : 'Video'}
                    </span>
                  </div>

                  {/* Show sample video only when not generating and no current job */}
                  {showingSample && sampleVideo && !isGenerating && !currentJob ? (
                    <div className="space-y-4">
                      <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-accent" />
                          <span className="font-bold text-accent-foreground/80">{tGenerate('exampleVideo')}</span>
                        </div>
                        <p className="text-sm text-accent-foreground/80">
                          {isAuthenticated 
                            ? tGenerate('sampleVideoDescription')
                            : tGenerate('sampleVideoDescriptionUnauthenticated')
                          }
                        </p>
                      </div>
                      
                      <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                        <video 
                          className="w-full h-full object-cover"
                          controls
                          poster={sampleVideo.thumbnailUrl}
                          src={sampleVideo.videoUrl}
                          preload="metadata"
                        >
                          <source src={sampleVideo.videoUrl} type="video/mp4" />
                          {tGenerate('browserNotSupportVideo')}
                        </video>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {sampleVideo.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Only show signup button for unauthenticated users */}
                      {!isAuthenticated && (
                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Play className="w-5 h-5" />
                          {tGenerate('signUpToCreate')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <VideoPreview
                      currentJob={currentJob}
                      onRetry={handleRetry}
                      isGenerating={isGenerating}
                    />
                  )}
                  
                  {/* History Button */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-input text-foreground hover:bg-muted"
                      onClick={() => router.push('/dashboard')}
                    >
                      <History className="w-4 h-4 mr-2" />
                      {mounted ? t('generationHistory') : 'Generation History'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Content - Only for text-to-video */}
            {routeFromMode(generationMode) === '/sora3-text-to-video' && (
              <>
                {/* Hero Section */}
                <section className="mt-16 mb-12">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                      {tGenerate('textToVideoTitle')}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      {tGenerate('textToVideoSubtitle')}
                    </p>
                  </div>
                </section>

                {/* Features Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {tGenerate('textToVideoFeaturesTitle')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wand2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('featureAIPowered.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('featureAIPowered.description')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('featureCinematic.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('featureCinematic.description')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('featureAudio.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('featureAudio.description')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('featureContextual.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('featureContextual.description')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* How to Use Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {tGenerate('howToUseTitle')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">1</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('howToUseStep1.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('howToUseStep1.description')}
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">2</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('howToUseStep2.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('howToUseStep2.description')}
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">3</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('howToUseStep3.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('howToUseStep3.description')}
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">4</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('howToUseStep4.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('howToUseStep4.description')}
                      </p>
                    </Card>
                  </div>
                </section>

                {/* Who Uses Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    Who Uses Sora3?
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Users className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Content creators</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Zap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">TikTok marketers</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <GraduationCap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">E-commerce sellers</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Rocket className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Short-film studios</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Palette className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">Advertisers</h3>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* Testimonials Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    What About the Text to Video with AI Video Generator
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"Sora3 AI Text to Video tool helped me turn my blog posts into engaging videos in minutes. A total game-changer for my content strategy!"</p>
                      <p className="font-semibold text-foreground">- Sophia M., Content Creator</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"As a marketer, I'm amazed by how quickly I can generate ad videos just by typing a few lines. It's fast, smart, and saves me hours."</p>
                      <p className="font-semibold text-foreground">- David K., Digital Marketer</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"I've tried many AI tools, but this one nails the visuals and pacing like a pro. Perfect for my social media campaigns!"</p>
                      <p className="font-semibold text-foreground">- Lena T., Social Media Manager</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"I used Sora3 AI to create a product explainer video. The results looked like I hired a professional team!"</p>
                      <p className="font-semibold text-foreground">- Jason P., Startup Founder</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"Perfect for creating training materials. I simply typed the key points and the AI handled the rest. Super efficient."</p>
                      <p className="font-semibold text-foreground">- Ravi D., HR Specialist</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"From script to video in one step—this tool has transformed how I pitch my creative ideas to clients."</p>
                      <p className="font-semibold text-foreground">- Nina V., Creative Director</p>
                    </Card>
                  </div>
                </section>
              </>
            )}

            {/* Marketing Content - Only for image-to-video */}
            {routeFromMode(generationMode) === '/sora3-image-to-video' && (
              <>
                {/* Hero Section */}
                <section className="mt-16 mb-12">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                      {tGenerate('imageToVideoTitle')}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                      {tGenerate('imageToVideoSubtitle')}
                    </p>
                  </div>
                </section>

                {/* Features Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {tGenerate('imageToVideoFeaturesTitle')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('imageToVideoFeature1.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('imageToVideoFeature1.description')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('imageToVideoFeature2.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('imageToVideoFeature2.description')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('imageToVideoFeature3.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('imageToVideoFeature3.description')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('imageToVideoFeature4.title')}</h3>
                          <p className="text-muted-foreground">
                            {tGenerate('imageToVideoFeature4.description')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* How to Use Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {tGenerate('imageToVideoHowToUseTitle')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">1</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('imageToVideoHowToUseStep1.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('imageToVideoHowToUseStep1.description')}
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">2</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('imageToVideoHowToUseStep2.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('imageToVideoHowToUseStep2.description')}
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">3</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('imageToVideoHowToUseStep3.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('imageToVideoHowToUseStep3.description')}
                      </p>
                    </Card>

                    <Card className="p-6 text-center bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-primary">4</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tGenerate('imageToVideoHowToUseStep4.title')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {tGenerate('imageToVideoHowToUseStep4.description')}
                      </p>
                    </Card>
                  </div>
                </section>

                {/* Who Uses Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {tGenerate('whoUsesTitle')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Users className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('whoUsesContentCreators')}</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Zap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{tGenerate('whoUsesTikTokMarketers')}</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <GraduationCap className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{t('whoThisIsFor.ecommerce.title')}</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Rocket className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{t('whoThisIsFor.shortFilmStudios.title')}</h3>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start gap-4">
                        <Palette className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{t('whoThisIsFor.advertisers.title')}</h3>
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>

                {/* Testimonials Section */}
                <section className="mt-16 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {tGenerate('imageToVideoTestimonialsTitle')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"{tGenerate('imageToVideoTestimonial1.quote')}"</p>
                      <p className="font-semibold text-foreground">- {tGenerate('imageToVideoTestimonial1.author')}</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"{tGenerate('imageToVideoTestimonial2.quote')}"</p>
                      <p className="font-semibold text-foreground">- {tGenerate('imageToVideoTestimonial2.author')}</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"{tGenerate('imageToVideoTestimonial3.quote')}"</p>
                      <p className="font-semibold text-foreground">- {tGenerate('imageToVideoTestimonial3.author')}</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"{tGenerate('imageToVideoTestimonial4.quote')}"</p>
                      <p className="font-semibold text-foreground">- {tGenerate('imageToVideoTestimonial4.author')}</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"{tGenerate('imageToVideoTestimonial5.quote')}"</p>
                      <p className="font-semibold text-foreground">- {tGenerate('imageToVideoTestimonial5.author')}</p>
                    </Card>

                    <Card className="p-6 bg-card hover:shadow-xl transition-shadow duration-300">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-muted-foreground italic mb-4">"{tGenerate('imageToVideoTestimonial6.quote')}"</p>
                      <p className="font-semibold text-foreground">- {tGenerate('imageToVideoTestimonial6.author')}</p>
                    </Card>
                  </div>
                </section>
              </>
            )}

            {/* Pricing Banner */}
            <div className="mt-8 mb-8">
              <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed font-medium">
                  <Link href="/plans" className="inline-block text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-300 underline decoration-amber-300 dark:decoration-amber-500 hover:decoration-amber-500 dark:hover:decoration-amber-300 transition-colors">{tGenerate('pricingBanner')}</Link>
                </p>
              </div>
            </div>

            {/* SEO-Optimized FAQ Section */}
            <section className="mt-12 mb-8" itemScope itemType="https://schema.org/FAQPage">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                {routeFromMode(generationMode) === '/sora3-text-to-video' 
                  ? "Frequently Asked Questions About AI Video Generator for Text to Video"
                  : routeFromMode(generationMode) === '/sora3-image-to-video'
                  ? tGenerate('faqImageToVideoTitle')
                  : "Frequently Asked Questions About Sora3 AI Video Generator"}
              </h2>
              <div className="max-w-4xl mx-auto space-y-6">
                {routeFromMode(generationMode) === '/sora3-text-to-video' ? (
                  <>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What is the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Our AI Text to Video tool transforms your written prompts, stories, or scripts into fully generated videos using advanced AI. Just type your idea, and the AI brings it to life with visuals, motion, and music.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Do I need any video editing or design experience to use the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          No experience is needed. Simply enter your text prompt or video idea, and the AI will automatically generate a high-quality video for you - no technical skills required.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Can I customize the video style or theme with the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes. You can write your own prompt to describe the visual style, tone, pacing, or scene details you want. The AI will follow your instructions and generate a video that matches your creative vision.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        How long does it take to generate a video using Text to Video?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Most videos are generated in just a few minutes, depending on length and complexity. You'll be able to preview and download your video once it's ready.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What kind of videos can I create with the Text to Video tool?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          You can create a wide range of content - explainer videos, short films, social media posts, product demos, educational content, and more - all starting from simple text descriptions.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Can I use Text to Video generated videos for commercial purposes?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes. Videos created using our AI can be used for marketing, business, or any other commercial use, as long as they follow our usage and licensing terms.
                        </p>
                      </div>
                    </div>
                  </>
                ) : routeFromMode(generationMode) === '/sora3-image-to-video' ? (
                  <>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        {tGenerate('faqImageToVideo.whatIsTool.question')}
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          {tGenerate('faqImageToVideo.whatIsTool.answer')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        {tGenerate('faqImageToVideo.needExperience.question')}
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          {tGenerate('faqImageToVideo.needExperience.answer')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        {tGenerate('faqImageToVideo.imageTypes.question')}
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          {tGenerate('faqImageToVideo.imageTypes.answer')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        {tGenerate('faqImageToVideo.howLong.question')}
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          {tGenerate('faqImageToVideo.howLong.answer')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        {tGenerate('faqImageToVideo.motionType.question')}
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          {tGenerate('faqImageToVideo.motionType.answer')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        {tGenerate('faqImageToVideo.commercialUse.question')}
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          {tGenerate('faqImageToVideo.commercialUse.answer')}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What is Sora3 AI Video Generator?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Sora3 serves as a sophisticated AI-powered video creation system built on advanced Sora technology. It enables you to produce studio-grade videos using text inputs or image uploads within moments. Our service provides dual functionality for text-to-video and image-to-video conversion, delivering high-definition results with synchronized audio.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Is Sora3 video generator free to use?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes! Sora3 offers a free tier to get started. You can try our AI video generator with limited credits. For unlimited access and premium features, plans start from $19/month for 100 high-quality AI-generated videos with audio.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        How long does it take to generate a video with Sora3?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Sora3 AI generates videos in seconds to minutes depending on the complexity and length. Most standard videos (8-16 seconds) are ready in under 3 minutes. Our fast processing ensures you get high-quality results quickly.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        What video formats and resolutions does Sora3 support?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Sora3 supports multiple aspect ratios including 16:9 (landscape), 9:16 (vertical/TikTok), and 1:1 (square). All videos are generated in HD quality with professional audio. You can download your videos in standard formats compatible with all platforms.
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-md" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <h3 className="text-xl font-semibold text-foreground mb-3" itemProp="name">
                        Can I use Sora3 videos for commercial purposes?
                      </h3>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-muted-foreground leading-relaxed" itemProp="text">
                          Yes! Videos generated with Sora3 AI can be used for commercial purposes including social media marketing, advertising, content creation, and more. Premium subscribers get full commercial rights with no platform watermark on generated videos.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Get Started Section - For text-to-video and image-to-video */}
            {(routeFromMode(generationMode) === '/sora3-text-to-video' || routeFromMode(generationMode) === '/sora3-image-to-video') && (
              <section className="mt-16 mb-12">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-8 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    {routeFromMode(generationMode) === '/sora3-text-to-video' 
                      ? "Get Started with AI Video Generator for Text to Video"
                      : tGenerate('getStartedImageToVideo.title')}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
                    {routeFromMode(generationMode) === '/sora3-text-to-video' 
                      ? "Ready to take your videos to the next level? Upgrade to access faster rendering, longer video durations, advanced customization, and premium styles. Whether you're creating for business, education, or content marketing, our Pro plan gives you everything you need to turn scripts into stunning, high-quality videos - effortlessly."
                      : tGenerate('getStartedImageToVideo.description')}
                  </p>
                  <Link href="/plans">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      {routeFromMode(generationMode) === '/sora3-image-to-video' 
                        ? tGenerate('getStartedImageToVideo.button')
                        : tGenerate('fallbacks.getPremium')}
                    </Button>
                  </Link>
                </div>
              </section>
            )}

            {/* Mobile: Fixed Generate Button */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
              <button
                className="w-full bg-primary text-primary-foreground font-bold py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 transition-shadow duration-200 backdrop-blur-sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent flex-shrink-0" />
                    <span className="whitespace-nowrap">{mounted ? tGenerate('generating') : tGenerate('fallbacks.generating')}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current flex-shrink-0" />
                    <span className="whitespace-nowrap">{mounted ? tGenerate('startGeneration') : tGenerate('fallbacks.startGeneration')}</span>
                  </>
                )}
              </button>
            </div>
            </>
          )}
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
      />
      <InsufficientCreditsDialog
        open={showBalanceDialog}
        onOpenChange={setShowBalanceDialog}
        requiredCredits={pendingCost ?? 10}
        availableCredits={subscription?.credits || 0}
        onRequestAuth={() => setShowAuthModal(true)}
      />
    </div>
  );
};

export default Generate;
