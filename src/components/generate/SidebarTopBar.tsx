"use client";

import React from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

type SidebarTopBarLabels = {
  login: string;
  startForFree: string;
  dashboard: string;
  preferences: string;
  signOut: string;
};

type SidebarTopBarProps = {
  isMobile?: boolean;
  isAuthenticated: boolean;
  userEmail?: string | null;
  getUserInitials: () => string;
  getUserDisplayName: () => string;
  onLogin: () => void;
  onStart: () => void;
  onDashboard: () => void;
  onPreferences: () => void;
  onSignOut: () => void;
  labels: SidebarTopBarLabels;
};

const SidebarTopBar = ({
  isMobile,
  isAuthenticated,
  userEmail,
  getUserInitials,
  getUserDisplayName,
  onLogin,
  onStart,
  onDashboard,
  onPreferences,
  onSignOut,
  labels,
}: SidebarTopBarProps) => {
  return (
    <div
      className={`flex justify-end items-center gap-3 px-6 py-4 border-b border-white/[0.06] ${isMobile ? "pt-16" : ""}`}
    >
      <LanguageSwitcher />
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-white/[0.06] transition-colors rounded-full px-2 py-1"
            >
              <div className="w-8 h-8 rounded-full bg-white/[0.12] flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials()}
              </div>
              <span className="text-sm font-medium text-white/70 hidden sm:block">
                {getUserDisplayName()}
              </span>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <div className="flex items-center space-x-2 p-2">
              <div className="w-8 h-8 rounded-full bg-white/[0.12] flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white/90">{getUserDisplayName()}</span>
                <span className="text-xs text-white/40">{userEmail}</span>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem onClick={onDashboard} className="text-white/70 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06]">
              <User className="w-4 h-4 mr-2" />
              {labels.dashboard}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPreferences} className="text-white/70 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06]">
              <Settings className="w-4 h-4 mr-2" />
              {labels.preferences}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive hover:bg-white/[0.06] focus:bg-white/[0.06]">
              <LogOut className="w-4 h-4 mr-2" />
              {labels.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogin}
            className="text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            {labels.login}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onStart}
            className="bg-white text-foreground hover:bg-white/90 font-medium"
          >
            {labels.startForFree}
          </Button>
        </>
      )}
    </div>
  );
};

export default SidebarTopBar;
