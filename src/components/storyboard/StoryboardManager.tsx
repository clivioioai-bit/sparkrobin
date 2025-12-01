import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { 
  Plus, 
  Play, 
  Clock,
  AlertTriangle,
  Sparkles,
  Upload,
  X,
  ImageIcon
} from 'lucide-react';
import { StoryboardShot, StoryboardParams } from '@/types/storyboard';
import { StoryboardSceneComponent } from './StoryboardScene';
import { cn } from '@/lib/utils';

interface StoryboardManagerProps {
  params: StoryboardParams;
  onParamsChange: (params: StoryboardParams) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  creditCost: number;
}

export const StoryboardManager: React.FC<StoryboardManagerProps> = ({
  params,
  onParamsChange,
  onGenerate,
  isGenerating,
  creditCost
}) => {
  const t = useTranslations('generate');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalUsedDuration = params.shots.reduce((sum, shot) => sum + shot.duration, 0);
  const remainingDuration = parseInt(params.n_frames) - totalUsedDuration;
  const canAddScene = remainingDuration > 0;
  
  // Ensure consistent rendering for hydration
  const remainingDurationDisplay = Math.max(0, remainingDuration).toFixed(1);

  const addScene = useCallback(() => {
    if (!canAddScene) return;

    const newShot: StoryboardShot = {
      prompt: '',
      duration: Math.min(5, remainingDuration),
    };

    onParamsChange({
      ...params,
      shots: [...params.shots, newShot]
    });
  }, [params, onParamsChange, canAddScene, remainingDuration]);

  const updateShot = useCallback((updatedShot: StoryboardShot, index: number) => {
    onParamsChange({
      ...params,
      shots: params.shots.map((shot, i) => 
        i === index ? updatedShot : shot
      )
    });
  }, [params, onParamsChange]);

  const deleteShot = useCallback((index: number) => {
    const updatedShots = params.shots.filter((_, i) => i !== index);

    onParamsChange({
      ...params,
      shots: updatedShots
    });
  }, [params, onParamsChange]);

  const toggleShotCollapse = useCallback((index: number) => {
    setCollapsedScenes(prev => {
      const newSet = new Set(prev);
      const shotId = `shot_${index}`;
      if (newSet.has(shotId)) {
        newSet.delete(shotId);
      } else {
        newSet.add(shotId);
      }
      return newSet;
    });
  }, []);

  const updateTotalDuration = useCallback((n_frames: "10" | "15" | "25") => {
    onParamsChange({
      ...params,
      n_frames
    });
  }, [params, onParamsChange]);

  const updateAspectRatio = useCallback((aspect_ratio: 'portrait' | 'landscape') => {
    onParamsChange({
      ...params,
      aspect_ratio
    });
  }, [params, onParamsChange]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('storyboard.invalidImageFile'));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('storyboard.imageSizeTooLarge'));
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Update params with file info (for Generate API)
    onParamsChange({
      ...params,
      image_file: file  // Store file object for later upload
    });
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    
    onParamsChange({
      ...params,
      image_file: undefined
    });
  };

  const isFormValid = params.shots.length > 0 && 
    params.shots.every(shot => shot.prompt.trim().length > 0);

  return (
    <div className={`space-y-6 overflow-y-auto pr-2 ${isMounted ? 'max-h-[80vh]' : 'max-h-[600px]'}`}>
      {/* Total Duration Selection */}
      <Card className="p-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('storyboard.totalDuration')}</Label>
          <div className="flex space-x-2">
            {["10", "15", "25"].map(n_frames => (
              <Button
                key={n_frames}
                variant={params.n_frames === n_frames ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTotalDuration(n_frames as "10" | "15" | "25")}
                className="flex-1"
              >
                {n_frames}s
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('storyboard.totalLengthDescription')}</p>
        </div>
      </Card>

      {/* Shots Section */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Shots Header with Remaining Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                {t('storyboard.shots')} ({t('storyboard.totalDuration')}: <span suppressHydrationWarning>{params.n_frames}</span>s)
              </h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-muted-foreground">
                {t('storyboard.remaining')}: <span suppressHydrationWarning>{remainingDurationDisplay}</span>s
              </span>
            </div>
          </div>

          {/* Shots List */}
          <div className="space-y-3">
            {params.shots.map((shot, index) => (
              <StoryboardSceneComponent
                key={index}
                shot={shot}
                index={index}
                onUpdate={(updatedShot) => updateShot(updatedShot, index)}
                onDelete={() => deleteShot(index)}
                maxDuration={parseInt(params.n_frames)}
                remainingDuration={remainingDuration + shot.duration}
                isCollapsed={collapsedScenes.has(`shot_${index}`)}
                onToggleCollapse={() => toggleShotCollapse(index)}
              />
            ))}
          </div>

          {/* Add Shot Button */}
          <Card className="p-4 border-dashed border-border">
            <Button
              variant="outline"
              onClick={addScene}
              disabled={!canAddScene}
              className="w-full h-12 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              {canAddScene ? t('storyboard.addShot') : t('storyboard.maximumDurationReached')}
            </Button>
          </Card>

          {/* Warning Message */}
          {remainingDuration > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                {t('storyboard.allocateRemainingDuration', { duration: remainingDurationDisplay })}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Global Image Upload */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t('storyboard.imageUrls')}</Label>
            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeImage}
                className="text-xs"
              >
                {t('storyboard.removeAll')}
              </Button>
            )}
          </div>
          
          {previewUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>{t('storyboard.selectedImage')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeImage}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="relative">
                <img
                  src={previewUrl}
                  alt={t('storyboard.referenceImage')}
                  className="w-full h-48 object-cover rounded-md border"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('storyboard.imageUploadOnGenerate')}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-md p-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('storyboard.selectImage')}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {t('storyboard.supportedFormats')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('storyboard.uploadImageDescription')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Aspect Ratio Selection */}
      <Card className="p-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('storyboard.aspectRatio')}</Label>
          <div className="flex space-x-2">
            <Button
              variant={params.aspect_ratio === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateAspectRatio('portrait')}
              className="flex-1"
            >
              {t('storyboard.portrait')}
            </Button>
            <Button
              variant={params.aspect_ratio === 'landscape' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateAspectRatio('landscape')}
              className="flex-1"
            >
              {t('storyboard.landscape')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('storyboard.aspectRatioDescription')}</p>
        </div>
      </Card>

      {/* Generate Button */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t('readyToGenerate')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isFormValid 
                ? t('generateShots', { count: params.shots.length })
                : t('addPromptsToAllShots')
              }
            </p>
          </div>
          
          <Button
            onClick={onGenerate}
            disabled={!isFormValid || isGenerating}
            size="lg"
            className="px-8"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                {t('generating')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t('generateWithCredits', { creditCost })}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};