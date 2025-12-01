import Account from '@/page-components/Account'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  let title = 'My Dashboard - Manage Your sora3 AI Account | sora3 AI'
  let description = 'Manage your sora3 AI account settings, view usage, manage subscriptions and credits. Profile settings and account security management.'
  
  if (locale === 'ar') {
    title = 'لوحة التحكم - إدارة حساب sora3 AI | sora3 AI'
    description = 'إدارة إعدادات حساب sora3 AI، عرض الاستخدام، إدارة الاشتراكات والاعتمادات. إعدادات الملف الشخصي وإدارة أمان الحساب.'
  } else if (locale === 'ja') {
    title = 'ダッシュボード - sora3 AIアカウント管理 | sora3 AI'
    description = 'sora3 AIアカウント設定の管理、使用状況の表示、サブスクリプションとクレジットの管理。プロフィール設定とアカウントセキュリティ管理。'
  }

  return {
    title,
    description,
  }
}

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  return <Account />
}

