import { cn } from '@/lib/utils';

export const workspaceSectionClass = 'space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]';
export const fieldLabelClass = 'text-sm font-semibold tracking-tight text-foreground';
export const helperTextClass = 'text-xs text-muted-foreground';
export const textAreaClass =
  'w-full min-h-[120px] resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-sm shadow-sm transition-colors focus:border-primary focus:ring-primary';
export const textInputClass =
  'h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-sm shadow-sm transition-colors focus:border-primary focus:ring-primary';
export const selectTriggerClass =
  'w-full h-auto min-h-[50px] rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 py-3 shadow-sm transition-colors hover:border-primary/50';
export const dropzoneClass =
  'rounded-xl border-2 border-dashed border-white/[0.1] bg-white/[0.03] backdrop-blur-sm p-4 text-center transition-colors hover:border-primary/50';
export const subtleButtonClass =
  'rounded-lg border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-foreground hover:bg-white/[0.08]';
export const primaryActionButtonClass =
  'h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-60';

export const segmentedButtonClass = (active: boolean) =>
  cn(
    'flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors',
    active
      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
      : 'border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-foreground hover:bg-white/[0.08]'
  );
