import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReframeParams } from '@/types/generation-modes';
import { RotateCcw, Play, Upload as UploadIcon, Lightbulb, Sparkles, CircleHelp, Image as ImageIcon, Info, X, Check, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { imagePromptCategories, getImageExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...params, sourceVideo: file });
    }
  };

  const handleSelectExample = (prompt: string, aspectRatio?: '9:16' | '16:9') => {
    onChange({
      ...params,
      prompt,
      ...(aspectRatio ? { targetAspectRatio: aspectRatio } : {}),
    });
    setIsExamplesOpen(false);
  };

  const currentModel = params.model || 'sora3';
  const isSora3Pro = currentModel === 'sora3-pro';
  
  // Calculate credits based on model, quality, and n_frames
  const calculateCredits = (): number => {
    if (isSora3Pro) {
      const quality = params.quality || 'standard';
      if (quality === 'high') {
        return params.n_frames === '15' ? 325 : 175;
      } else {
        return params.n_frames === '15' ? 135 : 75;
      }
    }
    // Sora3 or Veo 3.1: 10s = 15 credits, 15s = 20 credits
    return params.n_frames === '15' ? 20 : 15;
  };
  
  const creditCost = calculateCredits();

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">{t('reframeMode.model')}</Label>
          <Select
            value={currentModel}
            onValueChange={(value: 'sora3' | 'sora3-pro') => {
              onChange({
                ...params,
                model: value,
                // image-to-video 默认使用 standard quality（根据 API 文档）
                quality: value === 'sora3-pro' ? (params.quality || 'standard') : undefined
              });
            }}
          >
            <SelectTrigger className="w-full h-auto min-h-[50px] px-4 py-3 border-2 border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-transparent">
                  <img 
                    src="/sora favicon.png" 
                    alt="Model icon" 
                    width={32} 
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-foreground">
                    {currentModel === 'sora3-pro' ? t('reframeMode.sora3Pro') : t('reframeMode.sora3')}
                  </span>
                </div>
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sora3" className="py-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                    <img 
                      src="/sora favicon.png" 
                      alt="Model icon" 
                      width={32} 
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{t('reframeMode.sora3')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('reframeMode.sora3Description')}
                    </p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="sora3-pro" className="py-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                    <img 
                      src="/sora favicon.png" 
                      alt="Model icon" 
                      width={32} 
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{t('reframeMode.sora3Pro')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('reframeMode.sora3ProDescription')}
                    </p>
                  </div>
                  {currentModel === 'sora3-pro' && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  )}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prompt Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-foreground">{t('reframeMode.prompt')}</Label>
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
                  {t('reframeMode.promptTooltip')}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
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

                  <Tabs defaultValue={imagePromptCategories[0]} className="w-full">
                    <TabsList className="!flex flex-wrap gap-2 justify-start !h-auto p-2 bg-muted/70">
                      {imagePromptCategories.map(category => (
                    <TabsTrigger
                          key={category}
                          value={category}
                      className="text-xs px-3 py-2 !whitespace-normal leading-snug text-center rounded-md min-h-[2.75rem] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          {getTranslatedCategory(category)}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {imagePromptCategories.map(category => (
                      <TabsContent key={category} value={category} className="mt-4">
                        <div className="grid gap-3">
                          {getImageExamplesByCategory(category).map(example => (
                            <Card
                              key={example.id}
                              className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary"
                              onClick={() => handleSelectExample(example.prompt, example.aspectRatio)}
                            >
                              <div className="space-y-3">
                                <div className="text-sm font-medium text-foreground">
                                  {example.title}
                                </div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                  {example.prompt}
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
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

          <textarea
            placeholder={t('reframeMode.promptPlaceholder')}
            value={params.prompt || ''}
            onChange={(e) => onChange({ ...params, prompt: e.target.value })}
            className="w-full min-h-[80px] rounded-xl border border-input bg-card/50 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-foreground">{t('reframeMode.referenceImage')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Reference Image info"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {t('reframeMode.referenceImageTooltip')}
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary transition-colors">
            {params.sourceVideo ? (
              <div className="space-y-2">
                <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-xl border border-border">
                  <img
                    src={URL.createObjectURL(params.sourceVideo)}
                    alt="Uploaded image"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{params.sourceVideo.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(params.sourceVideo.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ ...params, sourceVideo: undefined as any })}
                  className="border-input text-foreground hover:bg-muted"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> 
                  {t('reframeMode.changeImage')}
                </Button>
              </div>
            ) : (
              <label className="block cursor-pointer space-y-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t('reframeMode.uploadReferenceFile')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('reframeMode.dragDropText')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('reframeMode.fileFormatText')}
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Aspect Ratio */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-foreground">{t('reframeMode.aspectRatio')}</Label>
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
                  {t('reframeMode.aspectRatioTooltip')}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={params.targetAspectRatio === '9:16' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, targetAspectRatio: '9:16' })}
                className={`flex-1 h-9 text-sm font-medium ${
                  params.targetAspectRatio === '9:16' 
                    ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                    : 'border-input text-foreground hover:bg-muted'
                }`}
              >
                {t('reframeMode.portrait')}
              </Button>
              <Button
                variant={params.targetAspectRatio === '16:9' ? 'default' : 'outline'}
                onClick={() => onChange({ ...params, targetAspectRatio: '16:9' })}
                className={`flex-1 h-9 text-sm font-medium ${
                  params.targetAspectRatio === '16:9' 
                    ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                    : 'border-input text-foreground hover:bg-muted'
                }`}
              >
                {t('reframeMode.landscape')}
              </Button>
            </div>
          </div>

          {/* Duration (n_frames) - Show for sora3 and sora3-pro models */}
          {(params.model === 'sora3' || params.model === 'sora3-pro') && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-foreground">{t('reframeMode.duration')}</Label>
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
                  className={`flex-1 h-9 text-sm font-medium ${
                    params.n_frames === '10' 
                      ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                      : 'border-input text-foreground hover:bg-muted'
                  }`}
                >
                  10s
                </Button>
                <Button
                  variant={params.n_frames === '15' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, n_frames: '15' })}
                  className={`flex-1 h-9 text-sm font-medium ${
                    params.n_frames === '15' 
                      ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                      : 'border-input text-foreground hover:bg-muted'
                  }`}
                >
                  15s
                </Button>
              </div>
            </div>
          )}

          {/* Quality Selector (only for Sora3 Pro) */}
          {isSora3Pro && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-foreground">{t('reframeMode.quality')}</Label>
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
                  className={`flex-1 h-9 text-sm font-medium ${
                    params.quality === 'standard' || !params.quality
                      ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                      : 'border-input text-foreground hover:bg-muted'
                  }`}
                >
                  {t('reframeMode.standard')}
                </Button>
                <Button
                  variant={params.quality === 'high' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...params, quality: 'high' })}
                  className={`flex-1 h-9 text-sm font-medium ${
                    params.quality === 'high'
                      ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                      : 'border-input text-foreground hover:bg-muted'
                  }`}
                >
                  {t('reframeMode.high')}
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Generate Button */}
        <Button 
          className="w-full h-10 text-sm font-semibold bg-black hover:bg-black/90 text-white shadow-lg hover:shadow-xl transition-shadow duration-200"
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
