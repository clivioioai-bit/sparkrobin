import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PasswordFormProps {
  mode: 'signin' | 'signup';
  email: string;
  password: string;
  fullName?: string;
  confirmPassword?: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onFullNameChange?: (name: string) => void;
  onConfirmPasswordChange?: (password: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function PasswordForm({
  mode,
  email,
  password,
  fullName = '',
  confirmPassword = '',
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onConfirmPasswordChange,
  onSubmit,
  loading,
}: PasswordFormProps) {
  const t = useTranslations('auth');
  
  return (
    <>
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="full-name">{t('fullName')}</Label>
          <Input
            id="full-name"
            type="text"
            placeholder={t('enterFullName')}
            value={fullName}
            onChange={(e) => onFullNameChange?.(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email-password">{t('email')}</Label>
        <Input
          id="email-password"
          type="email"
          placeholder={t('enterEmail')}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={mode === 'signup' ? t('createPassword') : t('enterPassword')}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
      </div>
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder={t('confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
        </div>
      )}
      <Button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
      >
        {mode === 'signup' ? (
          <>
            <User className="w-4 h-4 mr-2" />
            {t('createAccount')}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            {t('signIn')}
          </>
        )}
      </Button>
    </>
  );
}

