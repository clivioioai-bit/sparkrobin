import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Veo3Params } from '@/types/generation-modes';
import { Play, Info, Upload, X, Sparkles, Wand2, Maximize2, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import {
  fieldLabelClass,
  textAreaClass,
  textInputClass,
  primaryActionButtonClass,
  segmentedButtonClass,
  workspaceSectionClass,
  subtleButtonClass,
} from '@/components/generate/styles';

interface Veo3ModeProps {
  params: Veo3Params;
  onChange: (params: Veo3Params) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onModelChange?: (model: 'sora3' | 'veo3.1') => void;
}

export const Veo3Mode: React.FC<Veo3ModeProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating
}) => {
  const t = useTranslations('generate');
  const [imageUrls, setImageUrls] = useState<string[]>(params.imageUrls || []);

  // Sync imageUrls with params when params change externally
  React.useEffect(() => {
    if (params.imageUrls) {
      setImageUrls(params.imageUrls);
    } else {
      setImageUrls([]);
    }
  }, [params.imageUrls]);

  const handleAddImageUrl = () => {
    const url = prompt(t('veo3Mode.enterImageUrl'));
    if (url && url.trim()) {
      const newUrls = [...imageUrls, url.trim()];
      setImageUrls(newUrls);
      onChange({ ...params, imageUrls: newUrls });
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    onChange({ ...params, imageUrls: newUrls.length > 0 ? newUrls : undefined });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    onChange({ ...params, imageUrls: newUrls });
  };

  // Auto-determine generationType based on imageUrls
  const updateGenerationType = (urls: string[]) => {
    let newGenerationType: Veo3Params['generationType'] = 'TEXT_2_VIDEO';
    if (urls.length === 1) {
      newGenerationType = 'FIRST_AND_LAST_FRAMES_2_VIDEO';
    } else if (urls.length >= 2) {
      newGenerationType = 'FIRST_AND_LAST_FRAMES_2_VIDEO';
    } else if (urls.length >= 1 && urls.length <= 3) {
      // Could be REFERENCE_2_VIDEO if user wants, but default to FIRST_AND_LAST_FRAMES_2_VIDEO
      newGenerationType = 'REFERENCE_2_VIDEO';
    }
    if (newGenerationType !== params.generationType) {
      onChange({ ...params, generationType: newGenerationType });
    }
  };

  React.useEffect(() => {
    if (imageUrls.length > 0) {
      updateGenerationType(imageUrls);
    } else {
      onChange({ ...params, generationType: 'TEXT_2_VIDEO' });
    }
  }, [imageUrls.length]);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-6">
        {/* Prompt */}
        <div className={workspaceSectionClass}>
          <Label className={fieldLabelClass}>
            {t('veo3Mode.generationPrompt')} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder={t('veo3Mode.promptPlaceholder')}
            value={params.prompt}
            onChange={(e) => onChange({ ...params, prompt: e.target.value })}
            className={textAreaClass}
          />
        </div>

        {/* Image URLs - Only show when images are added */}
        {imageUrls.length > 0 && (
          <div className={workspaceSectionClass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className={fieldLabelClass}>{t('veo3Mode.imageUrls')}</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Image URLs info"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs leading-relaxed">
                    {t('veo3Mode.imageUrlsTooltip')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImageUrl}
                className={subtleButtonClass}
              >
                <Upload className="w-4 h-4" />
                {t('veo3Mode.addImageUrl')}
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="space-y-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      placeholder={t('veo3Mode.imageUrlPlaceholder')}
                      className={`flex-1 ${textInputClass}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImageUrl(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {imageUrls.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t('veo3Mode.noImagesAdded')}
              </p>
            )}
          </div>
        )}

        {/* Aspect Ratio */}
        <div className={workspaceSectionClass}>
          <div className="flex items-center gap-2">
            <Label className={fieldLabelClass}>{t('veo3Mode.ratio')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Ratio info"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {t('veo3Mode.ratioTooltip')}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={params.aspectRatio === 'Auto' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, aspectRatio: 'Auto' })}
              className={segmentedButtonClass(params.aspectRatio === 'Auto')}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {t('veo3Mode.auto')}
            </Button>
            <Button
              variant={params.aspectRatio === '16:9' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, aspectRatio: '16:9' })}
              className={segmentedButtonClass(params.aspectRatio === '16:9')}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              16:9
            </Button>
            <Button
              variant={params.aspectRatio === '9:16' ? 'default' : 'outline'}
              onClick={() => onChange({ ...params, aspectRatio: '9:16' })}
              className={segmentedButtonClass(params.aspectRatio === '9:16')}
            >
              <Square className="w-4 h-4 mr-2" />
              9:16
            </Button>
          </div>
        </div>

        {/* Advanced Options */}
        <div className={`${workspaceSectionClass} border-t pt-4`}>
          <Label className={fieldLabelClass}>{t('veo3Mode.advancedOptions')}</Label>
          
          {/* Seeds */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t('veo3Mode.seed')}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Seed info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {t('veo3Mode.seedTooltip')}
                </TooltipContent>
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
              placeholder={t('veo3Mode.seedPlaceholder')}
              min={10000}
              max={99999}
              className={`w-full ${textInputClass}`}
            />
          </div>

          {/* Enable Translation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t('veo3Mode.enableTranslation')}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Enable Translation info"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {t('veo3Mode.enableTranslationTooltip')}
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              type="button"
              variant={params.enableTranslation !== false ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ ...params, enableTranslation: !params.enableTranslation })}
              className={segmentedButtonClass(params.enableTranslation !== false)}
            >
              {params.enableTranslation !== false ? t('veo3Mode.on') : t('veo3Mode.off')}
            </Button>
          </div>

          {/* Watermark */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('veo3Mode.watermark')}</Label>
            <Input
              value={params.watermark || ''}
              onChange={(e) => onChange({ ...params, watermark: e.target.value || undefined })}
              placeholder={t('veo3Mode.watermarkPlaceholder')}
              className={`w-full ${textInputClass}`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            className={`w-full ${primaryActionButtonClass}`}
            onClick={onGenerate}
            disabled={isGenerating || !params.prompt}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                {t('generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="mr-2">60</span>
                {t('generate')}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {t('veo3Mode.audioDisclaimer')}{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Audio info"
                  className="text-muted-foreground underline transition-colors hover:text-foreground"
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {t('veo3Mode.audioDisclaimerTooltip')}
              </TooltipContent>
            </Tooltip>
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};
