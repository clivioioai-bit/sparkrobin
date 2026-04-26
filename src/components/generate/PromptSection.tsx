import React from 'react';
import { Lightbulb, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  fieldLabelClass,
  subtleButtonClass,
  textAreaClass,
  workspaceSectionClass,
} from '@/components/generate/styles';

interface PromptSectionProps {
  label: string;
  tooltip: string;
  examplesLabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  examplesOpen: boolean;
  onExamplesOpenChange: (open: boolean) => void;
  examplesDialog: React.ReactNode;
  showExamples?: boolean;
}

export default function PromptSection({
  label,
  tooltip,
  examplesLabel,
  placeholder,
  value,
  onChange,
  examplesOpen,
  onExamplesOpenChange,
  examplesDialog,
  showExamples = true,
}: PromptSectionProps) {
  return (
    <div className={workspaceSectionClass}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Label className={fieldLabelClass}>{label}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${label} info`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">{tooltip}</TooltipContent>
          </Tooltip>
        </div>

        {showExamples && (
          <Dialog open={examplesOpen} onOpenChange={onExamplesOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className={`shrink-0 px-3 ${subtleButtonClass}`}>
                <Lightbulb className="h-4 w-4" />
                <span>{examplesLabel}</span>
              </Button>
            </DialogTrigger>
            {examplesDialog}
          </Dialog>
        )}
      </div>

      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${textAreaClass} min-h-[144px]`}
      />
    </div>
  );
}
