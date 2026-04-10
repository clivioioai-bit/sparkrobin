"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import GenerationHistory from "@/components/GenerationHistory";
import SubscriptionHistory from "@/components/SubscriptionHistory";
import PaymentHistory from "@/components/PaymentHistory";
import { Zap, History, Download, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal'
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/contexts/CreditsContext";
import { useTranslations } from "next-intl";

type AccountTab = "overview" | "generations" | "subscriptions" | "payments";

interface AccountProps {
  defaultTab?: AccountTab;
  pageTitle?: string;
  pageDescription?: string;
}

const VALID_TABS: AccountTab[] = ["overview", "generations", "subscriptions", "payments"];

const Account = ({
  defaultTab = "overview",
  pageTitle,
  pageDescription,
}: AccountProps) => {
  const t = useTranslations("account");
  const { user } = useAuth();
  const { subscription, generations, refreshCredits } = useCredits();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTab = searchParams?.get("tab");
  const initialTab = VALID_TABS.includes(searchTab as AccountTab)
    ? (searchTab as AccountTab)
    : defaultTab;

  // User data from context and Supabase
  const userData = {
    name: user?.user_metadata?.full_name || user?.email || "User",
    email: user?.email || "",
    plan: subscription?.plan?.includes('creator') ? 'Creator Plan' : 
          subscription?.plan?.includes('studio') ? 'Studio Plan' : 
          subscription?.plan?.includes('enterprise') ? 'Enterprise Plan' : 
          subscription?.plan?.includes('pro') ? 'Pro Plan' :
          subscription?.plan?.includes('basic') ? 'Basic Plan' : 'Free Plan',
    credits: subscription?.credits || 0,
    totalCredits: subscription?.totalCredits || 0,
    totalGenerated: generations.length,
    subscriptionStatus: subscription?.status || "inactive",
    nextBilling: subscription?.resetDate || "N/A"
  };

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const resolvedPageTitle = pageTitle || t("dashboardPageTitle");
  const resolvedPageDescription = pageDescription || t("dashboardPageDescription");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle payment success callback: refresh credits then clean URL
  useEffect(() => {
    try {
      const payment = (searchParams?.get("payment") || "").toString();
      if (payment === "success") {
        const planName = (searchParams?.get("plan") || "").toString();
        toast.success(`Payment successful${planName ? `: ${planName.replace(/_/g, " ")}` : ""}`);
        refreshCredits().catch(() => {});
        // Clean query params to avoid re-triggering on back/refresh
        router.replace(pathname || "/dashboard");
      }
    } catch (_e) {
      // no-op
    }
    // We only want to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-primary">{resolvedPageTitle}</span>
            </h1>
            <p className="text-muted-foreground">
              {resolvedPageDescription}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userData.credits}</p>
                  <p className="text-sm text-muted-foreground">{t("stats.creditsAvailable")}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <History className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userData.totalGenerated}</p>
                  <p className="text-sm text-muted-foreground">{t("stats.videosGenerated")}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{userData.plan}</p>
                  <p className="text-sm text-muted-foreground">{t("stats.currentPlan")}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AccountTab)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="generations">{t("tabs.generations")}</TabsTrigger>
              <TabsTrigger value="subscriptions">{t("tabs.subscriptions")}</TabsTrigger>
              <TabsTrigger value="payments">{t("tabs.payments")}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("sections.accountInformation")}</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">{t("fields.name")}</Label>
                      <Input defaultValue={userData.name} className="mt-1" readOnly />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("fields.email")}</Label>
                      <Input defaultValue={userData.email} className="mt-1" readOnly />
                    </div>
                    <Button variant="outline" className="w-full">
                      {t("actions.updateProfile")}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("sections.subscriptionStatus")}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("fields.currentPlan")}</span>
                      <Badge variant="default">{userData.plan}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("fields.status")}</span>
                      <Badge variant="outline" className="text-primary border-primary">
                        {userData.subscriptionStatus === 'active' ? t("statuses.active") : userData.subscriptionStatus}
                      </Badge>
                    </div>
                    {userData.nextBilling !== "N/A" && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("fields.nextBilling")}</span>
                        <span className="text-sm text-muted-foreground">{userData.nextBilling}</span>
                      </div>
                    )}
                    <div className="pt-2 space-y-2">
                      <Button variant="outline" className="w-full" onClick={() => setShowSubscriptionModal(true)}>
                        {t("actions.upgradePlan")}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Generations Tab */}
            <TabsContent value="generations">
              <GenerationHistory />
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions">
              <SubscriptionHistory />
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <PaymentHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="upgrade your plan"
      />
    </div>
    </ProtectedRoute>
  );
};

export default Account;
