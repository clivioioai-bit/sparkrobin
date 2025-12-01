import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sora3Params } from '@/types/generation-modes';
import { Wand2, Video, LayoutPanelTop, Sparkles, Clock, Maximize2, Settings2, Lightbulb, Play, Info, Check, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { promptExamples, promptCategories, getExamplesByCategory } from '@/data/promptExamples';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

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

  const handleSelectExample = (prompt: string, aspectRatio?: '9:16' | '16:9') => {
    onChange({ 
      ...params, 
      prompt,
      ...(aspectRatio && { aspectRatio })
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
    return params.n_frames === '15' ? 20 : 15;
  };
  
  const creditCost = calculateCredits();

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
      {/* Model Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">{t('reframeMode.model')}</Label>
        <Select
          value={currentModel}
          onValueChange={(value: 'sora3' | 'sora3-pro') => {
            onChange({
              ...params,
              model: value,
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

      {/* Prompt */}
      <div className="space-y-3">
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
                The text prompt describing the desired video motion
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
        <div className="relative">
          <Textarea
            placeholder={t('reframeMode.promptPlaceholder')}
            value={params.prompt || ''}
            onChange={(e) => onChange({ ...params, prompt: e.target.value })}
            className="min-h-[120px] resize-none border-input focus:border-primary focus:ring-primary relative z-10 bg-transparent"
          />
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-3">
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
              This parameter defines the aspect ratio of the image.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={params.aspectRatio === '9:16' ? 'default' : 'outline'}
            onClick={() => onChange({ ...params, aspectRatio: '9:16' })}
            className={`flex-1 h-9 text-sm font-medium ${
              params.aspectRatio === '9:16' 
                ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                : 'border-input text-foreground hover:bg-muted'
            }`}
            >
              {t('reframeMode.portrait')}
            </Button>
            <Button
              variant={params.aspectRatio === '16:9' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, aspectRatio: '16:9' })}
              className={`flex-1 h-9 text-sm font-medium ${
                params.aspectRatio === '16:9' 
                  ? 'bg-gray-700 text-white border-gray-700 hover:bg-gray-600' 
                  : 'border-input text-foreground hover:bg-muted'
              }`}
            >
              {t('reframeMode.landscape')}
            </Button>
        </div>
      </div>

      {/* Duration (n_frames) */}
      <div className="space-y-3">
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

      {/* Quality Selector (only for Sora3 Pro) */}
      {isSora3Pro && (
        <div className="space-y-3">
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

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button 
          variant="outline" 
          className="flex-1 h-11 border-input text-foreground hover:bg-muted font-medium"
        >
          {t('reset')}
        </Button>
        <Button 
          className="flex-[2] h-11 bg-black hover:bg-black/90 text-white font-bold shadow-lg hover:shadow-xl transition-shadow duration-200 hover:scale-[1.02]"
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
    </div>
    </TooltipProvider>
  );
};
