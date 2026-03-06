"use client";

import React, { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, ImageIcon, FileText, Clapperboard, LayoutDashboard, DollarSign, Eraser, Zap, Palette, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from 'next-intl';

interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    nameKey: "imageToVideo",
    href: "/sora3-image-to-video",
    icon: ImageIcon,
  },
  {
    nameKey: "textToVideo",
    href: "/sora3-text-to-video",
    icon: FileText,
  },
  {
    nameKey: "storyboard",
    href: "/sora-3-storyboard",
    icon: Clapperboard,
  },
  {
    nameKey: "watermarkRemover",
    href: "/watermark-remover",
    icon: Eraser,
  },
  {
    nameKey: "textToImage",
    href: "/text-to-image",
    icon: Palette,
  },
  {
    nameKey: "imageEditor",
    href: "/image-editor",
    icon: Wand2,
  },
];

interface GenerateSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const GenerateSidebar = ({ open, onOpenChange }: GenerateSidebarProps) => {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false); // Default to expanded (show text)
  const [isMounted, setIsMounted] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  // Ensure client-side only for localStorage access
  useEffect(() => {
    setIsMounted(true);
    // On mobile, always show expanded (with text labels)
    // On desktop, load saved state from localStorage
    if (!isMobile) {
      try {
        const savedState = localStorage.getItem("sidebar-collapsed");
        // Only use saved state if it exists, otherwise default to expanded
        if (savedState !== null) {
          const parsed = JSON.parse(savedState);
          setIsCollapsed(parsed);
        }
        // If no saved state, keep default false (expanded)
      } catch (error) {
        console.warn("Failed to load sidebar state from localStorage:", error);
        // Keep default false (expanded) on error
      }
    } else {
      // Mobile: always expanded to show text labels
      setIsCollapsed(false);
    }
  }, [isMobile]);

  // Sync pathname after mount to avoid hydration mismatch
  useEffect(() => {
    if (isMounted) {
      setCurrentPath(pathname);
    }
  }, [pathname, isMounted]);

  // Save collapsed state to localStorage (only on client and desktop)
  useEffect(() => {
    if (isMounted && !isMobile) {
      try {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
      } catch (error) {
        console.warn("Failed to save sidebar state to localStorage:", error);
      }
    }
  }, [isCollapsed, isMounted, isMobile]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Update CSS variable for main content margin (only on client and desktop)
  useEffect(() => {
    if (isMounted && typeof document !== 'undefined' && !isMobile) {
      try {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-width', isCollapsed ? '60px' : '220px');
      } catch (error) {
        console.warn("Failed to set sidebar width CSS variable:", error);
      }
    } else if (isMobile) {
      // Mobile: no sidebar width
      try {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-width', '0px');
      } catch (error) {
        console.warn("Failed to set sidebar width CSS variable:", error);
      }
    }
  }, [isCollapsed, isMounted, isMobile]);

  // Sidebar content component (reusable for both mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Navigation Items */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="space-y-0.5 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isMounted && currentPath === item.href;
            const href = item.href;

            return (
              <Link
                key={`nav-${index}-${href}`}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title={isCollapsed ? t(item.nameKey) : undefined}
              >
                <Icon className={`flex-shrink-0 w-[18px] h-[18px] ${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && isMounted && (
                  <span className="text-[13px] font-medium">{t(item.nameKey)}</span>
                )}
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-2 mx-1 border-t border-border/50" />

          {/* Additional Navigation Items */}
          {[
            { nameKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = isMounted && currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title={isCollapsed ? t(item.nameKey) : undefined}
              >
                <Icon className={`flex-shrink-0 w-[18px] h-[18px] ${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && isMounted && (
                  <span className="text-[13px] font-medium">{t(item.nameKey)}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: Pricing Button */}
      <div className="p-3">
        <Link href="/pricing" className="block">
          <Button
            variant="default"
            className={`w-full ${isCollapsed ? 'px-2' : ''} h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200`}
            title={isCollapsed ? t('pricing') : undefined}
          >
            {isCollapsed || !isMounted ? (
              <DollarSign className="w-4 h-4" />
            ) : (
              <>
                <Zap className="w-4 h-4 mr-1.5" />
                <span className="text-sm">{t('pricing')}</span>
              </>
            )}
          </Button>
        </Link>
      </div>
    </>
  );

  // Mobile: Render as Sheet drawer
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="top-14 h-[calc(100vh-3.5rem)] w-[280px] sm:w-[320px] p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <aside
      className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white/[0.03] backdrop-blur-xl border-r border-white/[0.08] transition-all duration-300 z-40 flex flex-col ${
        isCollapsed ? "w-[60px]" : "w-[220px]"
      }`}
    >
      <SidebarContent />
    </aside>
  );
};

export default GenerateSidebar;
