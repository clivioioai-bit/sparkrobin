import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sora3Params } from '@/types/generation-modes';
import { Wand2, Video, LayoutPanelTop, Sparkles, Clock, Maximize2, Settings2, Play, Info, Check, Square } from 'lucide-react';
import { promptExamples, promptCategories, getExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import ModelSelector from '@/components/generate/ModelSelector';
import PromptSection from '@/components/generate/PromptSection';
import { GenerationModelId, getVideoGenerationCreditCost, getVideoModelId, getVideoModelPatch } from '@/config/generation-models';
import {
  fieldLabelClass,
  primaryActionButtonClass,
  segmentedButtonClass,
  subtleButtonClass,
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

  const selectedModelId = getVideoModelId(params);
  const isVeo31 = true;
  const isWan26 = false;

  const creditCost = getVideoGenerationCreditCost(params);

  const handleModelChange = (value: GenerationModelId) => {
    onChange({
      ...params,
      ...getVideoModelPatch(value),
      quality: undefined,
      storyboardParams: undefined,
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
        <ModelSelector
          workflow="text-to-video"
          value={selectedModelId}
          onValueChange={handleModelChange}
          label={t('reframeMode.model')}
          mounted={isMounted}
        />
      </div>

      <>
          <PromptSection
            label={t('reframeMode.prompt')}
            tooltip="The text prompt describing the desired video motion"
            examplesLabel={t('reframeMode.aiExamples')}
            placeholder={t('reframeMode.promptPlaceholder')}
            value={params.prompt || ''}
            onChange={(prompt) => onChange({ ...params, prompt })}
            examplesOpen={isExamplesOpen}
            onExamplesOpenChange={setIsExamplesOpen}
            showExamples={isMounted}
            examplesDialog={
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
            }
          />

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
