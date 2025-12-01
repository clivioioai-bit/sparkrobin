"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { 
  validateEmail, 
  validateSignup, 
  validateSignin, 
  getBaseUrl 
} from '@/lib/auth-utils';
import { handleSignInRedirect } from '@/lib/auth-redirect';
import { EmailConfirmationView } from '@/components/auth/EmailConfirmationView';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';
import { PasswordForm } from '@/components/auth/PasswordForm';
import { GoogleButton } from '@/components/auth/GoogleButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  preventClose?: boolean;
}

export default function AuthModal({ isOpen, onClose, preventClose = false }: AuthModalProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { signUp, signIn, signInWithGoogle } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [view, setView] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const baseUrl = getBaseUrl();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setError(null);
    setMagicLinkSent(false);
    setView('magic');
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
    if (newMode === 'signup') {
      setView('password');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMagicLink = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 在 signin 模式下，不允许通过 OTP 创建新用户
      // 如果 Supabase 配置不允许 OTP 注册，只允许登录已存在的用户
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === 'signup', // 只在 signup 模式下允许创建用户
          emailRedirectTo: `${baseUrl}/auth/callback`,
        }
      });

      if (error) {
        // 提供更友好的错误信息
        let errorMessage = error.message;
        if (error.message?.includes('Signups not allowed for otp') || error.message?.includes('signups not allowed')) {
          if (mode === 'signin') {
            errorMessage = 'Account not found. Please sign up first or use password to sign in.';
          } else {
            errorMessage = 'Signups via magic link are disabled. Please use password to create an account.';
          }
        } else if (error.message?.includes('User not found') || error.message?.includes('Invalid login credentials')) {
          errorMessage = 'No account found with this email. Please sign up first.';
        }
        setError(errorMessage);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (mode === 'signup') {
      const validationError = validateSignup({ email, password, fullName, confirmPassword });
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { error } = await signUp(email, password, { full_name: fullName.trim() });
        if (error) {
          setError(error.message);
        } else {
          setMagicLinkSent(true);
        }
      } catch (err: any) {
        setError(err?.message || 'Sign up failed');
      } finally {
        setLoading(false);
      }
    } else {
      const validationError = validateSignin({ email, password });
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { error } = await signIn(email, password);
        if (error) {
          // 提供更友好的错误信息
          let errorMessage = error.message;
          if (error.message?.includes('Invalid login credentials') || error.message?.includes('400')) {
            errorMessage = 'Invalid email or password. Please check your credentials or use magic link to sign in.';
          } else if (error.message?.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
          } else if (error.message?.includes('User not found')) {
            errorMessage = 'No account found with this email. Please sign up first.';
          }
          setError(errorMessage);
          setLoading(false);
        } else {
          await handleSignInRedirect(onClose, router);
          setLoading(false);
        }
      } catch (err: any) {
        setError(err?.message || 'Sign in failed');
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // If no error, keep loading state until page redirects
      // Don't reset loading here to show feedback until redirect happens
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed');
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (magicLinkSent) return t('checkEmail');
    return mode === 'signup' ? t('createAccount') : t('signIn');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !preventClose) {
        handleClose();
      }
    }}>
      <DialogContent className={`sm:max-w-md ${preventClose ? '[&>button]:hidden' : ''}`}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {magicLinkSent 
              ? 'Check your email for the magic link to sign in'
              : mode === 'signup' 
                ? 'Create a new account to get started'
                : 'Sign in to your account to continue'}
          </DialogDescription>
        </DialogHeader>

        {magicLinkSent ? (
          <EmailConfirmationView
            mode={mode}
            email={email}
            onBack={() => {
              setMagicLinkSent(false);
              resetForm();
            }}
          />
        ) : (
          <div className="space-y-4">
            {view === 'magic' && mode === 'signin' ? (
              <MagicLinkForm
                email={email}
                onChange={setEmail}
                onSubmit={handleMagicLink}
                loading={loading}
              />
            ) : (
              <PasswordForm
                mode={mode}
                email={email}
                password={password}
                fullName={fullName}
                confirmPassword={confirmPassword}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onFullNameChange={setFullName}
                onConfirmPasswordChange={setConfirmPassword}
                onSubmit={handlePasswordAuth}
                loading={loading}
              />
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleButton onClick={handleGoogleSignIn} disabled={loading} loading={loading} />

            {mode === 'signin' && (
              <div className="text-center">
                <button
                  onClick={() => setView(view === 'magic' ? 'password' : 'magic')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {view === 'magic' ? 'Use password instead' : 'Use magic link instead'}
                </button>
              </div>
            )}

            <div className="text-center pt-2 border-t">
              <button
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
