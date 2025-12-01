"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import RouteLoadingIndicator from "./RouteLoadingIndicator";

export default function TooltipProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <RouteLoadingIndicator />
      {children}
    </TooltipProvider>
  );
}

