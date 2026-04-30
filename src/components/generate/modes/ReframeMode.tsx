import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReframeParams } from '@/types/generation-modes';
import { RotateCcw, Play, Upload as UploadIcon, Sparkles, CircleHelp, Image as ImageIcon, Info, X, Check, Wand2, Maximize2, Square } from 'lucide-react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { imagePromptCategories, getImageExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import ModelSelector from '@/components/generate/ModelSelector';
import PromptSection from '@/components/generate/PromptSection';
import { GenerationModelId, getVideoGenerationCreditCost, getVideoModelId, getVideoModelPatch } from '@/config/generation-models';
import {
  dropzoneClass,
  fieldLabelClass,
  primaryActionButtonClass,
  segmentedButtonClass,
  subtleButtonClass,
  workspaceSectionClass,
} from '@/components/generate/styles';

const MIN_IMAGE_WIDTH = 256;
const MIN_IMAGE_HEIGHT = 256;

interface ReframeModeProps {
  params: ReframeParams;
  onChange: (params: ReframeParams) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ReframeMode: React.FC<ReframeModeProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating
}) => {
  const t = useTranslations('generate');
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Map English category names to translation keys
  const getCategoryTranslationKey = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Cinematic Camera Moves': 'promptExamples.categories.cinematicCameraMoves',
      'Lifestyle & Product Motion': 'promptExamples.categories.lifestyleProductMotion',
      'Nature & Travel': 'promptExamples.categories.natureTravel',
      'Futuristic & Tech': 'promptExamples.categories.futuristicTech',
      'Portrait & Fashion': 'promptExamples.categories.portraitFashion',
      'Artistic Transformations': 'promptExamples.categories.artisticTransformations',
    };
    return categoryMap[category] || category;
  };

  const getTranslatedCategory = (category: string): string => {
    const key = getCategoryTranslationKey(category);
    return t(key as any) || category;
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
      img.src = url;
    });
  };

  const validateImageDimensions = async (file: File): Promise<boolean> => {
    if (!file.type.startsWith('image/')) return true;
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width < MIN_IMAGE_WIDTH || dimensions.height < MIN_IMAGE_HEIGHT) {
        toast.error(`Image dimensions are too small: ${dimensions.width}×${dimensions.height}px. Minimum allowed size is ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px.`);
        return false;
      }
      return true;
    } catch {
      toast.warning('Could not verify image dimensions. Please ensure the image is at least 256×256px.');
      return true;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isWan26 || isVeo31) {
      const isValid = await validateImageDimensions(file);
      if (!isValid) return;
    }
    onChange({ ...params, sourceVideo: file });
  };

  const handleStartFrameChange = async (file: File | undefined) => {
    if (!file) { onChange({ ...params, startFrame: undefined }); return; }
    const isValid = await validateImageDimensions(file);
    if (!isValid) return;
    onChange({ ...params, startFrame: file });
  };

  const handleEndFrameChange = async (file: File | undefined) => {
    if (!file) { onChange({ ...params, endFrame: undefined }); return; }
    const isValid = await validateImageDimensions(file);
    if (!isValid) return;
    onChange({ ...params, endFrame: file });
  };

  const handleSelectExample = (prompt: string, aspectRatio?: '9:16' | '16:9') => {
    onChange({
      ...params,
      prompt,
      ...(aspectRatio ? { targetAspectRatio: aspectRatio } : {}),
    });
    setIsExamplesOpen(false);
  };

  const selectedModelId = getVideoModelId(params);
  const isVeo31 = true;
  const isWan26 = false;
  const isLegacyModel = !isVeo31 && !isWan26;

  const creditCost = getVideoGenerationCreditCost(params);

  const handleModelChange = (value: GenerationModelId) => {
    onChange({
      ...params,
      ...getVideoModelPatch(value),
      quality: undefined,
      seeds: undefined,
      startFrame: undefined,
      endFrame: undefined,
      wan26Duration: undefined,
      wan26Resolution: undefined,
      wan26MultiShots: undefined,
    });
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-5">
        {/* Model Selection */}
        <div className={workspaceSectionClass}>
          <ModelSelector
            workflow="image-to-video"
            value={selectedModelId}
            onValueChange={handleModelChange}
            label={t('reframeMode.model')}
            mounted={isMounted}
          />
        </div>

        <PromptSection
          label={t('reframeMode.prompt')}
          tooltip={t('reframeMode.promptTooltip')}
          examplesLabel={t('reframeMode.aiExamples')}
          placeholder={t('reframeMode.promptPlaceholder')}
          value={params.prompt || ''}
          onChange={(prompt) => onChange({ ...params, prompt })}
          examplesOpen={isExamplesOpen}
          onExamplesOpenChange={setIsExamplesOpen}
          examplesDialog={
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {t('reframeMode.promptExamplesTitle')}
                </DialogTitle>
                <DialogDescription>{t('reframeMode.promptExamplesDescription')}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue={imagePromptCategories[0]} className="w-full">
                <TabsList className="!flex flex-wrap gap-2 justify-start !h-auto p-2 bg-white/[0.04] backdrop-blur-sm">
                  {imagePromptCategories.map(category => (
                    <TabsTrigger key={category} value={category} className="text-xs px-3 py-2 !whitespace-normal leading-snug text-center rounded-md min-h-[2.75rem] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      {getTranslatedCategory(category)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {imagePromptCategories.map(category => (
                  <TabsContent key={category} value={category} className="mt-4">
                    <div className="grid gap-3">
                      {getImageExamplesByCategory(category).map(example => (
                        <Card key={example.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary" onClick={() => handleSelectExample(example.prompt, example.aspectRatio)}>
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-foreground">{example.title}</div>
                            <div className="text-xs text-muted-foreground leading-relaxed">{example.prompt}</div>
                            <Button size="sm" className={`w-full ${primaryActionButtonClass}`} onClick={(e) => { e.stopPropagation(); handleSelectExample(example.prompt, example.aspectRatio); }}>
                              {t('reframeMode.useThisPrompt')}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </DialogContent>
          }
        />

        {/* Image Upload Section */}
        <div className={workspaceSectionClass}>
          <div className="flex items-center gap-2">
            <Label className={fieldLabelClass}>
              {isVeo31 ? 'Image *' : t('reframeMode.referenceImage')}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Reference Image info" className="text-muted-foreground transition-colors hover:text-foreground">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {isVeo31 ? 'Upload start frame and/or end frame images' : t('reframeMode.referenceImageTooltip')}
              </TooltipContent>
            </Tooltip>
          </div>

          {isVeo31 ? (
            /* Veo3.1: Start Frame and End Frame */
            <div className="grid grid-cols-2 gap-4">
              {/* Start Frame */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start Frame</Label>
                <div className={dropzoneClass}>
                  {params.startFrame ? (
                    <div className="space-y-2">
                      <div className="relative mx-auto h-24 w-full overflow-hidden rounded-lg border border-border">
                        <img src={URL.createObjectURL(params.startFrame)} alt="Start frame" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                        <button onClick={() => onChange({ ...params, startFrame: undefined })} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background transition-colors">
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{params.startFrame.name}</p>
                    </div>
                  ) : (
                    <label className="block cursor-pointer space-y-2">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleStartFrameChange(file); }} />
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UploadIcon className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground">Upload start frame</p>
                    </label>
                  )}
                </div>
              </div>
              {/* End Frame */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">End Frame</Label>
                <div className={dropzoneClass}>
                  {params.endFrame ? (
                    <div className="space-y-2">
                      <div className="relative mx-auto h-24 w-full overflow-hidden rounded-lg border border-border">
                        <img src={URL.createObjectURL(params.endFrame)} alt="End frame" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                        <button onClick={() => onChange({ ...params, endFrame: undefined })} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background transition-colors">
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{params.endFrame.name}</p>
                    </div>
                  ) : (
                    <label className="block cursor-pointer space-y-2">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleEndFrameChange(file); }} />
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UploadIcon className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground">Upload end frame</p>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Sora / Wan2.6: Single image upload */
            <div className={dropzoneClass}>
              {params.sourceVideo ? (
                <div className="space-y-2">
                  <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-xl border border-border">
                    <img src={URL.createObjectURL(params.sourceVideo)} alt="Uploaded image" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{params.sourceVideo.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(params.sourceVideo.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onChange({ ...params, sourceVideo: undefined as any })} className={subtleButtonClass}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('reframeMode.changeImage')}
                  </Button>
                </div>
              ) : (
                <label className="block cursor-pointer space-y-2">
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{t('reframeMode.uploadReferenceFile')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t('reframeMode.dragDropText')}</p>
                    <p className="text-xs text-muted-foreground">{t('reframeMode.fileFormatText')}</p>
                  </div>
                </label>
              )}
            </div>
          )}

          {isVeo31 && (
            <>
              <p className="text-xs text-muted-foreground">Drag and drop or click to upload your image</p>
              <p className="text-xs text-muted-foreground">Supported formats: JPG, JPEG, PNG; each file max 10MB.</p>
            </>
          )}
        </div>

        {/* Settings Grid */}
        <div className={`${workspaceSectionClass} grid gap-3 md:grid-cols-2`}>
          {/* Aspect Ratio */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Label className={fieldLabelClass}>
                {isVeo31 ? 'Ratio' : t('reframeMode.aspectRatio')}
              </Label>
              {!isVeo31 && !isWan26 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Aspect Ratio info" className="text-muted-foreground transition-colors hover:text-foreground">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">{t('reframeMode.aspectRatioTooltip')}</TooltipContent>
              </Tooltip>
              )}
            </div>
            <div className="flex space-x-2">
              {isVeo31 && (
                <Button
                  variant={params.targetAspectRatio === 'Auto' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, targetAspectRatio: 'Auto' })}
                  className={segmentedButtonClass(params.targetAspectRatio === 'Auto')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto
                </Button>
              )}
              <Button
                variant={params.targetAspectRatio === '9:16' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, targetAspectRatio: '9:16' })}
                className={segmentedButtonClass(params.targetAspectRatio === '9:16')}
              >
                {isVeo31 ? (<><Square className="w-4 h-4 mr-2" />9:16</>) : t('reframeMode.portrait')}
              </Button>
              <Button
                variant={params.targetAspectRatio === '16:9' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, targetAspectRatio: '16:9' })}
                className={segmentedButtonClass(params.targetAspectRatio === '16:9')}
              >
                {isVeo31 ? (<><Maximize2 className="w-4 h-4 mr-2" />16:9</>) : t('reframeMode.landscape')}
              </Button>
            </div>
          </div>

          {/* Duration (n_frames) - Show for legacy models */}
          {isLegacyModel && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>{t('reframeMode.duration')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Duration info" className="text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">{t('reframeMode.durationTooltip')}</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button variant={params.n_frames === '10' ? 'default' : 'outline'} onClick={() => onChange({ ...params, n_frames: '10' })} className={segmentedButtonClass(params.n_frames === '10')}>10s</Button>
                <Button variant={params.n_frames === '15' ? 'default' : 'outline'} onClick={() => onChange({ ...params, n_frames: '15' })} className={segmentedButtonClass(params.n_frames === '15')}>15s</Button>
              </div>
            </div>
          )}

          {/* Seed (Optional) — Only for Veo3.1 */}
          {isVeo31 && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>Seed (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Seed info" className="text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">Random seed parameter to control the randomness of the generated content (10000-99999)</TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={params.seeds || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  if (value === undefined || (value >= 10000 && value <= 99999)) {
                    onChange({ ...params, seeds: value });
                  }
                }}
                placeholder="please input seed"
                min={10000}
                max={99999}
                className="w-full"
              />
            </div>
          )}

          {/* Quality Selector (for legacy Pro models) */}
          {isLegacyModel && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>{t('reframeMode.quality')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Quality info" className="text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">{t('reframeMode.qualityTooltip')}</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button variant={params.quality === 'standard' || !params.quality ? 'default' : 'outline'} onClick={() => onChange({ ...params, quality: 'standard' })} className={segmentedButtonClass(params.quality === 'standard' || !params.quality)}>
                  {t('reframeMode.standard')}
                </Button>
                <Button variant={params.quality === 'high' ? 'default' : 'outline'} onClick={() => onChange({ ...params, quality: 'high' })} className={segmentedButtonClass(params.quality === 'high')}>
                  {t('reframeMode.high')}
                </Button>
              </div>
            </div>
          )}

          {/* Wan2.6 Duration */}
          {isWan26 && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>Duration</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Duration info" className="text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">The duration of the generated video in seconds</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button variant={(params.wan26Duration || '5') === '5' ? 'default' : 'outline'} onClick={() => onChange({ ...params, wan26Duration: '5' })} className={segmentedButtonClass((params.wan26Duration || '5') === '5')}>5 seconds</Button>
                <Button variant={params.wan26Duration === '10' ? 'default' : 'outline'} onClick={() => onChange({ ...params, wan26Duration: '10' })} className={segmentedButtonClass(params.wan26Duration === '10')}>10 seconds</Button>
                <Button variant={params.wan26Duration === '15' ? 'default' : 'outline'} onClick={() => onChange({ ...params, wan26Duration: '15' })} className={segmentedButtonClass(params.wan26Duration === '15')}>15 seconds</Button>
              </div>
            </div>
          )}

          {/* Wan2.6 Resolution */}
          {isWan26 && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>Resolution</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Resolution info" className="text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">Video resolution tier</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button variant={params.wan26Resolution === '720p' ? 'default' : 'outline'} onClick={() => onChange({ ...params, wan26Resolution: '720p' })} className={segmentedButtonClass(params.wan26Resolution === '720p')}>720p</Button>
                <Button variant={(params.wan26Resolution || '1080p') === '1080p' ? 'default' : 'outline'} onClick={() => onChange({ ...params, wan26Resolution: '1080p' })} className={segmentedButtonClass((params.wan26Resolution || '1080p') === '1080p')}>1080p</Button>
              </div>
            </div>
          )}

          {/* Wan2.6 Multi Shots */}
          {isWan26 && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>Multi Shots</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Multi shots info" className="text-muted-foreground transition-colors hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">The multi shots parameter controls the shot composition style during AI video generation.</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button variant={(params.wan26MultiShots === false || params.wan26MultiShots === undefined) ? 'default' : 'outline'} onClick={() => onChange({ ...params, wan26MultiShots: false })} className={segmentedButtonClass(params.wan26MultiShots === false || params.wan26MultiShots === undefined)}>Single Shot</Button>
                <Button variant={params.wan26MultiShots === true ? 'default' : 'outline'} onClick={() => onChange({ ...params, wan26MultiShots: true })} className={segmentedButtonClass(params.wan26MultiShots === true)}>Multi Shots</Button>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          className={`w-full ${primaryActionButtonClass}`}
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              {t('generating')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {t('generateWithCredits', { creditCost })}
            </>
          )}
        </Button>
      </div>
    </TooltipProvider>
  );
};
