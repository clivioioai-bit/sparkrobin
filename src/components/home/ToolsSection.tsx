"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, ImageIcon, Clapperboard, Play, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sora3Mode } from '@/components/generate/modes/sora3mode';
import { ReframeMode } from '@/components/generate/modes/ReframeMode';
import { StoryboardManager } from '@/components/storyboard/StoryboardManager';
import VideoPreview from '@/components/generate/VideoPreview';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/hooks/useSubscription';
import AuthModal from '@/components/AuthModal';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';
import { useTranslations } from 'next-intl';
import { Sora3Params, ReframeParams } from '@/types/generation-modes';
import { StoryboardParams, StoryboardJob } from '@/types/storyboard';
import { Job, CreateJobRequest, Duration } from '@/types/jobs';
import videoApi from '@/services/videoApi';
import useJobsPolling from '@/hooks/useJobsPolling';
import { useStoryboardPolling } from '@/hooks/useStoryboardPolling';
import { getRandomSampleVideo, type SampleVideo } from '@/data/sampleVideos';
import { getVideoUrl, DEMO_VIDEO_PATHS } from '@/config/demoVideos';
import { Sparkles } from 'lucide-react';

const createDefaultSora3Params = (): Sora3Params => ({
  prompt: '',
  negative_prompt: '',
  duration: 8,
  aspectRatio: '16:9',
  style: 'realistic',
  n_frames: '10',
  model: 'veo3.1',
  veo3SubModel: 'veo3_fast',
  veoDisplayModel: 'veo4'
});

const createDefaultReframeParams = (): ReframeParams => ({
  prompt: '',
  targetAspectRatio: '16:9',
  style: 'zoom',
  speed: 'normal',
  model: 'veo3.1',
  veo3SubModel: 'veo3_fast',
  veoDisplayModel: 'veo4',
  n_frames: '10'
});

const createDefaultStoryboardParams = (): StoryboardParams => ({
  shots: [
    {
      prompt: '',
      duration: 5
    }
  ],
  n_frames: "25",
  aspect_ratio: 'portrait',
  image_file: undefined
});

const UPGRADE_WAIT_MS = 60_000;

type UpgradeWaitFlow = {
  tab: 'text-to-video' | 'image-to-video' | 'storyboard';
  startedAt: number;
};

