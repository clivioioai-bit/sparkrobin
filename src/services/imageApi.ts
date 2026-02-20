'use client';

import { supabase } from '@/lib/supabase';

export interface GenerateImageRequest {
  prompt: string;
  model: 'nano-banana-text-to-image' | 'nano-banana-pro' | 'nano-banana-image-editor';
  output_format?: 'png' | 'jpeg' | 'jpg';
  image_size?: string;
  aspect_ratio?: string;
  resolution?: '1K' | '2K' | '4K';
  image_input?: string[];
}

export interface GenerateImageResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
}

export interface ImageJobStatus {
  generation_id: string;
  status: 'processing' | 'completed' | 'failed';
  result_url?: string;
  thumbnail_url?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export class ImageApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ImageApiError';
  }
}

// Get auth token from Supabase session
const getAuthToken = async (): Promise<string> => {
  try {
    let { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[getAuthToken] Error getting session:', error);
      throw new ImageApiError('Failed to get session', 401);
    }

    if (!session?.access_token) {
      console.warn('[getAuthToken] No session or access token found, attempting to refresh...');

      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshedSession?.access_token) {
        console.error('[getAuthToken] Failed to refresh session:', refreshError);
        throw new ImageApiError('User not authenticated. Please sign in again.', 401);
      }

      session = refreshedSession;
      console.log('[getAuthToken] Session refreshed successfully');
    }

    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt - now < fiveMinutes) {
        console.log('[getAuthToken] Token expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession?.access_token) {
          console.warn('[getAuthToken] Failed to refresh expiring token, using current token:', refreshError);
        } else {
          session = refreshedSession;
          console.log('[getAuthToken] Token refreshed proactively');
        }
      }
    }

    if (!session?.access_token) {
      console.error('[getAuthToken] No access token available after refresh attempts');
      throw new ImageApiError('User not authenticated. Please sign in again.', 401);
    }

    return session.access_token;
  } catch (error) {
    console.error('[getAuthToken] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof ImageApiError) {
      throw error;
    }

    throw new ImageApiError('User not authenticated. Please sign in again.', 401);
  }
};

// Upload image file
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/kie/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ImageApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    const data = await response.json();
    return data.url || data.video_url || data.result_url;
  } catch (error) {
    if (error instanceof ImageApiError) {
      throw error;
    }
    throw new ImageApiError(
      error instanceof Error ? error.message : 'Failed to upload image',
      500
    );
  }
};

// Generate image
export const generateImage = async (params: GenerateImageRequest): Promise<GenerateImageResponse> => {
  try {
    const token = await getAuthToken();

    const response = await fetch('/api/kie/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ImageApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ImageApiError) {
      throw error;
    }
    throw new ImageApiError(
      error instanceof Error ? error.message : 'Failed to generate image',
      500
    );
  }
};

// Get image generation status
export const getImageStatus = async (taskId: string): Promise<ImageJobStatus> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`/api/kie/image/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ImageApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ImageApiError) {
      throw error;
    }
    throw new ImageApiError(
      error instanceof Error ? error.message : 'Failed to get image status',
      500
    );
  }
};
