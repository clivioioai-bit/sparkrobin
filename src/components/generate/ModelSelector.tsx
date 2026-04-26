"use client";

import React from 'react';
import { ChevronUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  GenerationModelId,
  GenerationWorkflow,
  getGenerationModel,
  getGenerationModelsForWorkflow,
} from '@/config/generation-models';
import { fieldLabelClass, selectTriggerClass } from '@/components/generate/styles';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  workflow: GenerationWorkflow;
  value: GenerationModelId;
  onValueChange: (value: GenerationModelId) => void;
  label?: string;
  mounted?: boolean;
  className?: string;
  triggerClassName?: string;
}

const ModelIcon = ({ src, label, size = 32 }: { src: string; label: string; size?: number }) => (
  <img
    src={src}
    alt={`${label} model icon`}
    width={size}
    height={size}
    className="h-full w-full object-contain"
  />
);

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  workflow,
  value,
  onValueChange,
  label = 'Model',
  mounted = true,
  className,
  triggerClassName,
}) => {
  const selectedModel = getGenerationModel(value);
  const models = getGenerationModelsForWorkflow(workflow);

  const triggerContent = (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-transparent">
        <ModelIcon src={selectedModel.iconSrc} label={selectedModel.label} />
      </div>
      <div className="flex-1 text-left">
        <span className="font-semibold text-foreground">{selectedModel.label}</span>
      </div>
      {mounted && <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </div>
  );

  return (
    <div className={cn('space-y-3', className)}>
      <Label className={fieldLabelClass}>{label}</Label>
      {!mounted ? (
        <div className={cn(selectTriggerClass, triggerClassName)}>{triggerContent}</div>
      ) : (
        <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as GenerationModelId)}>
          <SelectTrigger className={cn(selectTriggerClass, triggerClassName)}>
            {triggerContent}
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model.id} value={model.id} className="py-3">
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden bg-transparent">
                    <ModelIcon src={model.iconSrc} label={model.label} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{model.label}</span>
                      {model.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ModelSelector;
