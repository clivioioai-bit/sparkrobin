"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("paymentSuccess");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const transactionId = (searchParams?.get('transaction_id') || searchParams?.get('tx') || '').toString();
  const valueRaw = (searchParams?.get('value') || searchParams?.get('amount') || searchParams?.get('total') || '').toString();
  const valueNum = Number.parseFloat(valueRaw);
  const value = Number.isFinite(valueNum) && valueNum > 0 ? valueNum : 1.0;
  const currency = ((searchParams?.get('currency') || searchParams?.get('curr') || 'USD').toString().toUpperCase()).slice(0, 3);

  const plan = (searchParams?.get('plan') || '').toString();
  const localePrefix = locale === 'en' ? '' : `/${locale}`;
  const target = `${localePrefix}/dashboard?payment=success${plan ? `&plan=${encodeURIComponent(plan)}` : ""}`;

  useEffect(() => {
    const fallback = setTimeout(() => {
      setIsRedirecting(true);
      try { router.replace(target); } catch (e) {}
    }, 2000);
    return () => {
      clearTimeout(fallback);
    };
  }, [router, target]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">

      <div className="max-w-md w-full p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("message")}
          </p>
          {value > 0 && (
            <p className="text-sm font-semibold text-foreground">
              {t("amount")}: {currency} ${value.toFixed(2)}
            </p>
          )}
        </div>

        {isRedirecting ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("redirecting")}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href={`${localePrefix}/gemini-omni-flash-text-to-video`}
                className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                {t("goToStudio")}
              </Link>
              <Link 
                href={`${localePrefix}/dashboard`}
                className="inline-flex items-center justify-center px-6 py-2 rounded-md border border-border hover:bg-accent transition-colors font-medium"
              >
                {t("viewDashboard")}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("autoRedirect")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}




