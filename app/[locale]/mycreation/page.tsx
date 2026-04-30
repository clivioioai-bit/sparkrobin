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
    title: t('myCreationsMetaTitle'),
    description: t('myCreationsMetaDescription'),
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function MyCreationPage({
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
      defaultTab="generations"
      pageTitle={t('myCreationsPageTitle')}
      pageDescription={t('myCreationsPageDescription')}
    />
  )
}
