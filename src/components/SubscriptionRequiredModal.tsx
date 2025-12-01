"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Remove Tabs to match Pricing page's toggle style
import { Check, Crown, Download, Zap, Loader2, AlertCircle } from 'lucide-react';
import { subscriptionPlans } from '@/config/pricing';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { startCheckout, CheckoutError } from '@/services/payments';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import SubscriptionPlans from '@/components/pricing/SubscriptionPlans';
import { useTranslations } from 'next-intl';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string; // e.g., "download videos"
}

const SubscriptionRequiredModal: React.FC<SubscriptionRequiredModalProps> = ({
  isOpen,
  onClose,
  feature = "download videos"
}) => {
  const t = useTranslations('pricing');
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  // Default to Annual to match pricing pages
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>(() => 'year');

  const beginCheckout = async (planId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      toast({
        variant: 'destructive',
        title: t('modal.pleaseLogInFirst'),
        description: t('modal.logInToProceed'),
      });
      return;
    }

    setLoadingPlanId(planId);

    try {
      await startCheckout(planId);
      onClose();
    } catch (error) {
      if (error instanceof CheckoutError && error.code === 'AUTH_REQUIRED') {
        setShowAuthModal(true);
        toast({
          variant: 'destructive',
          title: t('modal.loginSessionExpired'),
          description: t('modal.pleaseLogInAgain'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('modal.subscriptionFailed'),
          description: error instanceof Error ? error.message : t('modal.unexpectedError'),
        });
      }
    } finally {
      setLoadingPlanId(null);
    }
  };

  const displayedPlans = subscriptionPlans.filter(plan => plan.billingInterval === billingInterval);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {feature === "generate videos" ? (
                <AlertCircle className="w-6 h-6 text-orange-500" />
              ) : (
                <Crown className="w-6 h-6 text-yellow-500" />
              )}
              {feature === "generate videos" ? t('modal.insufficientCredits') : 
               feature === "upgrade your plan" ? t('modal.upgradeYourPlan') : 
               t('modal.subscriptionRequired')}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {feature === "generate videos" ? 
                t('modal.insufficientCreditsDescription') :
               feature === "upgrade your plan" ? 
                t('modal.upgradePlanDescription') :
                t('modal.subscriptionRequiredDescription', { feature })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Pricing Plans */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('chooseYourPlan')}</h3>
                {/* Toggle lives inside SubscriptionPlans to keep styles unified */}
              </div>

              {/* Shared plans component */}
              <SubscriptionPlans 
                variant="modal" 
                defaultInterval={billingInterval}
                onRequireAuth={() => setShowAuthModal(true)}
                afterRedirect={onClose}
              />
            </div>

            {/* One-time packs removed as requested */}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t.raw('proTip') }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default SubscriptionRequiredModal;
