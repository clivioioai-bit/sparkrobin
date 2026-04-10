import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReframeParams } from '@/types/generation-modes';
import { RotateCcw, Play, Upload as UploadIcon, Lightbulb, Sparkles, CircleHelp, Image as ImageIcon, Info, X, Check, ChevronUp, Wand2, Maximize2, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { imagePromptCategories, getImageExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  dropzoneClass,
  fieldLabelClass,
  primaryActionButtonClass,
  segmentedButtonClass,
  selectTriggerClass,
  subtleButtonClass,
  textAreaClass,
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

  const currentModel = params.model === 'wan2.6' ? 'wan2.6' : 'veo3.1';
  const isVeo31 = currentModel === 'veo3.1';
  const isWan26 = currentModel === 'wan2.6';
  const isLegacyModel = !isVeo31 && !isWan26;
  const veoDisplayModel = params.veoDisplayModel || 'veo4';
  const veoModelVariant = params.veoDisplayModel === 'veo4' ? 'veo3_fast' : (params.veo3SubModel || 'veo3_fast');

  // Calculate credits based on model, quality, and n_frames
  const calculateCredits = (): number => {
    if (isWan26) {
      const durationKey = params.wan26Duration || '5';
      const resolutionKey = params.wan26Resolution || '1080p';
      const pricingTable: Record<'720p' | '1080p', Record<'5' | '10' | '15', number>> = {
        '720p': { '5': 80, '10': 160, '15': 220 },
        '1080p': { '5': 120, '10': 220, '15': 320 }
      };
      return pricingTable[resolutionKey][durationKey];
    }
    if (isVeo31) {
      return params.veo3SubModel === 'veo3' ? 250 : 60;
    }
    return params.n_frames === '15' ? 40 : 30;
  };

  const creditCost = calculateCredits();

  // Get display label for the selected model in the trigger
  const getModelLabel = (): string => {
    if (isVeo31) {
      if (veoDisplayModel === 'veo4') {
        return 'Veo4';
      }
      return veoModelVariant === 'veo3_fast' ? 'Veo3.1 Fast' : 'Veo3.1 Quality';
    }
    if (isWan26) return 'Wan 2.6';
    return 'Veo4 Fast';
  };

  // Get trigger icon
  const getTriggerIcon = () => {
    if (isVeo31) return <img src="/images/google_veo_logo.jpeg" alt="Veo3.1" width={32} height={32} className="w-full h-full object-contain" />;
    if (isWan26) return <img src="/images/qwen-color.webp" alt="Wan2.6" width={32} height={32} className="w-full h-full object-contain" />;
    return <img src="/logo-v2.png" alt="Veo4 model icon" width={32} height={32} className="w-full h-full object-contain" />;
  };

  // Compute the Select value — Veo3.1 uses compound values
  const selectValue = isVeo31
    ? (veoDisplayModel === 'veo4' ? 'veo4-veo3_fast' : `veo3.1-${veoModelVariant}`)
    : currentModel;

  const handleModelChange = (value: string) => {
    // Veo4 is a frontend alias; both Veo4 and Veo3.1 selections map to the same backend model.
    if (
      value === 'veo4-veo3_fast' ||
      value === 'veo3.1-veo3_fast' ||
      value === 'veo3.1-veo3'
    ) {
      const subModel = value.startsWith('veo4-') ? 'veo3_fast' : value.endsWith('-veo3_fast') ? 'veo3_fast' : 'veo3';
      const displayModel = value.startsWith('veo4-') ? 'veo4' : 'veo3.1';
      onChange({
        ...params,
        model: 'veo3.1',
        veo3SubModel: subModel,
        veoDisplayModel: displayModel,
        quality: undefined,
        wan26Duration: undefined,
        wan26Resolution: undefined,
        wan26MultiShots: undefined,
      });
      return;
    }
    if (value === 'wan2.6') {
      onChange({
        ...params,
        model: 'wan2.6',
        quality: undefined,
        veo3SubModel: undefined,
        veoDisplayModel: undefined,
        seeds: undefined,
        startFrame: undefined,
        endFrame: undefined,
        wan26Duration: params.wan26Duration || '5',
        wan26Resolution: params.wan26Resolution || '1080p',
        wan26MultiShots: params.wan26MultiShots !== undefined ? params.wan26MultiShots : false,
      });
      return;
    }
    onChange({
      ...params,
      model: 'veo3.1',
      quality: undefined,
      veo3SubModel: undefined,
      veoDisplayModel: 'veo4',
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
          <Label className={fieldLabelClass}>{t('reframeMode.model')}</Label>
          {!isMounted ? (
            <div className={selectTriggerClass}>
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-transparent">
                {getTriggerIcon()}
              </div>
              <span className="font-semibold text-foreground">{getModelLabel()}</span>
            </div>
          ) : (
          <Select value={selectValue} onValueChange={handleModelChange}>
            <SelectTrigger className={selectTriggerClass}>
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-transparent">
                  {getTriggerIcon()}
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-foreground">{getModelLabel()}</span>
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {/* Veo4 Fast */}
              <SelectItem value="veo4-veo3_fast" className="py-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                    <img src="/images/google_veo_logo.jpeg" alt="Veo4 model icon" width={32} height={32} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">Veo4 Fast</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Veo4 branding on the frontend, powered by the Veo3.1 fast backend.</p>
                  </div>
                </div>
              </SelectItem>
              {/* Veo3.1 Fast */}
              <SelectItem value="veo3.1-veo3_fast" className="py-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                    <img src="/images/google_veo_logo.jpeg" alt="Veo3.1 model icon" width={32} height={32} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">Veo3.1 Fast</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Faster generation with good quality</p>
                  </div>
                </div>
              </SelectItem>
              {/* Veo3.1 Quality */}
              <SelectItem value="veo3.1-veo3" className="py-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                    <img src="/images/google_veo_logo.jpeg" alt="Veo3.1 model icon" width={32} height={32} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">Veo3.1 Quality</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Higher quality with longer generation time</p>
                  </div>
                </div>
              </SelectItem>
              {/* Wan 2.6 */}
              <SelectItem value="wan2.6" className="py-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                    <img src="/images/qwen-color.webp" alt="Wan2.6 model icon" width={32} height={32} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">Wan 2.6</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">NEW</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Fast and efficient image-to-video generation</p>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          )}
        </div>

        {/* Prompt Section */}
        <div className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 shadow-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className={fieldLabelClass}>{t('reframeMode.prompt')}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Prompt info" className="text-muted-foreground transition-colors hover:text-foreground">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">{t('reframeMode.promptTooltip')}</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className={subtleButtonClass}>
                    <Lightbulb className="w-4 h-4" />
                    {t('reframeMode.aiExamples')}
                  </Button>
                </DialogTrigger>
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
                                <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); handleSelectExample(example.prompt, example.aspectRatio); }}>
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
              </Dialog>
            </div>
          </div>
          <textarea
            placeholder={t('reframeMode.promptPlaceholder')}
            value={params.prompt || ''}
            onChange={(e) => onChange({ ...params, prompt: e.target.value })}
            className={`${textAreaClass} relative z-10`}
          />
        </div>

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
