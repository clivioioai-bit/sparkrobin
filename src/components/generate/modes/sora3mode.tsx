import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sora3Params } from '@/types/generation-modes';
import { Wand2, Video, LayoutPanelTop, Sparkles, Clock, Maximize2, Settings2, Lightbulb, Play, Info, Check, ChevronUp, Square } from 'lucide-react';
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

  const currentModel = params.model === 'wan2.6' ? 'wan2.6' : 'veo3.1';
  const isVeo31 = currentModel === 'veo3.1';
  const isWan26 = currentModel === 'wan2.6';
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

  // Get the icon for the selected model trigger
  const getTriggerIcon = () => {
    if (isVeo31) {
      return <img src="/images/google_veo_logo.jpeg" alt="Veo3.1" width={32} height={32} className="w-full h-full object-contain" />;
    }
    if (isWan26) {
      return <img src="/images/qwen-color.webp" alt="Wan2.6" width={32} height={32} className="w-full h-full object-contain" />;
    }
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
        veoDisplayModel: undefined,
        seeds: undefined,
        storyboardParams: undefined,
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
      storyboardParams: undefined,
      veo3SubModel: 'veo3_fast',
      veoDisplayModel: 'veo4',
      seeds: undefined,
      wan26Duration: undefined,
      wan26Resolution: undefined,
      wan26MultiShots: undefined,
    });
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
      {/* Model Selection */}
      <div className={workspaceSectionClass}>
        <Label className={fieldLabelClass}>{t('reframeMode.model')}</Label>
        {!isMounted ? (
          /* SSR placeholder — avoids Radix Select hydration mismatch */
          <div className="w-full h-auto min-h-[50px] px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm shadow-sm flex items-center gap-3">
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Fast and efficient text-to-video and image-to-video generation</p>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        )}
      </div>

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
                        <Sparkles className="w-5 h-5 text-primary" />
                        {t('reframeMode.promptExamplesTitle')}
                      </DialogTitle>
                      <DialogDescription>
                        {t('reframeMode.promptExamplesDescription')}
                      </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue={promptCategories[0]} className="w-full">
                      <TabsList className="!flex flex-wrap gap-2 justify-start !h-auto p-2 bg-white/[0.04] backdrop-blur-sm">
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
              </div>
            </div>
            <div className="relative">
              <Textarea
                placeholder={t('reframeMode.promptPlaceholder')}
                value={params.prompt || ''}
                onChange={(e) => onChange({ ...params, prompt: e.target.value })}
                className={`${textAreaClass} relative z-10`}
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

          {/* Duration (n_frames) — Only for legacy models */}
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
    </div>
    </TooltipProvider>
  );
};
