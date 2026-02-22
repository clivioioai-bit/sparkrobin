"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from "@/components/ui/button";
import { Menu, X, Play, DollarSign, User, LogOut, Home, ChevronDown, Settings, Clapperboard, Image as ImageIcon, FileText, Eraser, Palette, Wand2, Video, Sparkles } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
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
    { name: t('generate'), href: '/sora3-text-to-video', icon: Play },
    { name: t('pricing'), href: '/pricing', icon: DollarSign },
  ];

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300"
        style={{ top: 0 }}
        suppressHydrationWarning
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-base font-semibold text-white" suppressHydrationWarning>
              SORA 3
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="text-sm text-white/50 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg"
            >
              {navItems[0].name}
            </Link>

            {/* Generate dropdown */}
            <div suppressHydrationWarning>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg"
                >
                  <span>{navItems[1].name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-72 p-1.5 rounded-xl bg-[#0a0f1a] border border-white/[0.08] shadow-2xl" suppressHydrationWarning>
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">{t('features')}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/sora3-text-to-video" className="group flex gap-3 p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors" suppressHydrationWarning>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">{t('textToVideo')}</span>
                        <span className="text-xs text-white/40">{t('textToVideoDescription')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sora3-image-to-video" className="group flex gap-3 p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors" suppressHydrationWarning>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:text-white">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">{t('imageToVideo')}</span>
                        <span className="text-xs text-white/40">{t('imageToVideoDescription')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sora-3-storyboard" className="group flex gap-3 p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors" suppressHydrationWarning>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:text-white">
                        <Clapperboard className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">{t('storyboard')}</span>
                        <span className="text-xs text-white/40">{t('storyboardDescription')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/watermark-remover" className="group flex gap-3 p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors" suppressHydrationWarning>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:text-white">
                        <Eraser className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">{t('watermarkRemover')}</span>
                        <span className="text-xs text-white/40">{t('watermarkRemoverDescription')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">{t('models')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href="/sora-3-video-generator"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 text-white/80 transition-all duration-200"
                      >
                        <Video className="h-3 w-3 text-blue-400" />
                        <span className="whitespace-nowrap">{t('sora3')}</span>
                      </Link>
                      <Link
                        href="/sora-3-video-generator"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 text-white/80 transition-all duration-200"
                      >
                        <Sparkles className="h-3 w-3 text-blue-400" />
                        <span className="whitespace-nowrap">{t('sora3Pro')}</span>
                      </Link>
                      <Link
                        href="/sora-3-video-generator"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 text-white/80 transition-all duration-200"
                      >
                        <Video className="h-3 w-3 text-blue-400" />
                        <span className="whitespace-nowrap">{t('sora2')}</span>
                      </Link>
                      <Link
                        href="/sora-3-video-generator"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 text-white/80 transition-all duration-200"
                      >
                        <Sparkles className="h-3 w-3 text-blue-400" />
                        <span className="whitespace-nowrap">{t('sora2Pro')}</span>
                      </Link>
                      <Link
                        href="/sora-3-video-generator"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-white/80 transition-all duration-200"
                      >
                        <Play className="h-3 w-3 text-emerald-400" />
                        <span className="whitespace-nowrap">{t('veo3')}</span>
                      </Link>
                      <Link
                        href="/sora-3-video-generator"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 text-white/80 transition-all duration-200"
                      >
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span className="whitespace-nowrap">{t('wan26')}</span>
                      </Link>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Image AI dropdown */}
            <div suppressHydrationWarning className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg"
                >
                  <span>{t('imageAI')}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-72 p-1.5 rounded-xl bg-[#0a0f1a] border border-white/[0.08] shadow-2xl" suppressHydrationWarning>
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">{t('features')}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/text-to-image" className="group flex gap-3 p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors" suppressHydrationWarning>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:text-white">
                        <Palette className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">{t('textToImage')}</span>
                        <span className="text-xs text-white/40">{t('textToImageDescription')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/image-editor" className="group flex gap-3 p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors" suppressHydrationWarning>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:text-white">
                        <Wand2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">{t('imageEditor')}</span>
                        <span className="text-xs text-white/40">{t('imageEditorDescription')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">{t('models')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href="/nano-banana"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/30 text-white/80 transition-all duration-200"
                      >
                        <Palette className="h-3 w-3 text-yellow-400" />
                        <span className="whitespace-nowrap">{t('nanoBanana')}</span>
                      </Link>
                      <Link
                        href="/nano-banana-pro"
                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/30 text-white/80 transition-all duration-200"
                      >
                        <Wand2 className="h-3 w-3 text-yellow-400" />
                        <span className="whitespace-nowrap">{t('nanoBananaPro')}</span>
                      </Link>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link
              href="/pricing"
              className="text-sm text-white/50 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg"
            >
              {t('pricing')}
            </Link>
            <Link
              href="/blog"
              className="text-sm text-white/50 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg"
            >
              {t('blog')}
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher />

            {isAuthenticated ? (
              <div suppressHydrationWarning>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 hover:bg-white/[0.06] transition-colors rounded-full px-2 py-1"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/[0.12] flex items-center justify-center text-white text-xs font-medium">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm text-white/70 hidden sm:block">
                      {getUserDisplayName()}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#0a0f1a] border-white/[0.08]">
                  <div className="flex items-center space-x-2 p-2">
                    <div className="w-8 h-8 rounded-full bg-white/[0.12] flex items-center justify-center text-white text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{getUserDisplayName()}</span>
                      <span className="text-xs text-white/40">{user?.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="text-white/70 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06]">
                    <User className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t('account')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="text-white/70 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06]">
                    <Settings className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-400 focus:text-red-400 hover:bg-white/[0.06] focus:bg-white/[0.06]">
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
                  className="text-white/60 hover:text-white hover:bg-white/[0.06]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window !== 'undefined') {
                      const currentPath = window.location.pathname;
                      sessionStorage.setItem('redirectAfterLogin', currentPath);
                    }
                    setIsAuthModalOpen(true);
                  }}
                >
                  {tCommon('signIn')}
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-[#030712] hover:bg-white/90 font-medium rounded-lg text-sm px-4"
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push('/sora3-text-to-video');
                    } else {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('redirectAfterLogin', '/sora3-text-to-video');
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2 rtl:space-x-reverse">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/[0.06]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.06]">
            <div className="flex flex-col space-y-1">
              <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/[0.06]">
                {t('home')}
              </Link>
              <div className="px-3 pt-3 pb-1">
                <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest pb-2 flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {t('generate')}
                </div>
                <div className="flex flex-col space-y-0.5">
                  <Link href="/sora3-text-to-video" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">{t('textToVideo')}</Link>
                  <Link href="/sora3-image-to-video" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">{t('imageToVideo')}</Link>
                  <Link href="/sora-3-storyboard" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">{t('storyboard')}</Link>
                  <Link href="/watermark-remover" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">{t('watermarkRemover')}</Link>
                </div>
                <div className="px-3 pt-2 pb-1">
                  <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest pb-1">{t('models')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href="/sora-3-video-generator" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-white/80 transition-all duration-200">
                      <Video className="h-3 w-3 text-blue-400" />
                      <span>{t('sora3')}</span>
                    </Link>
                    <Link href="/sora-3-video-generator" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-white/80 transition-all duration-200">
                      <Sparkles className="h-3 w-3 text-blue-400" />
                      <span>{t('sora3Pro')}</span>
                    </Link>
                    <Link href="/sora-3-video-generator" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-white/80 transition-all duration-200">
                      <Video className="h-3 w-3 text-blue-400" />
                      <span>{t('sora2')}</span>
                    </Link>
                    <Link href="/sora-3-video-generator" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-white/80 transition-all duration-200">
                      <Sparkles className="h-3 w-3 text-blue-400" />
                      <span>{t('sora2Pro')}</span>
                    </Link>
                    <Link href="/sora-3-video-generator" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-white/80 transition-all duration-200">
                      <Play className="h-3 w-3 text-emerald-400" />
                      <span>{t('veo3')}</span>
                    </Link>
                    <Link href="/sora-3-video-generator" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-white/80 transition-all duration-200">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span>{t('wan26')}</span>
                    </Link>
                  </div>
                </div>
              </div>
              {/* Image AI Section */}
              <div className="px-3 pt-3 pb-1">
                <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest pb-2 flex items-center gap-1 relative">
                  <Palette className="w-3 h-3" />
                  {t('imageAI')}
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-sm">
                    NEW
                  </span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <Link href="/text-to-image" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">{t('textToImage')}</Link>
                  <Link href="/image-editor" className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">{t('imageEditor')}</Link>
                </div>
                <div className="px-3 pt-2 pb-1">
                  <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest pb-1">{t('models')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Link href="/nano-banana" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-white/80 transition-all duration-200">
                      <Palette className="h-3 w-3 text-yellow-400" />
                      <span>{t('nanoBanana')}</span>
                    </Link>
                    <Link href="/nano-banana-pro" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-white/80 transition-all duration-200">
                      <Wand2 className="h-3 w-3 text-yellow-400" />
                      <span>{t('nanoBananaPro')}</span>
                    </Link>
                  </div>
                </div>
              </div>
              <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/[0.06]">
                {t('blog')}
              </Link>
              <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/[0.06]">
                {t('pricing')}
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-white/[0.06]">
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white hover:bg-white/[0.06]"
                      onClick={() => router.push('/dashboard')}
                    >
                      <User className="w-4 h-4 mr-1" />
                      {tCommon('dashboard')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.06]"
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
                      className="text-white/60 hover:text-white hover:bg-white/[0.06]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof window !== 'undefined') {
                          const currentPath = window.location.pathname;
                          sessionStorage.setItem('redirectAfterLogin', currentPath);
                        }
                        setIsAuthModalOpen(true);
                      }}
                    >
                      {tCommon('signIn')}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-white text-[#030712] hover:bg-white/90 font-medium"
                      onClick={() => {
                        if (isAuthenticated) {
                          router.push('/sora3-text-to-video');
                        } else {
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('redirectAfterLogin', '/sora3-text-to-video');
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

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </nav>
    </>
  );
};

export default Navigation;