const ToolsSection = () => {
  const t = useTranslations('navigation');
  const tGenerate = useTranslations('generate');
  const tPricing = useTranslations('pricing');
  const { user, isAuthenticated } = useAuth();
  const { subscription, calculateCredits } = useCredits();
  const { hasActiveSubscription } = useSubscription();
  
  const [activeTab, setActiveTab] = useState<'text-to-video' | 'image-to-video' | 'storyboard'>('text-to-video');
  
  // Sora3 (Text to Video) state
  const [sora3Params, setSora3Params] = useState<Sora3Params>(createDefaultSora3Params());
  const [sora3Jobs, setSora3Jobs] = useState<Job[]>([]);
  const [sora3CurrentJob, setSora3CurrentJob] = useState<Job | undefined>(undefined);
  const [isSora3Generating, setIsSora3Generating] = useState(false);
  
  // Reframe (Image to Video) state
  const [reframeParams, setReframeParams] = useState<ReframeParams>(createDefaultReframeParams());
  const [reframeJobs, setReframeJobs] = useState<Job[]>([]);
  const [reframeCurrentJob, setReframeCurrentJob] = useState<Job | undefined>(undefined);
  const [isReframeGenerating, setIsReframeGenerating] = useState(false);
  
  // Storyboard state
  const [storyboardParams, setStoryboardParams] = useState<StoryboardParams>(createDefaultStoryboardParams());
  const [storyboardJobs, setStoryboardJobs] = useState<StoryboardJob[]>([]);
  const [storyboardCurrentJob, setStoryboardCurrentJob] = useState<StoryboardJob | null>(null);
  const [isStoryboardGenerating, setIsStoryboardGenerating] = useState(false);
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [pendingCost, setPendingCost] = useState<number | undefined>(undefined);
  const [upgradeWaitFlow, setUpgradeWaitFlow] = useState<UpgradeWaitFlow | null>(null);
  
  // Sample video state
  const [sampleVideo, setSampleVideo] = useState<SampleVideo | null>(null);
  const [showingSample, setShowingSample] = useState(false);
  const upgradeWaitTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const userCredits = subscription?.credits || 0;
  
  // Get sample video based on active tab
  const getSampleVideoForTab = (tab: typeof activeTab): SampleVideo | null => {
    if (tab === 'text-to-video') {
      // Use sushi video for text-to-video
      return {
        id: 'sample-sushi',
        prompt: 'A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant. Close-up shots of precise knife work cutting fresh salmon. Rice being molded with practiced hands. Elegant presentation on wooden serving board. Natural window lighting with clean aesthetic. ASMR-style detail focus.',
        videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.sushi),
        thumbnailUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=450&fit=crop',
        aspectRatio: '16:9',
        duration: 8,
        tags: ['food', 'sushi', 'asmr', 'text-to-video']
      };
    } else if (tab === 'image-to-video') {
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
    } else if (tab === 'storyboard') {
      // Storyboard example video - use storyboardexample video
      return {
        id: 'sample-storyboard',
        prompt: 'Multi-scene storyboard example with cinematic transitions and consistent character movement across scenes.',
        videoUrl: getVideoUrl(DEMO_VIDEO_PATHS.storyboardExample),
        thumbnailUrl: undefined,
        aspectRatio: '16:9',
        duration: 25,
        tags: ['storyboard', 'multi-scene', 'cinematic']
      };
    }
    return null;
  };
  
  // Load sample video when tab changes
  useEffect(() => {
    const sample = getSampleVideoForTab(activeTab);
    if (sample) {
      setSampleVideo(sample);
      setShowingSample(true);
    } else {
      setSampleVideo(null);
      setShowingSample(false);
    }
    
    // Cleanup: hide sample when component unmounts
    return () => {
      setShowingSample(false);
    };
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (upgradeWaitTimerRef.current) {
        clearTimeout(upgradeWaitTimerRef.current);
      }
    };
  }, []);

  const clearUpgradeWaitFlow = useCallback(() => {
    if (upgradeWaitTimerRef.current) {
      clearTimeout(upgradeWaitTimerRef.current);
      upgradeWaitTimerRef.current = null;
    }
    setUpgradeWaitFlow(null);
  }, []);

  const startUpgradeWaitFlow = useCallback((tab: UpgradeWaitFlow['tab']) => {
    if (upgradeWaitTimerRef.current) {
      clearTimeout(upgradeWaitTimerRef.current);
    }

    setUpgradeWaitFlow({
      tab,
      startedAt: Date.now(),
    });

    upgradeWaitTimerRef.current = setTimeout(() => {
      setUpgradeWaitFlow(null);
      setShowSubscriptionModal(true);
      upgradeWaitTimerRef.current = null;
    }, UPGRADE_WAIT_MS);
  }, []);
  
  // Job polling for Sora3 and Reframe
  const onSora3JobUpdate = useCallback((updatedJob: Job) => {
    setSora3Jobs(prevJobs => 
      prevJobs.map(job => 
        job.jobId === updatedJob.jobId ? updatedJob : job
      )
    );
    if (sora3CurrentJob && sora3CurrentJob.jobId === updatedJob.jobId) {
      setSora3CurrentJob(updatedJob);
    }
  }, [sora3CurrentJob]);
  
  const onReframeJobUpdate = useCallback((updatedJob: Job) => {
    setReframeJobs(prevJobs => 
      prevJobs.map(job => 
        job.jobId === updatedJob.jobId ? updatedJob : job
      )
    );
    if (reframeCurrentJob && reframeCurrentJob.jobId === updatedJob.jobId) {
      setReframeCurrentJob(updatedJob);
    }
  }, [reframeCurrentJob]);
  
  const { startPolling: startSora3Polling } = useJobsPolling({
    jobs: sora3Jobs,
    onJobUpdate: onSora3JobUpdate
  });
  
  const { startPolling: startReframePolling } = useJobsPolling({
    jobs: reframeJobs,
    onJobUpdate: onReframeJobUpdate
  });
  
  // Storyboard polling
  const handleStoryboardJobUpdate = useCallback((job: StoryboardJob) => {
    setStoryboardJobs(prev => {
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
  
  const { startPolling: startStoryboardPolling } = useStoryboardPolling({
    jobs: storyboardJobs,
    onJobUpdate: handleStoryboardJobUpdate
  });
  
  // Calculate credit costs
  const getSora3CreditCost = useCallback((): number => {
    const n_frames = sora3Params.n_frames || '10';
    const model = sora3Params.model || 'sora3';
    const quality = sora3Params.quality;
    return calculateCredits(
      sora3Params.duration || 8,
      sora3Params.aspectRatio,
      model,
      n_frames,
      quality
    );
  }, [sora3Params, calculateCredits]);
  
  const getReframeCreditCost = useCallback((): number => {
    const n_frames = reframeParams.n_frames || '10';
    const model = reframeParams.model || 'sora3';
    const quality = reframeParams.quality;
    return calculateCredits(
      8,
      reframeParams.targetAspectRatio === 'Auto' ? '16:9' : reframeParams.targetAspectRatio,
      model,
      n_frames,
      quality
    );
  }, [reframeParams, calculateCredits]);
  
  const getStoryboardCreditCost = useCallback((): number => {
    switch (storyboardParams.n_frames) {
      case "10": return 125;
      case "15": return 225;
      case "25": return 225;
      default: return 125;
    }
  }, [storyboardParams.n_frames]);
  
  // Handle Sora3 generation
  const handleSora3Generate = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!sora3Params.prompt?.trim()) {
      return;
    }

    if (!hasActiveSubscription) {
      startUpgradeWaitFlow('text-to-video');
      return;
    }
    
    const creditCost = getSora3CreditCost();
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    setIsSora3Generating(true);
    
    try {
      const request: CreateJobRequest = {
        prompt: sora3Params.prompt.trim(),
        negative_prompt: sora3Params.negative_prompt?.trim(),
        duration_sec: (sora3Params.duration || 8) as Duration,
        aspect_ratio: sora3Params.aspectRatio === 'Auto' ? '16:9' : sora3Params.aspectRatio,
        cfg_scale: 7,
        model: sora3Params.model || 'sora3',
        n_frames: sora3Params.n_frames,
        quality: sora3Params.quality
      };
      
      const response = await videoApi.createJob(request, 'sora3');
      
      if (!response || !response.jobId) {
        throw new Error('Invalid response from server');
      }
      
      const newJob: Job = {
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        params: request,
        created_at: new Date().toISOString(),
        visibility: 'private',
        creditCost: creditCost
      };
      
      setSora3Jobs(prevJobs => [newJob, ...prevJobs]);
      setSora3CurrentJob(newJob);
      startSora3Polling(response.jobId);
    } catch (error) {
      console.error('Error generating video:', error);
      
      // Handle authentication errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
      
      if (errorMessage.includes('not authenticated') || errorMessage.includes('Authentication failed') || errorMessage.includes('401')) {
        // Show auth modal for authentication errors
        setShowAuthModal(true);
      } else {
        // Show error toast for other errors
        const { toast } = await import('sonner');
        toast.error(errorMessage || 'Failed to generate video. Please try again.');
      }
    } finally {
      setIsSora3Generating(false);
    }
  }, [isAuthenticated, user, sora3Params, hasActiveSubscription, startUpgradeWaitFlow, userCredits, getSora3CreditCost, startSora3Polling]);
  
  // Handle Sora3 retry
  const handleSora3Retry = useCallback(async (job: Job) => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    
    const creditCost = getSora3CreditCost();
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    setIsSora3Generating(true);
    
    try {
      const response = await videoApi.createJob(job.params, 'sora3');
      
      if (!response || !response.jobId) {
        throw new Error('Invalid response from server');
      }
      
      const newJob: Job = {
        ...job,
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        created_at: new Date().toISOString(),
        creditCost: creditCost
      };
      
      setSora3Jobs(prevJobs => [newJob, ...prevJobs]);
      setSora3CurrentJob(newJob);
      startSora3Polling(response.jobId);
    } catch (error) {
      console.error('Error retrying job:', error);
    } finally {
      setIsSora3Generating(false);
    }
  }, [user, userCredits, getSora3CreditCost, startSora3Polling]);
  
  // Handle Reframe generation
  const handleReframeGenerate = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!reframeParams.sourceVideo && reframeParams.model !== 'veo3.1') {
      return;
    }
    
    if (reframeParams.model === 'veo3.1' && !reframeParams.startFrame && !reframeParams.endFrame) {
      return;
    }

    if (!hasActiveSubscription) {
      startUpgradeWaitFlow('image-to-video');
      return;
    }
    
    const creditCost = getReframeCreditCost();
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    setIsReframeGenerating(true);
    
    try {
      let request: CreateJobRequest;
      
      if (reframeParams.model === 'veo3.1') {
        const imageUrls: string[] = [];
        
        if (reframeParams.startFrame) {
          const startUrl = await videoApi.uploadVideo(reframeParams.startFrame, user.id);
          imageUrls.push(startUrl);
        }
        
        if (reframeParams.endFrame) {
          const endUrl = await videoApi.uploadVideo(reframeParams.endFrame, user.id);
          imageUrls.push(endUrl);
        }
        
        if (imageUrls.length === 0) {
          throw new Error('At least one image is required');
        }
        
        request = {
          prompt: reframeParams.prompt?.trim() || tGenerate('defaultPrompts.smoothTransition'),
          duration_sec: 8 as Duration,
          aspect_ratio: reframeParams.targetAspectRatio === 'Auto' ? '16:9' : reframeParams.targetAspectRatio === '9:16' ? '9:16' : '16:9',
          cfg_scale: 7,
          model: 'veo3.1',
          veo3Params: {
            model: reframeParams.veo3SubModel || 'veo3_fast',
            generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
            imageUrls: imageUrls,
            seeds: reframeParams.seeds,
            enableTranslation: true
          }
        };
      } else {
        if (!reframeParams.sourceVideo) {
          throw new Error('Source video is required');
        }
        
        const videoUrl = await videoApi.uploadVideo(reframeParams.sourceVideo, user.id);
        
        request = {
          prompt: reframeParams.prompt?.trim() || tGenerate('defaultPrompts.smoothAnimation'),
          duration_sec: 8,
          aspect_ratio: reframeParams.targetAspectRatio === 'Auto' ? '16:9' : reframeParams.targetAspectRatio,
          cfg_scale: 7,
          reference_image_url: videoUrl,
          model: reframeParams.model || 'sora3',
          n_frames: reframeParams.n_frames,
          quality: reframeParams.quality
        };
      }
      
      const response = await videoApi.createJob(request, 'reframe');
      
      if (!response || !response.jobId) {
        throw new Error('Invalid response from server');
      }
      
      const newJob: Job = {
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        params: request,
        created_at: new Date().toISOString(),
        visibility: 'private',
        creditCost: creditCost
      };
      
      setReframeJobs(prevJobs => [newJob, ...prevJobs]);
      setReframeCurrentJob(newJob);
      startReframePolling(response.jobId);
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsReframeGenerating(false);
    }
  }, [isAuthenticated, user, reframeParams, hasActiveSubscription, startUpgradeWaitFlow, userCredits, getReframeCreditCost, startReframePolling, tGenerate]);
  
  // Handle Reframe retry
  const handleReframeRetry = useCallback(async (job: Job) => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    
    const creditCost = getReframeCreditCost();
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    setIsReframeGenerating(true);
    
    try {
      const response = await videoApi.createJob(job.params, 'reframe');
      
      if (!response || !response.jobId) {
        throw new Error('Invalid response from server');
      }
      
      const newJob: Job = {
        ...job,
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        created_at: new Date().toISOString(),
        creditCost: creditCost
      };
      
      setReframeJobs(prevJobs => [newJob, ...prevJobs]);
      setReframeCurrentJob(newJob);
      startReframePolling(response.jobId);
    } catch (error) {
      console.error('Error retrying job:', error);
    } finally {
      setIsReframeGenerating(false);
    }
  }, [user, userCredits, getReframeCreditCost, startReframePolling]);
  
  // Handle Storyboard generation
  const handleStoryboardGenerate = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    
    const creditCost = getStoryboardCreditCost();
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    if (storyboardParams.shots.length === 0) {
      return;
    }
    
    if (storyboardParams.shots.some(shot => !shot.prompt.trim())) {
      return;
    }
    
    const totalUsedDuration = storyboardParams.shots.reduce((sum, shot) => sum + shot.duration, 0);
    const maxDuration = parseInt(storyboardParams.n_frames);
    
    if (totalUsedDuration !== maxDuration) {
      return;
    }
    
    setIsStoryboardGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('shots', JSON.stringify(storyboardParams.shots));
      formData.append('n_frames', storyboardParams.n_frames);
      formData.append('aspect_ratio', storyboardParams.aspect_ratio);
      
      if (storyboardParams.image_file) {
        formData.append('image_file', storyboardParams.image_file);
      }
      
      const response = await fetch('/api/storyboard/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate storyboard');
      }
      
      const result = await response.json();
      
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
      
      setStoryboardCurrentJob(newJob);
      setStoryboardJobs(prev => [newJob, ...prev]);
      startStoryboardPolling(result.jobId);
    } catch (error) {
      console.error('Error generating storyboard:', error);
    } finally {
      setIsStoryboardGenerating(false);
    }
  }, [isAuthenticated, user, storyboardParams, userCredits, getStoryboardCreditCost, startStoryboardPolling]);
  
  // Handle Storyboard retry
  const handleStoryboardRetry = useCallback(async (job: StoryboardJob) => {
    if (!user?.id) {
      setShowAuthModal(true);
      return;
    }
    
    const creditCost = getStoryboardCreditCost();
    if (userCredits < creditCost) {
      setPendingCost(creditCost);
      setShowSubscriptionModal(true);
      return;
    }
    
    setIsStoryboardGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('shots', JSON.stringify(job.params.shots));
      formData.append('n_frames', job.params.n_frames);
      formData.append('aspect_ratio', job.params.aspect_ratio);
      
      if (job.params.image_file) {
        formData.append('image_file', job.params.image_file);
      }
      
      const response = await fetch('/api/storyboard/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry storyboard generation');
      }
      
      const result = await response.json();
      
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
      
      setStoryboardJobs(prev => [newJob, ...prev]);
      setStoryboardCurrentJob(newJob);
      startStoryboardPolling(result.jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
    } finally {
      setIsStoryboardGenerating(false);
    }
  }, [user, userCredits, getStoryboardCreditCost, startStoryboardPolling]);
  
  // Get current job based on active tab
  const getCurrentJob = (): Job | StoryboardJob | undefined => {
    if (activeTab === 'text-to-video') {
      return sora3CurrentJob;
    } else if (activeTab === 'image-to-video') {
      return reframeCurrentJob;
    } else {
      return storyboardCurrentJob;
    }
  };
  
  // Get current generating state
  const getCurrentGenerating = (): boolean => {
    if (upgradeWaitFlow?.tab === activeTab) {
      return true;
    }

    if (activeTab === 'text-to-video') {
      return isSora3Generating;
    } else if (activeTab === 'image-to-video') {
      return isReframeGenerating;
    } else {
      return isStoryboardGenerating;
    }
  };
  
  // Handle retry based on active tab
  const handleRetry = useCallback(async (job: Job | StoryboardJob) => {
    if (activeTab === 'text-to-video') {
      await handleSora3Retry(job as Job);
    } else if (activeTab === 'image-to-video') {
      await handleReframeRetry(job as Job);
    } else {
      await handleStoryboardRetry(job as StoryboardJob);
    }
  }, [activeTab, handleSora3Retry, handleReframeRetry, handleStoryboardRetry]);
  
  const currentJob = getCurrentJob();
  const isGenerating = getCurrentGenerating();
  const isUpgradeWaitingOnActiveTab = upgradeWaitFlow?.tab === activeTab;
  
  // Convert StoryboardJob to Job format for VideoPreview
  const getJobForPreview = (): Job | undefined => {
    if (!currentJob) return undefined;
    
    if (activeTab === 'storyboard') {
      const sbJob = currentJob as StoryboardJob;
      return {
        jobId: sbJob.jobId,
        status: sbJob.status === 'completed' ? 'SUCCEEDED' : sbJob.status === 'failed' ? 'FAILED' : sbJob.status === 'processing' ? 'RUNNING' : 'PENDING',
        progress: sbJob.progress,
        preview_url: sbJob.thumbnailUrl,
        result_url: sbJob.videoUrl,
        error: sbJob.error ? { code: 'UNKNOWN', message: sbJob.error } : undefined,
        params: {
          prompt: sbJob.params.shots?.[0]?.prompt || 'Storyboard video',
          duration_sec: 16,
          aspect_ratio: sbJob.params.aspect_ratio === 'portrait' ? '9:16' : '16:9',
          cfg_scale: 7,
          reference_image_url: undefined
        },
        created_at: sbJob.created_at,
        creditCost: sbJob.creditCost
      };
    }
    
    return currentJob as Job;
  };
  
  return (
    <section className="relative w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Panel: Input */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-1">
            <Card className="p-4 sm:p-6 lg:p-8">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
                  <TabsTrigger value="text-to-video" className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('textToVideo')}</span>
                    <span className="sm:hidden">Text</span>
                  </TabsTrigger>
                  <TabsTrigger value="image-to-video" className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('imageToVideo')}</span>
                    <span className="sm:hidden">Image</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="text-to-video" className="mt-0">
                  <Sora3Mode
                    params={sora3Params}
                    onChange={setSora3Params}
                    onGenerate={handleSora3Generate}
                    isGenerating={isSora3Generating}
                  />
                </TabsContent>
                
                <TabsContent value="image-to-video" className="mt-0">
                  <ReframeMode
                    params={reframeParams}
                    onChange={setReframeParams}
                    onGenerate={handleReframeGenerate}
                    isGenerating={isReframeGenerating}
                  />
                </TabsContent>
                
              </Tabs>
            </Card>
          </div>
          
          {/* Right Panel: Output */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-2">
            <Card className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="text-base sm:text-lg font-semibold text-foreground">
                  {tGenerate('output')}
                </div>
              </div>
              
              {/* Show sample video only when not generating and no current job */}
              {showingSample && sampleVideo && !isGenerating && !currentJob ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-accent/10 border-2 border-accent/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <span className="font-bold text-accent-foreground/80 text-sm sm:text-base">{tGenerate('exampleVideo')}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-accent-foreground/80 leading-relaxed">
                      {isAuthenticated 
                        ? tGenerate('sampleVideoDescription')
                        : tGenerate('sampleVideoDescriptionUnauthenticated')
                      }
                    </p>
                  </div>
                  
                  <div className="aspect-video bg-muted/50 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden">
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      poster={sampleVideo.thumbnailUrl}
                      src={sampleVideo.videoUrl}
                      preload="metadata"
                      onError={(e) => {
                        // 完全静默处理视频错误，不记录到控制台
                        // 这些错误通常是网络问题、CORS问题、组件卸载或视频格式不支持，不影响用户体验
                        // 不执行任何操作，让浏览器自然处理
                      }}
                      onAbort={(e) => {
                        // 忽略 AbortError（通常是组件卸载导致的）
                        const error = (e.target as HTMLVideoElement)?.error;
                        if (error?.code === MediaError.MEDIA_ERR_ABORTED) {
                          return;
                        }
                      }}
                    >
                      <source src={sampleVideo.videoUrl} type="video/mp4" />
                      {tGenerate('browserNotSupportVideo')}
                    </video>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {sampleVideo.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs px-2 sm:px-3 py-0.5 sm:py-1 bg-muted/50 backdrop-blur-sm text-muted-foreground rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Only show signup button for unauthenticated users */}
                  {!isAuthenticated && (
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      {tGenerate('signUpToCreate')}
                    </button>
                  )}
                </div>
              ) : (
                isUpgradeWaitingOnActiveTab ? (
                  <Card className="min-h-[500px] flex items-center justify-center bg-primary/5 border-border relative overflow-hidden">
                    <div className="text-center space-y-6 p-8 z-10 max-w-lg w-full">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="w-10 h-10 text-primary animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-semibold text-foreground">
                          {tGenerate('upgradeWait.title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tGenerate('upgradeWait.description')}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-2/5 rounded-full bg-primary transition-all duration-700" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-left text-sm">
                          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                            <div className="text-muted-foreground mb-1">{tGenerate('upgradeWait.modelLabel')}</div>
                            <div className="font-medium">
                              {activeTab === 'text-to-video'
                                ? (sora3Params.veoDisplayModel === 'veo4' ? 'Veo4' : (sora3Params.model || 'Veo3.1'))
                                : (reframeParams.veoDisplayModel === 'veo4' ? 'Veo4' : (reframeParams.model || 'Veo3.1'))}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                            <div className="text-muted-foreground mb-1">{tGenerate('upgradeWait.durationLabel')}</div>
                            <div className="font-medium">
                              {activeTab === 'text-to-video'
                                ? `${sora3Params.duration || 8}s`
                                : `${reframeParams.wan26Duration || 8}s`}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                            <div className="text-muted-foreground mb-1">{tGenerate('upgradeWait.ratioLabel')}</div>
                            <div className="font-medium">
                              {activeTab === 'text-to-video'
                                ? (sora3Params.aspectRatio || '16:9')
                                : (reframeParams.targetAspectRatio || '16:9')}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                            <div className="text-muted-foreground mb-1">{tGenerate('upgradeWait.outputLabel')}</div>
                            <div className="font-medium">
                              {activeTab === 'text-to-video'
                                ? (sora3Params.veo3SubModel === 'veo3' ? tGenerate('upgradeWait.highQuality') : tGenerate('upgradeWait.fastRender'))
                                : (reframeParams.veo3SubModel === 'veo3' ? tGenerate('upgradeWait.highQuality') : tGenerate('upgradeWait.fastRender'))}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tGenerate('upgradeWait.notice')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <VideoPreview
                    currentJob={getJobForPreview()}
                    onRetry={currentJob ? () => handleRetry(currentJob) : undefined}
                    isGenerating={isGenerating}
                  />
                )
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          clearUpgradeWaitFlow();
          setShowSubscriptionModal(false);
        }}
        title={tPricing('modal.subscribeToStartTitle')}
        description={tPricing('modal.subscribeToStartDescription')}
        pendingCost={pendingCost}
      />
    </section>
  );
};

export default ToolsSection;
