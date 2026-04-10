"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface Subscription {
  id: number;
  planType: string;
  planStatus: string;
  subscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SubscriptionHistory() {
  const t = useTranslations('account.subscriptionHistory');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/list');
      
      if (!response.ok) {
        throw new Error('Failed to load subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: t('statuses.active'), variant: 'default' },
      canceled: { label: t('statuses.canceled'), variant: 'destructive' },
      past_due: { label: t('statuses.pastDue'), variant: 'destructive' },
      trialing: { label: t('statuses.trialing'), variant: 'secondary' },
      expired: { label: t('statuses.expired'), variant: 'outline' },
      inactive: { label: t('statuses.inactive'), variant: 'outline' },
    };

    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatPlanName = (planType: string) => {
    return planType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('emptyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t('emptyTitle')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{formatPlanName(subscription.planType)}</h3>
                  {getStatusBadge(subscription.planStatus)}
                </div>
                {subscription.subscriptionId && (
                  <span className="text-xs text-muted-foreground">
                    ID: {subscription.subscriptionId.substring(0, 8)}...
                  </span>
                )}
              </div>

              {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
                <div className="text-sm text-muted-foreground">
                  <p>
                    {t('labels.period')}: {format(new Date(subscription.currentPeriodStart), 'MMM d, yyyy')} -{' '}
                    {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>{t('labels.created')}: {format(new Date(subscription.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
