import { notFound } from 'next/navigation'
import { routing } from '../../i18n/routing'

function toLanguageMeta(locale: string) {
  switch (locale) {
    case 'zh-CN':
      return 'zh-CN'
    default:
      return locale
  }
}

export default async function Head({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const language = toLanguageMeta(locale)

  return (
    <>
      <meta httpEquiv="content-language" content={language} />
      <meta name="language" content={language} />
    </>
  )
}
