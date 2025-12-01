import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Providers } from './providers'
import NotFound from '@/page-components/NotFound'

export default async function NotFoundPage() {
  // Provide default locale messages for not-found page
  const messages = await getMessages({ locale: 'en' })
  
  return (
    <NextIntlClientProvider messages={messages} locale="en">
      <Providers>
        <NotFound />
      </Providers>
    </NextIntlClientProvider>
  )
}