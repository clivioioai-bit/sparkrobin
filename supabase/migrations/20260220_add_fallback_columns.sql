-- Add fallback tracking columns to video_jobs table
-- These columns support the multi-provider fallback system (KIE → wan2.5, KIE → APIMart, Evolink)

ALTER TABLE video_jobs
ADD COLUMN IF NOT EXISTS api_version VARCHAR(20) DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;

-- Add index for efficient querying of fallback jobs
CREATE INDEX IF NOT EXISTS idx_video_jobs_api_version ON video_jobs(api_version);
CREATE INDEX IF NOT EXISTS idx_video_jobs_fallback_used ON video_jobs(fallback_used) WHERE fallback_used = true;
