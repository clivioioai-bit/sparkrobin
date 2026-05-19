import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import OptimizedVideo from '@/components/OptimizedVideo';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useTranslations } from 'next-intl';
import { 
  Play, 
  Download, 
  Share2, 
  RotateCcw, 
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Job } from '@/types/jobs';
import Link from 'next/link';

interface VideoPreviewProps {
  currentJob?: Job;
  onRetry?: (job: Job) => void;
  isGenerating?: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  currentJob,
  onRetry,
  isGenerating = false
}) => {
  const t = useTranslations('generate');
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { canDownload } = useSubscription();

  // AI work status subtitles that rotate every 10 seconds
  const aiWorkSubtitles = useMemo(
    () => [
      t('aiWorkSubtitles.writingOpeningScene'),
      t('aiWorkSubtitles.paintingBackground'),
      t('aiWorkSubtitles.recordingNarrator'),
      t('aiWorkSubtitles.addingSoundscape'),
      t('aiWorkSubtitles.syncingEverything')
    ],
    [t]
  );

  // Rotate subtitles every 10 seconds while a job is active
  useEffect(() => {
    if (!currentJob || currentJob.status === 'SUCCEEDED' || currentJob.status === 'FAILED') {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSubtitle((prev) => (prev + 1) % aiWorkSubtitles.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentJob, aiWorkSubtitles.length]);

  // 如果没有 currentJob，显示默认状态或生成中状态
  if (!currentJob) {
    // 如果正在生成，显示生成中状态
    if (isGenerating) {
      return (
        <Card className="aspect-video flex items-center justify-center bg-primary/5 border-border relative overflow-hidden">
          <div className="text-center space-y-6 p-8 z-10">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {t('generating')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('videoBeingCreated')}
              </p>
            </div>
            <div className="w-full max-w-xs mx-auto">
              <Progress value={10} className="w-full" />
              <p className="text-xs text-muted-foreground mt-2">
                {t('initializingGeneration')}
              </p>
            </div>
          </div>
        </Card>
      );
    }
    
    // 否则显示准备生成状态
    return (
      <Card className="aspect-video flex items-center justify-center bg-muted border-border">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t('readyToGenerate')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('enterPrompt')}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleDownload = () => {
    if (!canDownload) {
      setShowSubscriptionModal(true);
      return;
    }

    if (currentJob?.result_url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = currentJob.result_url;
      link.download = `video-${currentJob.jobId}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (currentJob?.result_url) {
      navigator.clipboard.writeText(currentJob.result_url);
      // Toast notification would go here
    }
  };

  // Get personality-driven progress message based on elapsed time (extended for image-to-video)
  const getProgressMessage = (elapsedSeconds: number) => {
    if (elapsedSeconds < 30) return "🎬 Analyzing your image and planning motion…";
    if (elapsedSeconds < 60) return "🧠 Understanding scene dynamics and physics…";
    if (elapsedSeconds < 90) return "🎥 Generating smooth motion and transitions…";
    if (elapsedSeconds < 120) return "🎧 Adding realistic lighting and shadows…";
    if (elapsedSeconds < 180) return "🚀 Finalizing your animated masterpiece!";
    if (elapsedSeconds < 240) return "⏳ Almost there, adding final touches…";
    return "🔄 Processing your video, please be patient…";
  };

  // Get encouraging time message (extended for image-to-video)
  const getTimeMessage = (elapsedSeconds: number) => {
    const remainingSeconds = Math.max(0, 240 - elapsedSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    
    if (remainingSeconds > 120) {
      return `✨ About ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} left to animate your image`;
    } else if (remainingSeconds > 60) {
      return "🌟 Almost there — your AI animator is working hard!";
    } else if (remainingSeconds > 30) {
      return "🚀 Final touches — your animated masterpiece is almost ready!";
    } else if (remainingSeconds > 0) {
      return "⏳ Adding final details to your video…";
    } else {
      return "🔄 Processing your video, please be patient…";
    }
  };

  // Processing state with enhanced personality-driven progress
  // 关键修复：如果有result_url，无论状态是什么都应该显示视频（除非是FAILED）
  // 优先检查result_url，因为这是最可靠的完成标志
  const hasVideoUrl = !!currentJob.result_url && typeof currentJob.result_url === 'string' && currentJob.result_url.trim().length > 0;
  const isProcessing = (currentJob.status === 'PENDING' || currentJob.status === 'QUEUED' || currentJob.status === 'RUNNING');
  // 修复：优先检查result_url，如果有result_url就不显示loading，无论状态如何
  // 这样可以处理状态映射延迟的情况（API返回了result_url但状态还是RUNNING）
  const shouldShowLoading = !hasVideoUrl && isProcessing;
  
  // 视频加载错误状态和重试逻辑
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 6;
  const baseRetryDelay = 3000; // 基础延迟3秒
  const maxRetryDelay = 10000; // 最大延迟10秒（指数退避）
  
  // 重新检查hasVideoUrl，确保使用最新的值（在useEffect之前定义，用于整个组件）
  const finalHasVideoUrl = !!currentJob.result_url && 
                           typeof currentJob.result_url === 'string' && 
                           currentJob.result_url.trim().length > 0;
  
  console.log('🎥 VideoPreview render check:', {
    status: currentJob.status,
    hasVideoUrl: hasVideoUrl,
    finalHasVideoUrl: finalHasVideoUrl,
    isProcessing: isProcessing,
    shouldShowLoading: shouldShowLoading,
    shouldShowLoadingReason: hasVideoUrl ? 'hasVideoUrl_skipLoading' : (isProcessing ? 'isProcessing_showLoading' : 'notProcessing_skipLoading'),
    videoLoadError: videoLoadError,
    retryCount: retryCount,
    maxRetries: maxRetries,
    resultUrl: currentJob.result_url ? currentJob.result_url.substring(0, 80) + '...' : 'N/A',
    resultUrlFull: currentJob.result_url, // 完整 URL 用于调试
    resultUrlType: typeof currentJob.result_url,
    resultUrlLength: currentJob.result_url?.length,
    willShowVideo: finalHasVideoUrl && !videoLoadError,
    willShowError: videoLoadError && finalHasVideoUrl && retryCount >= maxRetries,
    displayState: shouldShowLoading ? 'LOADING' : (finalHasVideoUrl ? 'VIDEO' : 'EMPTY')
  });
  
  // 当 result_url 改变时，重置错误状态和重试计数
  useEffect(() => {
    if (currentJob.result_url) {
      setVideoLoadError(false);
      setRetryCount(0);
      // 清除之前的重试定时器
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  }, [currentJob.result_url]);
  
  // 清理重试定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  // 处理视频加载错误，自动重试（使用指数退避）
  const handleVideoError = useCallback((e: Event) => {
    const videoElement = e.target as HTMLVideoElement;
    const errorCode = videoElement?.error?.code;
    const errorMessage = videoElement?.error?.message;
    
    console.error('❌ Generated video error:', {
      errorCode,
      errorMessage,
      networkState: videoElement?.networkState,
      readyState: videoElement?.readyState,
      videoUrl: currentJob.result_url,
      retryCount: retryCount + 1
    });
    
    // 如果还有重试次数，自动重试
    if (retryCount < maxRetries && currentJob.result_url) {
      const nextRetry = retryCount + 1;
      // 指数退避：延迟时间逐渐增加
      const delay = Math.min(baseRetryDelay * Math.pow(1.5, retryCount), maxRetryDelay);
      
      console.log(`🔄 Video load failed, retrying (${nextRetry}/${maxRetries}) in ${Math.round(delay)}ms...`, {
        videoUrl: currentJob.result_url.substring(0, 80) + '...',
        errorCode,
        delay: Math.round(delay)
      });
      
      setRetryCount(nextRetry);
      setVideoLoadError(false); // 重置错误状态，准备重试
      
      // 延迟后重试，保留当前 src，避免清空视频元素导致闪屏
      retryTimeoutRef.current = setTimeout(() => {
        const videoEl = document.querySelector('video') as HTMLVideoElement;
        if (videoEl && currentJob.result_url) {
          console.log(`🔄 Retry ${nextRetry}: Reloading current video source...`, {
            currentSrc: (videoEl.currentSrc || videoEl.src || '').substring(0, 80) + '...',
            expectedUrl: currentJob.result_url.substring(0, 80) + '...'
          });
          videoEl.load();
        } else {
          console.warn('⚠️ Video element not found for retry, will retry on next render', {
            foundElement: !!videoEl,
            expectedUrl: currentJob.result_url ? currentJob.result_url.substring(0, 80) + '...' : 'N/A'
          });
        }
      }, delay);
    } else {
      // 超过最大重试次数，显示错误
      setVideoLoadError(true);
      console.error('❌ Video load failed after', maxRetries, 'retries. URL:', currentJob.result_url);
    }
  }, [currentJob.result_url, retryCount, maxRetries, baseRetryDelay, maxRetryDelay]);
  
  if (shouldShowLoading) {
    const createdTime = currentJob.created_at ? new Date(currentJob.created_at).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, (Date.now() - createdTime) / 1000);
    
    // 240-second uniform distribution for image-to-video (40 seconds per phase)
    let phaseProgress = 0;
    if (elapsedSeconds < 40) {
      phaseProgress = Math.min(20, (elapsedSeconds / 40) * 20);
    } else if (elapsedSeconds < 80) {
      phaseProgress = 20 + ((elapsedSeconds - 40) / 40) * 20;
    } else if (elapsedSeconds < 120) {
      phaseProgress = 40 + ((elapsedSeconds - 80) / 40) * 20;
    } else if (elapsedSeconds < 160) {
      phaseProgress = 60 + ((elapsedSeconds - 120) / 40) * 20;
    } else if (elapsedSeconds < 200) {
      phaseProgress = 80 + ((elapsedSeconds - 160) / 40) * 20;
    } else if (elapsedSeconds < 240) {
      phaseProgress = 90 + ((elapsedSeconds - 200) / 40) * 5;
    } else {
      phaseProgress = Math.min(95, 95); // 最多显示95%，直到真正完成
    }
    
    // Use server progress if available and higher than phase progress
    const serverProgress = currentJob.progress > 0 ? currentJob.progress : 0;
    const finalProgress = Math.max(phaseProgress, serverProgress);
    
    // Only show 100% when we actually have a result URL
    const displayProgress = currentJob.result_url ? 100 : Math.min(finalProgress, 95);
    
    const progressMessage = getProgressMessage(elapsedSeconds);
    const timeMessage = getTimeMessage(elapsedSeconds);
    const progressLabel = `${Math.round(displayProgress)}% complete`;

    return (
      <Card className="min-h-[500px] flex items-center justify-center bg-primary/5 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-particle-float" />
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent/30 rounded-full animate-particle-float delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary/25 rounded-full animate-particle-float delay-2000" />
        </div>
        
        <div className="relative z-10 text-center space-y-5 p-6 max-w-lg mx-auto w-full">
          {/* Enhanced status icon with breathing animation */}
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary animate-spin" />
            </div>
          </div>
          
          {/* Main progress message */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-foreground animate-fade-in">
              {progressMessage}
            </h3>
            
            {/* Enhanced progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span className="text-primary">{progressLabel}</span>
              </div>
              <div className="relative">
                <Progress 
                  value={displayProgress} 
                  className="w-full h-3 bg-secondary/50"
                />
                {/* Glowing effect on progress bar */}
                <div 
                  className="absolute top-0 left-0 h-3 bg-primary rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>
            
            {/* Dynamic AI work subtitle */}
            <div className="min-h-[2rem] flex items-center justify-center">
              <p className="text-sm text-muted-foreground animate-fade-in transition-all duration-500">
                {aiWorkSubtitles[currentSubtitle]}
              </p>
            </div>
            
            {/* Encouraging time message */}
            <p className="text-sm text-primary font-medium animate-fade-in">
              {timeMessage}
            </p>
          </div>
          
          {/* Job params summary */}
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <span>{currentJob.params.duration_sec}s</span>
            <span>{currentJob.params.aspect_ratio}</span>
            <span>{currentJob.creditCost ?? 0} credits</span>
          </div>
          
          {/* Brand emotional tagline */}
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground italic">
              Made with ❤️ by Gemini Omni Flash — where AI meets imagination
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Hang tight, your masterpiece is on its way 🌈
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              ⏱️ Average generation time: 150s — Please be patient for high-quality results
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Success state - show video
  // 关键修复：如果有result_url，无论状态是什么都显示视频（除非是FAILED）
  // 这样可以处理状态映射延迟的情况
  // finalHasVideoUrl 已在上面定义
  const shouldShowVideo = finalHasVideoUrl && currentJob.status !== 'FAILED';
  
  console.log('🎬 VideoPreview final check:', {
    status: currentJob.status,
    hasVideoUrl: hasVideoUrl,
    finalHasVideoUrl: finalHasVideoUrl,
    shouldShowVideo: shouldShowVideo,
    resultUrl: currentJob.result_url ? currentJob.result_url.substring(0, 100) : 'N/A',
    resultUrlType: typeof currentJob.result_url,
    resultUrlLength: currentJob.result_url?.length,
    progress: currentJob.progress,
    fullCurrentJob: currentJob
  });
  
  // 如果有result_url，无论状态如何都显示视频（除非是FAILED）
  if (shouldShowVideo || (currentJob.status === 'SUCCEEDED' && finalHasVideoUrl)) {
    // 如果状态是 SUCCEEDED 但没有 result_url，记录警告
    if (!currentJob.result_url) {
      console.warn('⚠️ Video status is SUCCEEDED but result_url is missing:', {
        jobId: currentJob.jobId,
        status: currentJob.status,
        progress: currentJob.progress,
        fullJob: currentJob
      });
    }
    // Inject VideoObject JSON-LD for SEO when video is ready
    const videoJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: currentJob.params?.prompt?.slice(0, 80) || 'AI generated video',
      description: currentJob.params?.prompt || 'AI generated video by Gemini Omni Flash',
      thumbnailUrl: currentJob.preview_url ? [currentJob.preview_url] : undefined,
      uploadDate: new Date(currentJob.updated_at || Date.now()).toISOString(),
      duration: currentJob.params?.duration_sec
        ? `PT${Math.max(1, Math.round(currentJob.params.duration_sec))}S`
        : undefined,
      contentUrl: currentJob.result_url,
      embedUrl: currentJob.result_url,
      inLanguage: 'en',
      publisher: {
        '@type': 'Organization',
        name: 'Gemini Omni Flash',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ivido.ai/icon.png',
        },
      },
    };

    return (
      <>
        <div className="space-y-4">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
          />
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border">
            {finalHasVideoUrl && !videoLoadError ? (
              <OptimizedVideo
                key={currentJob.result_url} // 关键：当 URL 改变时强制重新渲染
                src={currentJob.result_url!}
                poster={currentJob.preview_url}
                controls
                preload="auto" // 改为 auto 以确保下载链接能正确加载
                playsInline // 移动端内联播放
                className="w-full h-full object-contain"
                onError={handleVideoError}
                onLoad={() => {
                  console.log('✅ Video loaded successfully:', {
                    url: currentJob.result_url?.substring(0, 80) + '...',
                    jobId: currentJob.jobId,
                    videoElement: 'ready'
                  });
                  setVideoLoadError(false);
                  setRetryCount(0);
                  // 清除重试定时器
                  if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                    retryTimeoutRef.current = null;
                  }
                }}
              />
            ) : videoLoadError && finalHasVideoUrl && retryCount >= maxRetries ? (
              // 视频加载错误时的友好提示
              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                <div className="text-center space-y-4 p-8 max-w-md">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Video Temporarily Unavailable
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      The video file may still be processing or uploading. 
                      {retryCount >= maxRetries 
                        ? ` We've tried ${maxRetries} times to load the video. The file may need more time to become available.`
                        : ` Retrying... (${retryCount}/${maxRetries})`
                      }
                    </p>
                    {retryCount > 0 && retryCount < maxRetries && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Attempt {retryCount} of {maxRetries}...
                        </p>
                        <Progress value={(retryCount / maxRetries) * 100} className="w-full h-1" />
                      </div>
                    )}
                    {currentJob.result_url && (
                      <div className="pt-2">
                        <a
                          href={currentJob.result_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open video URL directly
                        </a>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVideoLoadError(false);
                        // 强制重新加载视频
                        const videoElement = document.querySelector('video');
                        if (videoElement) {
                          videoElement.load();
                        }
                      }}
                      className="mt-4"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Loading
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center space-y-4 p-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t('videoGeneratedSuccessfully')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('videoReady')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-foreground hover:bg-white/[0.08]"
              onClick={handleDownload}
              disabled={!currentJob.result_url}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-foreground hover:bg-white/[0.08]"
              >
                View full history
              </Button>
            </Link>
          </div>
        </div>

        {/* Subscription Required Modal */}
        <SubscriptionRequiredModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          feature="download videos"
        />
      </>
    );
  }

  // Failed state
  if (currentJob.status === 'FAILED') {
    return (
      <Card className="aspect-video flex items-center justify-center bg-destructive/5 border-destructive/20">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-destructive">Generation Failed</h3>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground max-w-xs">
              {currentJob.error?.message || 'An error occurred during video generation'}
            </p>
            {currentJob.error?.code && (
              <p className="text-xs text-foreground/70 dark:text-muted-foreground">
                Error Code: {currentJob.error.code}
              </p>
            )}
            <div className="text-xs text-primary bg-primary/5 px-2 py-1 rounded">
              ✓ Credits have been refunded to your account
            </div>
          </div>
          
          {onRetry && (
            <Button onClick={() => onRetry(currentJob)} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Canceled state
  return (
    <>
      <Card className="aspect-video flex items-center justify-center bg-muted/50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Generation Canceled</h3>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground">
              This generation was canceled
            </p>
          </div>
        </div>
      </Card>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="download videos"
      />
    </>
  );
};

export default VideoPreview;
