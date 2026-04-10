import Account from '@/page-components/Account'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

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

  const t = await getTranslations({ locale, namespace: 'account' })

  return {
    title: t('dashboardMetaTitle'),
    description: t('dashboardMetaDescription'),
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

  const t = await getTranslations({ locale, namespace: 'account' })

  return (
    <Account
      pageTitle={t('dashboardPageTitle')}
      pageDescription={t('dashboardPageDescription')}
    />
  )
}
