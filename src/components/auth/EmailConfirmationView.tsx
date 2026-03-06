import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EmailConfirmationViewProps {
  mode: 'signin' | 'signup';
  email: string;
  onBack: () => void;
}

export function EmailConfirmationView({ mode, email, onBack }: EmailConfirmationViewProps) {
  const t = useTranslations('auth');
  
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-primary" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium">
          {mode === 'signup' ? t('confirmationEmailSent') : t('magicLinkSent')}
        </p>
        <p className="text-muted-foreground">
          {mode === 'signup' ? (
            <>
              {t('confirmationEmailDescription', { email })}
            </>
          ) : (
            <>
              {t('magicLinkDescription', { email })}
            </>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {mode === 'signup' 
            ? t('afterVerification')
            : t('checkEmailAndClick')}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onBack}
        className="w-full"
      >
        <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
        {t(mode === 'signup' ? 'backToSignUp' : 'backToSignIn')}
      </Button>
    </div>
  );
}

