import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sora3Params } from '@/types/generation-modes';
import { StoryboardParams } from '@/types/storyboard';
import { StoryboardManager } from '@/components/storyboard/StoryboardManager';
import { Wand2, Video, LayoutPanelTop, Sparkles, Clock, Maximize2, Settings2, Lightbulb, Play, Info, Check, ChevronUp, Film, Square } from 'lucide-react';
import { promptExamples, promptCategories, getExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import {
  fieldLabelClass,
  primaryActionButtonClass,
  segmentedButtonClass,
  selectTriggerClass,
  subtleButtonClass,
  textAreaClass,
  textInputClass,
  workspaceSectionClass,
} from '@/components/generate/styles';

interface Sora3ModeProps {
  params: Sora3Params;
  onChange: (params: Sora3Params) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const DEFAULT_STORYBOARD_PARAMS: StoryboardParams = {
  shots: [
    { prompt: '', duration: 5 },
    { prompt: '', duration: 5 },
    { prompt: '', duration: 5 },
  ],
  n_frames: '25',
  aspect_ratio: 'landscape',
};

export const Sora3Mode: React.FC<Sora3ModeProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating
}) => {
  const t = useTranslations('generate');
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const handleSelectExample = (prompt: string, aspectRatio?: '9:16' | '16:9') => {
    onChange({
      ...params,
      prompt,
      ...(aspectRatio && { aspectRatio })
    });
    setIsExamplesOpen(false);
  };

  const currentModel = params.model || 'sora3';
  const isProModel = currentModel === 'sora3-pro' || currentModel === 'sora2-pro';
  const isStoryboard = currentModel === 'storyboard';
  const isVeo31 = currentModel === 'veo3.1';
  const isWan26 = currentModel === 'wan2.6';

  // Calculate credits based on model, quality, and n_frames
  const calculateCredits = (): number => {
    if (isStoryboard) {
      const n = params.storyboardParams?.n_frames || '25';
      return n === '10' ? 125 : 225;
    }
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
    if (currentModel === 'sora2-pro') {
      const quality = params.quality || 'standard';
      if (quality === 'high') {
        return params.n_frames === '15' ? 325 : 175;
      }
      return params.n_frames === '15' ? 135 : 75;
    }
    if (currentModel === 'sora3-pro') {
      const quality = params.quality || 'standard';
      if (quality === 'high') {
        return params.n_frames === '15' ? 325 : 175;
      }
      return params.n_frames === '15' ? 135 : 75;
    }
    if (currentModel === 'sora2') {
      return params.n_frames === '15' ? 25 : 20;
    }
    return params.n_frames === '15' ? 20 : 15;
  };

  const creditCost = calculateCredits();

  // Get display label for the selected model in the trigger
  const getModelLabel = (): string => {
    if (isVeo31) {
      return params.veo3SubModel === 'veo3_fast' ? t('veo3Mode.fast') : t('veo3Mode.quality');
    }
    if (isWan26) return 'Wan 2.6';
    switch (currentModel) {
      case 'sora3-pro': return t('reframeMode.sora3Pro');
      case 'sora2': return t('reframeMode.sora2');
      case 'sora2-pro': return t('reframeMode.sora2Pro');
      case 'storyboard': return t('reframeMode.storyboard');
      default: return t('reframeMode.sora3');
    }
  };

  // Get the icon for the selected model trigger
  const getTriggerIcon = () => {
    if (isStoryboard) {
      return <Film className="w-6 h-6 text-primary" />;
    }
    if (isVeo31) {
      return <img src="/images/google_veo_logo.jpeg" alt="Veo3.1" width={32} height={32} className="w-full h-full object-contain" />;
    }
    if (isWan26) {
      return <img src="/images/qwen-color.webp" alt="Wan2.6" width={32} height={32} className="w-full h-full object-contain" />;
    }
    return <img src="/sora favicon.png" alt="Model icon" width={32} height={32} className="w-full h-full object-contain" />;
  };

  // Compute the Select value — Veo3.1 uses compound values
  const selectValue = isVeo31 ? `veo3.1-${params.veo3SubModel || 'veo3_fast'}` : currentModel;

  const handleModelChange = (value: string) => {
    // Veo3.1 compound values
    if (value === 'veo3.1-veo3_fast' || value === 'veo3.1-veo3') {
      const subModel = value === 'veo3.1-veo3_fast' ? 'veo3_fast' : 'veo3';
      onChange({
        ...params,
        model: 'veo3.1',
        veo3SubModel: subModel,
        quality: undefined,
        storyboardParams: undefined,
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
        seeds: undefined,
        storyboardParams: undefined,
        wan26Duration: params.wan26Duration || '5',
        wan26Resolution: params.wan26Resolution || '1080p',
        wan26MultiShots: params.wan26MultiShots !== undefined ? params.wan26MultiShots : false,
      });
      return;
    }

    const model = value as Sora3Params['model'];
    if (model === 'sora2') {
      onChange({
        ...params,
        model,
        quality: undefined,
        storyboardParams: undefined,
        veo3SubModel: undefined,
        seeds: undefined,
        wan26Duration: undefined,
        wan26Resolution: undefined,
        wan26MultiShots: undefined,
      });
    } else if (model === 'sora2-pro') {
      onChange({
        ...params,
        model,
        quality: params.quality || 'standard',
        storyboardParams: undefined,
        veo3SubModel: undefined,
        seeds: undefined,
        wan26Duration: undefined,
        wan26Resolution: undefined,
        wan26MultiShots: undefined,
      });
    } else if (model === 'storyboard') {
      onChange({
        ...params,
        model,
        quality: undefined,
        storyboardParams: params.storyboardParams || DEFAULT_STORYBOARD_PARAMS,
        veo3SubModel: undefined,
        seeds: undefined,
        wan26Duration: undefined,
        wan26Resolution: undefined,
        wan26MultiShots: undefined,
      });
    } else if (model === 'sora3-pro') {
      onChange({
        ...params,
        model,
        quality: params.quality || 'standard',
        storyboardParams: undefined,
        veo3SubModel: undefined,
        seeds: undefined,
        wan26Duration: undefined,
        wan26Resolution: undefined,
        wan26MultiShots: undefined,
      });
    } else {
      // sora3 or other
      onChange({
        ...params,
        model,
        quality: undefined,
        storyboardParams: undefined,
        veo3SubModel: undefined,
        seeds: undefined,
        wan26Duration: undefined,
        wan26Resolution: undefined,
        wan26MultiShots: undefined,
      });
    }
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
      {/* Model Selection */}
      <div className={workspaceSectionClass}>
        <Label className={fieldLabelClass}>{t('reframeMode.model')}</Label>
        {!isMounted ? (
          /* SSR placeholder — avoids Radix Select hydration mismatch */
          <div className="w-full h-auto min-h-[50px] px-4 py-3 rounded-xl border border-border bg-background/80 shadow-sm flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-transparent">
              {getTriggerIcon()}
            </div>
            <span className="font-semibold text-foreground">{getModelLabel()}</span>
          </div>
        ) : (
        <Select
          value={selectValue}
          onValueChange={handleModelChange}
        >
          <SelectTrigger className={selectTriggerClass}>
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-transparent">
                {getTriggerIcon()}
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-foreground">
                  {getModelLabel()}
                </span>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {/* Sora3 */}
            <SelectItem value="sora3" className="py-3">
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                  <img src="/sora favicon.png" alt="Model icon" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{t('reframeMode.sora3')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('reframeMode.sora3Description')}</p>
                </div>
              </div>
            </SelectItem>
            {/* Sora3 Pro */}
            <SelectItem value="sora3-pro" className="py-3">
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                  <img src="/sora favicon.png" alt="Model icon" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{t('reframeMode.sora3Pro')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('reframeMode.sora3ProDescription')}</p>
                </div>
              </div>
            </SelectItem>
            {/* Sora2 */}
            <SelectItem value="sora2" className="py-3">
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                  <img src="/sora favicon.png" alt="Model icon" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{t('reframeMode.sora2')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('reframeMode.sora2Description')}</p>
                </div>
              </div>
            </SelectItem>
            {/* Sora2 Pro */}
            <SelectItem value="sora2-pro" className="py-3">
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                  <img src="/sora favicon.png" alt="Model icon" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{t('reframeMode.sora2Pro')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('reframeMode.sora2ProDescription')}</p>
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
                    <span className="font-semibold text-foreground">{t('veo3Mode.fast')}</span>
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
                    <span className="font-semibold text-foreground">{t('veo3Mode.quality')}</span>
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Fast and efficient text-to-video and image-to-video generation</p>
                </div>
              </div>
            </SelectItem>
            {/* Storyboard */}
            <SelectItem value="storyboard" className="py-3">
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                  <Film className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{t('reframeMode.storyboard')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('reframeMode.storyboardDescription')}</p>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        )}
      </div>

      {/* Storyboard Mode — show StoryboardManager instead of standard controls */}
      {isStoryboard ? (
        <StoryboardManager
          params={params.storyboardParams || DEFAULT_STORYBOARD_PARAMS}
          onParamsChange={(newStoryboardParams) =>
            onChange({ ...params, storyboardParams: newStoryboardParams })
          }
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          creditCost={creditCost}
        />
      ) : (
        <>
          {/* Prompt */}
          <div className={workspaceSectionClass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>{t('reframeMode.prompt')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Prompt info"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    The text prompt describing the desired video motion
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                {isMounted && (
                <Dialog open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={subtleButtonClass}
                    >
                      <Lightbulb className="w-4 h-4" />
                      {t('reframeMode.aiExamples')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        {t('reframeMode.promptExamplesTitle')}
                      </DialogTitle>
                      <DialogDescription>
                        {t('reframeMode.promptExamplesDescription')}
                      </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue={promptCategories[0]} className="w-full">
                      <TabsList className="!flex flex-wrap gap-2 justify-start !h-auto p-2 bg-muted/70">
                        {promptCategories.map(category => (
                          <TabsTrigger
                            key={category}
                            value={category}
                            className="text-xs px-3 py-2 !whitespace-normal leading-snug text-center rounded-md min-h-[2.75rem] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                          >
                            {category}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {promptCategories.map(category => (
                        <TabsContent key={category} value={category} className="mt-4">
                          <div className="grid gap-3">
                            {getExamplesByCategory(category).map(example => (
                              <Card
                                key={example.id}
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary"
                                onClick={() => handleSelectExample(example.prompt, example.aspectRatio)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                                      {example.title}
                                      {example.aspectRatio && (
                                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                          {example.aspectRatio}
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                      {example.prompt}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0 text-primary hover:text-primary/90 hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectExample(example.prompt, example.aspectRatio);
                                    }}
                                  >
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
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={subtleButtonClass}
                      aria-label="Open Prompt GPT"
                      onClick={() =>
                        window.open(
                          "https://chatgpt.com/g/g-690c3e49fb308191aa623c67543a766a-sarogpt-ai-video-prompt-script-assistant",
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('reframeMode.promptGpt')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    {t('reframeMode.promptGptTooltip')}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="relative">
              <Textarea
                placeholder={t('reframeMode.promptPlaceholder')}
                value={params.prompt || ''}
                onChange={(e) => onChange({ ...params, prompt: e.target.value })}
                className={`${textAreaClass} relative z-10 bg-transparent`}
              />
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className={workspaceSectionClass}>
            <div className="flex items-center gap-2">
              <Label className={fieldLabelClass}>
                {isVeo31 ? 'Ratio' : t('reframeMode.aspectRatio')}
                {isVeo31 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Ratio info"
                        className="text-muted-foreground transition-colors hover:text-foreground ml-1"
                      >
                        <Info className="h-3 w-3 inline" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      Video aspect ratio
                    </TooltipContent>
                  </Tooltip>
                )}
              </Label>
              {!isVeo31 && !isWan26 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Aspect Ratio info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  This parameter defines the aspect ratio of the image.
                </TooltipContent>
              </Tooltip>
              )}
            </div>
            <div className="flex space-x-2">
              {isVeo31 && (
                <Button
                  variant={params.aspectRatio === 'Auto' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, aspectRatio: 'Auto' })}
                  className={segmentedButtonClass(params.aspectRatio === 'Auto')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto
                </Button>
              )}
              <Button
                variant={params.aspectRatio === '9:16' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, aspectRatio: '9:16' })}
                className={segmentedButtonClass(params.aspectRatio === '9:16')}
              >
                {isVeo31 ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    9:16
                  </>
                ) : (
                  t('reframeMode.portrait')
                )}
              </Button>
              <Button
                variant={params.aspectRatio === '16:9' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, aspectRatio: '16:9' })}
                className={segmentedButtonClass(params.aspectRatio === '16:9')}
              >
                {isVeo31 ? (
                  <>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    16:9
                  </>
                ) : (
                  t('reframeMode.landscape')
                )}
              </Button>
            </div>
          </div>

          {/* Duration (n_frames) — Only for Sora models */}
          {!isVeo31 && !isWan26 && (
          <div className={workspaceSectionClass}>
            <div className="flex items-center gap-2">
              <Label className={fieldLabelClass}>{t('reframeMode.duration')}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Duration info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {t('reframeMode.durationTooltip')}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={params.n_frames === '10' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, n_frames: '10' })}
                className={segmentedButtonClass(params.n_frames === '10')}
              >
                10s
              </Button>
              <Button
                variant={params.n_frames === '15' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, n_frames: '15' })}
                className={segmentedButtonClass(params.n_frames === '15')}
              >
                15s
              </Button>
            </div>
          </div>
          )}

          {/* Seed (Optional) — Only for Veo3.1 */}
          {isVeo31 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>
                  Seed (Optional)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Seed info"
                        className="text-muted-foreground transition-colors hover:text-foreground ml-1"
                      >
                        <Info className="h-3 w-3 inline" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      Random seed parameter to control the randomness of the generated content (10000-99999)
                    </TooltipContent>
                  </Tooltip>
                </Label>
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
                className={`w-full ${textInputClass}`}
              />
            </div>
          )}

          {/* Wan2.6 Duration */}
          {isWan26 && (
            <div className={workspaceSectionClass}>
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>Duration</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Duration info"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    The duration of the generated video in seconds
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={(params.wan26Duration || '5') === '5' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, wan26Duration: '5' })}
                  className={segmentedButtonClass((params.wan26Duration || '5') === '5')}
                >
                  5 seconds
                </Button>
                <Button
                  variant={params.wan26Duration === '10' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, wan26Duration: '10' })}
                  className={segmentedButtonClass(params.wan26Duration === '10')}
                >
                  10 seconds
                </Button>
                <Button
                  variant={params.wan26Duration === '15' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, wan26Duration: '15' })}
                  className={segmentedButtonClass(params.wan26Duration === '15')}
                >
                  15 seconds
                </Button>
              </div>
            </div>
          )}

          {/* Wan2.6 Resolution */}
          {isWan26 && (
            <div className={workspaceSectionClass}>
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>Resolution</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Resolution info"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    Video resolution tier
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={params.wan26Resolution === '720p' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, wan26Resolution: '720p' })}
                  className={segmentedButtonClass(params.wan26Resolution === '720p')}
                >
                  720p
                </Button>
                <Button
                  variant={(params.wan26Resolution || '1080p') === '1080p' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, wan26Resolution: '1080p' })}
                  className={segmentedButtonClass((params.wan26Resolution || '1080p') === '1080p')}
                >
                  1080p
                </Button>
              </div>
            </div>
          )}

          {/* Wan2.6 Multi Shots */}
          {isWan26 && (
            <div className={workspaceSectionClass}>
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>Multi Shots</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Multi shots info"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    The multi shots parameter controls the shot composition style during AI video generation, determining whether the generated video is a single continuous shot or multiple shots with transitions.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={(params.wan26MultiShots === false || params.wan26MultiShots === undefined) ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, wan26MultiShots: false })}
                  className={segmentedButtonClass(params.wan26MultiShots === false || params.wan26MultiShots === undefined)}
                >
                  Single Shot
                </Button>
                <Button
                  variant={params.wan26MultiShots === true ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, wan26MultiShots: true })}
                  className={segmentedButtonClass(params.wan26MultiShots === true)}
                >
                  Multi Shots
                </Button>
              </div>
            </div>
          )}

          {/* Quality Selector (for Sora3 Pro and Sora2 Pro) */}
          {isProModel && (
            <div className={workspaceSectionClass}>
            <div className="flex items-center gap-2">
              <Label className={fieldLabelClass}>{t('reframeMode.quality')}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Quality info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {t('reframeMode.qualityTooltip')}
                </TooltipContent>
              </Tooltip>
            </div>
              <div className="flex space-x-2">
                <Button
                  variant={params.quality === 'standard' || !params.quality ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, quality: 'standard' })}
                  className={segmentedButtonClass(params.quality === 'standard' || !params.quality)}
                >
                  {t('reframeMode.standard')}
                </Button>
                <Button
                  variant={params.quality === 'high' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, quality: 'high' })}
                  className={segmentedButtonClass(params.quality === 'high')}
                >
                  {t('reframeMode.high')}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              className={`flex-1 h-11 ${subtleButtonClass}`}
            >
              {t('reset')}
            </Button>
            <Button
              className={`flex-[2] h-11 ${primaryActionButtonClass}`}
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
        </>
      )}
    </div>
    </TooltipProvider>
  );
};
