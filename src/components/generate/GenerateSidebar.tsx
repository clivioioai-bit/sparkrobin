"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, ImageIcon, FileText, Clapperboard, ArrowUpRight, Home, LayoutDashboard, DollarSign, BookOpen, Eraser } from "lucide-react";
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
    href: "/image-to-video",
    icon: ImageIcon,
  },
  {
    nameKey: "textToVideo",
    href: "/text-to-video",
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
        root.style.setProperty('--sidebar-width', isCollapsed ? '60px' : '240px');
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
      {/* Top Section: Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && isMounted && (
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="Sora3 Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-primary">Sora3</span>
          </Link>
        )}
        {isCollapsed && !isMobile && (
          <div className="w-8 h-8 rounded-lg overflow-hidden mx-auto">
            <Image
              src="/favicon.png"
              alt="aivido Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className={`ml-auto p-2 rounded-lg hover:bg-muted transition-colors ${
              isCollapsed ? "mx-auto" : ""
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 text-foreground" />
            ) : (
              <X className="w-5 h-5 text-foreground" />
            )}
          </button>
        )}
        {isMobile && onOpenChange && (
          <button
            onClick={() => onOpenChange(false)}
            className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>
      {/* Navigation Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {/* Home Link */}
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isMounted && currentPath === "/"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={isCollapsed ? t('home') : undefined}
          >
            <Home
              className={`flex-shrink-0 ${
                isCollapsed ? "w-5 h-5 mx-auto" : "w-5 h-5"
              }`}
            />
            {!isCollapsed && isMounted && (
              <span className="text-sm font-medium">{t('home')}</span>
            )}
          </Link>

          {/* Separator */}
          <div className="my-2 border-t border-border" />

          {/* Other Navigation Items */}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isMounted && currentPath === item.href;
            const href = item.href;

            return (
              <Link
                key={`nav-${index}-${href}`}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={isCollapsed ? t(item.nameKey) : undefined}
              >
                <Icon
                  className={`flex-shrink-0 ${
                    isCollapsed ? "w-5 h-5 mx-auto" : "w-5 h-5"
                  }`}
                />
                {!isCollapsed && isMounted && (
                  <span className="text-sm font-medium">{t(item.nameKey)}</span>
                )}
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-2 border-t border-border" />

          {/* Additional Navigation Items */}
          {[
            {
              nameKey: "dashboard",
              href: "/dashboard",
              icon: LayoutDashboard,
            },
            {
              nameKey: "pricing",
              href: "/plans",
              icon: DollarSign,
            },
            {
              nameKey: "blog",
              href: "/blog",
              icon: BookOpen,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = isMounted && currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={isCollapsed ? t(item.nameKey) : undefined}
              >
                <Icon
                  className={`flex-shrink-0 ${
                    isCollapsed ? "w-5 h-5 mx-auto" : "w-5 h-5"
                  }`}
                />
                {!isCollapsed && isMounted && (
                  <span className="text-sm font-medium">{t(item.nameKey)}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section: AI Tools Label and Upgrade Button */}
      <div className="border-t border-border p-4 space-y-3">
        {!isCollapsed && isMounted && (
          <p className="text-xs text-muted-foreground font-medium mb-2">{t('aiTools')}</p>
        )}
        <Link href="/plans" className="block">
          <Button
            variant="default"
            className={`w-full ${isCollapsed ? 'px-2 py-2' : 'py-2.5'} bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
            title={isCollapsed ? t('upgradeNow') : undefined}
          >
            {isCollapsed || !isMounted ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <>
                <span className="text-sm font-semibold">{t('upgradeNow')}</span>
                <ArrowUpRight className="w-4 h-4 ml-2" />
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
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 [&>button]:hidden">
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
      className={`fixed left-0 top-0 h-screen bg-background border-r border-border transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? "w-[60px]" : "w-[240px]"
      }`}
    >
      <SidebarContent />
    </aside>
  );
};

export default GenerateSidebar;
