"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Helper functions for Supabase operations
type SupabaseUserRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_end_date: string | null;
  credits_balance: number | null;
  credits_total: number | null;
  credits_spent: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
};

const getUserSubscription = async (_userId: string): Promise<(SupabaseUserRecord & { subscription: any; generation_count?: number }) | null> => {
  try {
    const response = await fetch('/api/account/summary', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Account summary request failed with status:', response.status);
      return null;
    }

    const payload = await response.json();
    return payload?.summary || null;
  } catch (error) {
    console.warn('Account summary request failed:', error);
    return null;
  }
};

const getUserGenerations = async (_userId: string) => {
  try {
    const res = await fetch('/api/videos/history?limit=20&offset=0', {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('Generation history request failed with status:', res.status);
      return [];
    }

    const json = await res.json();
    const jobs = Array.isArray(json?.jobs) ? json.jobs : [];

    return jobs.map((job: any) => ({
      id: job.job_id || job.id || '',
      prompt: job.prompt,
      negative_prompt: job.negativePrompt,
      duration: job.duration ?? 0,
      resolution: job.aspectRatio || job.aspect_ratio || job.resolution || '1280x720',
      model: job.model || 'sora3',
      status: job.status || 'processing',
      credits_used: job.creditsUsed ?? job.cost_credits ?? 0,
      video_url: job.videoUrl || job.result_url,
      thumbnail_url: job.thumbnailUrl || job.preview_url,
      created_at: job.createdAt || job.created_at,
      completed_at: job.completedAt || job.updatedAt || job.updated_at
    }));
  } catch (fallbackError) {
    const errorMessage = fallbackError instanceof Error 
      ? fallbackError.message 
      : (typeof fallbackError === 'string' ? fallbackError : 'Unknown error');
    console.warn('Generation history request failed:', errorMessage);
    return [];
  }
};

const createVideoGeneration = async (params: any) => {
  const { data, error } = await supabase
    .from('video_jobs')
    .insert(params)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating generation:', error);
    throw error;
  }
  return data;
};

const updateVideoGeneration = async (generationId: string, updates: any) => {
  const { error } = await supabase
    .from('video_jobs')
    .update(updates)
    .eq('job_id', generationId);
  
  if (error) {
    console.error('Error updating generation:', error);
    throw error;
  }
};

// Types
export interface UserSubscription {
  id: string;
  plan: string;
  status: string;
  credits: number;
  totalCredits: number;
  resetDate: string;
  createdAt: string;
}

export interface GenerationHistory {
  id: string;
  prompt: string;
  negativePrompt?: string;
  duration: number;
  resolution: string;
  model: string;
  status: 'processing' | 'completed' | 'failed';
  creditsUsed: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  completedAt?: string;
}

interface CreditsContextType {
  // User data
  subscription: UserSubscription | null;
  generations: GenerationHistory[];
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  refreshCredits: () => Promise<void>;
  generateVideo: (params: {
    prompt: string;
    negativePrompt?: string;
    duration: number;
    resolution: string;
    model: string;
    wan26Duration?: '5' | '10' | '15';
    wan26Resolution?: '720p' | '1080p';
  }) => Promise<{ success: boolean; generationId?: string; error?: string }>;

