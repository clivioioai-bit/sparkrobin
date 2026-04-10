"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Play, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { generationHistoryService, GenerationHistoryItem } from "@/services/generationHistoryService";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

interface GenerationHistoryProps {
  className?: string;
}

const GenerationHistory = ({ className }: GenerationHistoryProps) => {
  const t = useTranslations("account.generationHistory");
  const locale = useLocale();
  const [jobs, setJobs] = useState<GenerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await generationHistoryService.getHistory(50, 0);
      setJobs(response.jobs);
    } catch (err) {
      console.error('Failed to load generation history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (job: GenerationHistoryItem) => {
    if (!job.videoUrl) {
      toast.error('Video not available for download');
      return;
    }

    try {
      setDownloading(job.id);
      await generationHistoryService.downloadVideo(
        job.videoUrl, 
        `video_${job.jobId}.mp4`
      );
      toast.success('Video downloaded successfully');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download video');
    } finally {
      setDownloading(null);
    }
  };

  const handlePlay = (job: GenerationHistoryItem) => {
    if (!job.videoUrl) {
      toast.error('Video not available for playback');
      return;
    }
    setPlayingVideoUrl(job.videoUrl);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'queued':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncatePrompt = (prompt: string, maxLength: number = 100) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>{t("loading")}</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadHistory} variant="outline">
            {t("tryAgain")}
          </Button>
        </div>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-2">{t("emptyTitle")}</h3>
          <p className="text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <Button onClick={loadHistory} variant="outline" size="sm">
          {t("refresh")}
        </Button>
      </div>
      
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(job.status)}
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {t(`statuses.${job.status}`)}
                  </Badge>
                </div>
                
                <p className="font-medium text-sm mb-2 break-words">
                  {truncatePrompt(job.prompt)}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{job.duration}s</span>
                  <span>{job.aspectRatio}</span>
                  <span>{job.resolution}</span>
                  <span>{job.model}</span>
                  <span>{formatDate(job.createdAt)}</span>
                </div>
                
                {job.errorMessage && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                    {job.errorMessage}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {job.videoUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(job);
                    }}
                    disabled={downloading === job.id}
                  >
                    {downloading === job.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                )}
                
                {job.videoUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handlePlay(job);
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!playingVideoUrl} onOpenChange={(open) => !open && setPlayingVideoUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t("videoPlayer")}</DialogTitle>
          </DialogHeader>
          {playingVideoUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={playingVideoUrl}
                controls
                autoPlay
                className="w-full h-full"
                style={{ maxHeight: 'calc(90vh - 100px)' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GenerationHistory;
