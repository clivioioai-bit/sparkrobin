import { cn } from '@/lib/utils';

export const workspaceSectionClass = 'space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4';
export const fieldLabelClass = 'text-sm font-semibold tracking-tight text-foreground';
export const helperTextClass = 'text-xs text-muted-foreground';
export const textAreaClass =
  'min-h-[120px] resize-none rounded-xl border border-border bg-background/80 text-sm shadow-sm transition-colors focus:border-primary focus:ring-primary';
export const textInputClass =
  'h-10 rounded-xl border border-border bg-background/80 text-sm shadow-sm transition-colors focus:border-primary focus:ring-primary';
export const selectTriggerClass =
  'w-full h-auto min-h-[50px] rounded-xl border border-border bg-background/80 px-4 py-3 shadow-sm transition-colors hover:border-primary/50';
export const dropzoneClass =
  'rounded-xl border-2 border-dashed border-border/70 bg-background/40 p-4 text-center transition-colors hover:border-primary/50';
export const subtleButtonClass =
  'rounded-lg border border-border/70 bg-background/70 text-foreground hover:bg-muted';
export const primaryActionButtonClass =
  'h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60';

export const segmentedButtonClass = (active: boolean) =>
  cn(
    'flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors',
    active
      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
      : 'border-border bg-background/70 text-foreground hover:bg-muted'
  );