  // Utilities
  calculateCredits: (
    duration: number,
    resolution: string,
    model: string,
    n_frames?: '10' | '15',
    quality?: 'standard' | 'high',
    wan26Duration?: '5' | '10' | '15',
    wan26Resolution?: '720p' | '1080p'
  ) => number;
  canGenerate: (requiredCredits: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};

interface CreditsProviderProps {
  children: ReactNode;
}

export const CreditsProvider: React.FC<CreditsProviderProps> = ({ children }) => {
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [generations, setGenerations] = useState<GenerationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();

  // Calculate credits required for generation
  const calculateCredits = (
    _duration: number,
    _resolution: string,
    model: string,
    n_frames?: '10' | '15',
    quality?: 'standard' | 'high',
    wan26Duration?: '5' | '10' | '15',
    wan26Resolution?: '720p' | '1080p'
  ): number => {
    // Wan2.6 pricing
    if (model === 'wan2.6') {
      const durationKey = wan26Duration || '5';
      const resolutionKey = wan26Resolution || '1080p';
      const pricingTable: Record<'720p' | '1080p', Record<'5' | '10' | '15', number>> = {
        '720p': { '5': 80, '10': 160, '15': 220 },
        '1080p': { '5': 120, '10': 220, '15': 320 }
      };
      return pricingTable[resolutionKey][durationKey];
    }

    // Veo3.1 pricing: handled via quality param — 'veo3_fast' = 60, 'veo3' (quality) = 250
    if (model === 'veo3.1') {
      return quality === 'high' ? 250 : 60; // high maps to veo3 quality, else veo3_fast
    }

    // Spark Robin Pro / Sora2 Pro pricing (same pricing)
    if (model === 'sora3-pro' || model === 'sora2-pro') {
      if (quality === 'high') {
        return n_frames === '15' ? 650 : 350;
      } else if (quality === 'standard') {
        return n_frames === '15' ? 270 : 150;
      }
      // Default to standard if quality not specified
      return n_frames === '15' ? 270 : 150;
    }

    // Sora2 pricing: 10s = 40 credits, 15s = 50 credits
    if (model === 'sora2') {
      return n_frames === '15' ? 50 : 40;
    }

    // Storyboard pricing: 10s = 125, 15s/25s = 225
    if (model === 'storyboard') {
      return n_frames === '10' ? 125 : 225;
    }

    // Sora3 (default) pricing: 10s = 30 credits, 15s = 40 credits
    if (n_frames === '15') {
      return 40;
    }
    // 默认 10s 或未指定时返回 30 credits
    return 30;
  };

  // Check if user can generate with current credits
  const canGenerate = (requiredCredits: number): boolean => {
    const availableCredits = subscription?.credits ?? 0;
    return availableCredits >= requiredCredits;
  };

  // Refresh user credits and subscription data
  const refreshCredits = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      // Fetch subscription and generation history from Supabase
      const [userSubscriptionData, generationsData] = await Promise.all([
        getUserSubscription(user.id),
        getUserGenerations(user.id)
      ]);

      if (userSubscriptionData) {
        // Map Supabase response to local types
        const mappedSubscription: UserSubscription = {
          id: String(userSubscriptionData.id ?? user.id),
          plan: userSubscriptionData.subscription_plan ?? 'free',
          status: userSubscriptionData.subscription_status ?? 'inactive',
          credits: userSubscriptionData.credits_balance ?? 0,
          totalCredits: userSubscriptionData.credits_total ?? 0,
          resetDate: userSubscriptionData.subscription_end_date ?? '',
          createdAt: userSubscriptionData.created_at ?? new Date().toISOString()
        };

        const mappedGenerations: GenerationHistory[] = generationsData.map(gen => ({
          id: gen.id.toString(),
          prompt: gen.prompt,
          negativePrompt: gen.negative_prompt,
          duration: gen.duration,
          resolution: gen.resolution,
          model: gen.model,
          status: gen.status,
          creditsUsed: gen.credits_used,
          videoUrl: gen.video_url,
          thumbnailUrl: gen.thumbnail_url,
          createdAt: gen.created_at,
          completedAt: gen.completed_at || ''
        }));

        setSubscription(mappedSubscription);
        setGenerations(mappedGenerations);
      } else {
        setSubscription(null);
        setGenerations([]);
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Generate video function
  const generateVideo = async (params: {
    prompt: string;
    negativePrompt?: string;
    duration: number;
    resolution: string;
    model: string;
    wan26Duration?: '5' | '10' | '15';
    wan26Resolution?: '720p' | '1080p';
  }): Promise<{ success: boolean; generationId?: string; error?: string }> => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const requiredCredits = calculateCredits(
      params.duration,
      params.resolution,
      params.model,
      undefined,
      undefined,
      params.wan26Duration,
      params.wan26Resolution
    );
    
    if (!canGenerate(requiredCredits)) {
      return { success: false, error: 'Insufficient credits' };
    }

    try {
      // Create generation record in Supabase
      const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newGeneration = await createVideoGeneration({
        user_id: user.id,
        generation_id: generationId,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        duration: params.duration,
        resolution: params.resolution,
        model: params.model,
        status: 'processing',
        credits_used: requiredCredits,
      });

      // Map to local type
      const mappedGeneration: GenerationHistory = {
        id: newGeneration.id.toString(),
        prompt: newGeneration.prompt,
        negativePrompt: newGeneration.negative_prompt,
        duration: newGeneration.duration,
        resolution: newGeneration.resolution,
        model: newGeneration.model,
        status: newGeneration.status,
        creditsUsed: newGeneration.credits_used,
        videoUrl: newGeneration.video_url,
        thumbnailUrl: newGeneration.thumbnail_url,
        createdAt: newGeneration.created_at,
        completedAt: newGeneration.completed_at || ''
      };

      // Add to generations list
      setGenerations(prev => [mappedGeneration, ...prev]);
      
      // Refresh balance from server after deduction
      await refreshCredits();

      // Start polling for completion (mock - in real implementation this would call external API)
      setTimeout(() => {
        pollGenerationStatus(generationId);
      }, 2000);

      return { success: true, generationId: generationId };
    } catch (error) {
      console.error('Failed to generate video:', error);
      return { success: false, error: 'Generation failed' };
    }
  };

  // Poll generation status until completion (mock implementation)
  const pollGenerationStatus = async (generationId: string) => {
    const poll = async () => {
      try {
        // Mock completion after 10 seconds
        setTimeout(() => {
          // Update the generation to completed status with mock video URL
          setGenerations(prev => prev.map(gen => 
            gen.id === generationId ? {
              ...gen,
              status: 'completed' as const,
              videoUrl: 'https://demo-video-url.com/video.mp4',
              thumbnailUrl: 'https://demo-video-url.com/thumb.jpg',
              completedAt: new Date().toISOString()
            } : gen
          ));

          // Update in Supabase
          updateVideoGeneration(generationId, {
            status: 'completed',
            video_url: 'https://demo-video-url.com/video.mp4',
            thumbnail_url: 'https://demo-video-url.com/thumb.jpg',
            completed_at: new Date().toISOString()
          });
        }, 10000);
      } catch (error) {
        console.error('Failed to poll generation status:', error);
      }
    };

    poll();
  };

  // Load user data on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCredits();
    } else {
      setSubscription(null);
      setGenerations([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, refreshCredits]);

  const value: CreditsContextType = {
    subscription,
    generations,
    isLoading,
    refreshCredits,
    generateVideo,
    calculateCredits,
    canGenerate
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
};

export default CreditsContext;
