"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from "@/components/ui/button";
import { Menu, X, Play, DollarSign, User, LogOut, Home, ChevronDown, Settings, Clapperboard, Image as ImageIcon, FileText, Eraser } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import AuthModal from "./AuthModal";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  const navItems = [
    { name: t('home'), href: '/', icon: Home },
    { name: t('generate'), href: '/text-to-video', icon: Play },
    { name: t('pricing'), href: '/plans', icon: DollarSign },
  ];

  // Get user display name and initials
  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Navigation */}
      <nav 
        className="fixed top-0 w-full z-50 bg-white/85 dark:bg-black/75 backdrop-blur-md border-b border-border/50 shadow-sm transition-all duration-300"
        style={{ top: 0 }}
        suppressHydrationWarning
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
              Sora3
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-1 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 hover:bg-muted/50"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">{navItems[0].name}</span>
            </Link>

            {/* Generate dropdown */}
            <div suppressHydrationWarning>
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className="flex items-center space-x-1 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 hover:bg-muted/50"
                >
                  <Play className="w-4 h-4" />
                  <span className="font-medium">{navItems[1].name}</span>
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-80 p-2 rounded-xl bg-popover border border-border shadow-xl" suppressHydrationWarning>
                <DropdownMenuItem asChild>
                  <Link href="/text-to-video" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors" suppressHydrationWarning>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t('textToVideo')}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">{t('textToVideoDescription')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/image-to-video" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors" suppressHydrationWarning>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t('imageToVideo')}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">{t('imageToVideoDescription')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sora-3-storyboard" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors" suppressHydrationWarning>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <Clapperboard className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t('storyboard')}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">{t('storyboardDescription')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watermark-remover" className="group flex gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors" suppressHydrationWarning>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent-foreground/10">
                      <Eraser className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t('watermarkRemover')}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">{t('watermarkRemoverDescription')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link
              href="/plans"
              className="flex items-center space-x-1 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 hover:bg-muted/50"
            >
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">{t('pricing')}</span>
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <LanguageSwitcher />
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div suppressHydrationWarning>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 hover:bg-muted/50 transition-colors rounded-full px-2 py-1"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    {/* User Name */}
                    <span className="text-sm font-semibold text-foreground hidden sm:block">
                      {getUserDisplayName()}
                    </span>
                    {/* Dropdown Arrow */}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-2 p-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <User className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t('account')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <Settings className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t('signOut')}
                  </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover-lift"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Save current path for redirect after login
                    if (typeof window !== 'undefined') {
                      const currentPath = window.location.pathname;
                      sessionStorage.setItem('redirectAfterLogin', currentPath);
                    }
                    setIsAuthModalOpen(true);
                  }}
                >
                  <User className="w-4 h-4 mr-1" />
                  {tCommon('signIn')}
                </Button>
                <Button
                  variant="cyber"
                  size="sm"
                  className=""
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push('/text-to-video');
                    } else {
                      // Save current path for redirect after login
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('redirectAfterLogin', '/text-to-video');
                      }
                      setIsAuthModalOpen(true);
                    }
                  }}
                >
                  {tCommon('getStarted')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center space-x-2 rtl:space-x-reverse">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-black/5 dark:border-white/10">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-300 px-2 py-1">
                <Home className="w-4 h-4" />
                <span>{t('home')}</span>
              </Link>
              <div className="px-2 pt-2">
                <div className="text-xs text-slate-600 dark:text-slate-400 pb-1">{t('generate')}</div>
                <div className="flex flex-col">
                  <Link href="/text-to-video" className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{t('textToVideo')}</Link>
                  <Link href="/image-to-video" className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{t('imageToVideo')}</Link>
                  <Link href="/sora-3-storyboard" className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{t('storyboard')}</Link>
                  <Link href="/watermark-remover" className="px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{t('watermarkRemover')}</Link>
                </div>
              </div>
              <Link href="/plans" className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-300 px-2 py-1">
                <DollarSign className="w-4 h-4" />
                <span>{t('pricing')}</span>
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-black/5 dark:border-white/10">
                {/* Mobile Theme Toggle */}
                <div className="flex justify-center pb-2">
                  <ThemeToggle />
                </div>
                
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/dashboard')}
                    >
                      <User className="w-4 h-4 mr-1" />
                      {tCommon('dashboard')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      {t('signOut')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Save current path for redirect after login
                        if (typeof window !== 'undefined') {
                          const currentPath = window.location.pathname;
                          sessionStorage.setItem('redirectAfterLogin', currentPath);
                        }
                        setIsAuthModalOpen(true);
                      }}
                    >
                      <User className="w-4 h-4 mr-1" />
                      {tCommon('signIn')}
                    </Button>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => {
                        if (isAuthenticated) {
                          router.push('/text-to-video');
                        } else {
                          // Save current path for redirect after login
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('redirectAfterLogin', '/text-to-video');
                          }
                          setIsAuthModalOpen(true);
                        }
                      }}
                    >
                      {tCommon('getStarted')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </nav>
    </>
  );
};

export default Navigation;
