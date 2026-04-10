import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { generateHreflangAlternates } from '@/utils/hreflang'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, Sparkles, Film, Image as ImageIcon, Check } from 'lucide-react'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Only show this page for Russian locale
  if (locale !== 'ru') {
    notFound()
  }

  const baseUrl = 'https://veo4video.io'
  const prefix = `/${locale}`
  
  const title = 'Veo4 Видео-Генератор | AI Видео Без Водяных Знаков'
  const description = 'Создавайте AI-видео для рекламы, товаров, TikTok и соцсетей без водяных знаков. Быстро, понятно и с поддержкой русского языка.'

  return {
    title,
    description,
    alternates: generateHreflangAlternates('/veo-4-video-generator', locale),
    openGraph: {
      title,
      description,
      url: `${baseUrl}${prefix}/veo-4-video-generator`,
      siteName: 'Veo4',
      locale: 'ru_RU',
      type: 'website',
      images: [
        {
          url: 'https://veo4video.io/logo-v2.png',
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://veo4video.io/logo-v2.png']
    },
  }
}

const features = [
  {
    icon: Play,
    title: 'Veo4 Текст-в-Видео',
    description: 'Создавайте кинематографические видео из текстовых запросов с помощью Veo4 и совместимых AI-видеомоделей. Создавайте профессиональный контент мгновенно.',
    href: '/ru/veo4-text-to-video'
  },
  {
    icon: ImageIcon,
    title: 'Veo4 Изображение-в-Видео',
    description: 'Превращайте статичные изображения в динамичные видео Veo4. Идеально для демонстрации продуктов и творческих проектов.',
    href: '/ru/veo4-image-to-video'
  },
]

export default async function Veo4VideoGeneratorPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!routing.locales.includes(locale as any) || locale !== 'ru') {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Veo4 Видео-Генератор',
    description: 'veo4video.io — независимая платформа для создания AI-видео. Мы используем модели, совместимые с Veo4, для создания профессиональных видео без водяных знаков. Поддержка русского языка, оптимизация для рынка СНГ.',
    url: 'https://veo4video.io/ru/veo-4-video-generator',
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Veo4 Видео-Генератор',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: 'Независимая платформа для создания AI-видео, предлагающая создание видео Veo4. veo4video.io использует совместимые AI-видеомодели и другие сторонние движки. veo4video.io не связана с OpenAI, Google или Veo4.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-background to-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Лучший инструмент для России и СНГ</span>
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Veo4 Видео-Генератор Без Водяных Знаков
              </h1>

              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-4">
                Создавайте рекламные ролики за 30 секунд
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Быстро. Дёшево. Без водяных знаков.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  asChild
                >
                  <Link href="/ru/veo4-text-to-video">
                    <Play className="w-5 h-5 mr-2" />
                    Начать Создание
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6"
                  asChild
                >
                  <Link href="/ru/pricing">
                    Посмотреть Тарифы
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why veo4video.io Section */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Почему veo4video.io лучший выбор для России и СНГ?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="text-xl font-semibold mb-3">1. Видео как у Veo4 — без водяных знаков</h3>
                <p className="text-muted-foreground mb-4">
                  Большинство сервисов добавляют watermark или ограничивают качество. <strong>Мы — нет.</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Экспортируйте чистые ролики, идеально подходящие для:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• TikTok</li>
                  <li>• Instagram Reels</li>
                  <li>• YouTube Shorts</li>
                  <li>• Рекламы в Яндекс.Директ и VK Ads</li>
                </ul>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="text-xl font-semibold mb-3">2. Быстрые клипы и профессиональные форматы Veo4</h3>
                <p className="text-muted-foreground mb-4">
                  Выберите формат:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>8-10 секунд</strong> (быстрое поколение)</li>
                  <li>• <strong>качество / скорость</strong> (под разные задачи)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Подходит для рекламы, обзоров, интро и демонстрации продуктов.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="text-xl font-semibold mb-3">3. Поддержка русскоязычных продавцов</h3>
                <p className="text-muted-foreground mb-4">
                  Наши модели оптимизированы под сценарии:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• интернет-магазины</li>
                  <li>• маркетплейсы (Ozon, Wildberries)</li>
                  <li>• инфобизнес</li>
                  <li>• услуги</li>
                  <li>• тикток-блогеры</li>
                  <li>• рекламные агентства</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Создавайте видео <strong>на русском</strong>, с русскими товарами, русскими людьми и русскими локациями.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="text-xl font-semibold mb-3">4. Цена в 10 раз ниже конкурентов</h3>
                <p className="text-muted-foreground mb-4">
                  Мы не берём переплаты как западные сервисы.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Оплата за кредиты = максимально выгодно для СНГ пользователей.</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                🎬 Как это работает?
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="text-lg">Введите текстовый запрос (на русском или английском)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="text-lg">Выберите нужный режим качества и скорости</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">3</div>
                <div>
                  <p className="text-lg">Укажите стиль (реалистичный, аниме, кинематографичный, продуктовый)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">4</div>
                <div>
                  <p className="text-lg">Нажмите «Создать»</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">5</div>
                <div>
                  <p className="text-lg">Готовое видео можно скачать без водяных знаков</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prompt Examples Section */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                🔥 Примеры запросов (Prompt Inspiration)
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-xl border border-border bg-card">
                <p className="text-muted-foreground italic">
                  «красивый рекламный ролик для женской косметики, крупный план, мягкий свет»
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <p className="text-muted-foreground italic">
                  «обзор нового смартфона, динамичные переходы, современный стиль»
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <p className="text-muted-foreground italic">
                  «мальчик в зимнем лесу, снег, атмосфера сказки, кино-стиль»
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <p className="text-muted-foreground italic">
                  «продуктовая съемка бутылки духов, черный фон, slow motion»
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                🛒 Подходит для продавцов и создателей контента
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-3 text-lg">Для интернет-магазинов</h3>
                <p className="text-sm text-muted-foreground">
                  Создавайте видео для карточек товара.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-3 text-lg">Для рекламодателей</h3>
                <p className="text-sm text-muted-foreground">
                  Готовые ролики для VK Ads, Yandex Ads, MyTarget.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-3 text-lg">Для блогеров</h3>
                <p className="text-sm text-muted-foreground">
                  Быстрая генерация контента без монтажа.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Veo4 Видео-Генерация
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Создавайте профессиональные видео Veo4 с помощью нашего мультимодельного конвейера генерации
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={feature.href}>Попробовать</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">💳 Тарифы</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>• Нет подписки</p>
              <p>• Оплата только за кредиты</p>
              <p>• Прозрачная цена</p>
              <p>• Лучшее предложение для СНГ рынка</p>
            </div>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/ru/pricing">Посмотреть Тарифы</Link>
            </Button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              📥 Начните сейчас — бесплатно
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Создайте первые видео бесплатно и посмотрите качество сами.
            </p>
            <p className="text-lg font-semibold mb-8">
              👉 <strong>veo4video.io — лучший российский генератор AI-видео</strong>
            </p>
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/ru/veo4-text-to-video">
                <Play className="w-5 h-5 mr-2" />
                Начать Создание
              </Link>
            </Button>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="py-12 bg-background border-t border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-6 rounded-xl bg-muted/50 border border-border">
              <h3 className="font-semibold mb-3">Важное уведомление</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                veo4video.io — это независимая платформа для создания AI-видео. Мы используем модели, совместимые с Veo4, и другие сторонние модели для создания мультимодельной генерации видео. veo4video.io не связана с OpenAI, Google или Veo4. Эта страница предназначена для помощи создателям в поиске инструментов генерации видео Veo4 и не является официальным сервисом Veo4.
              </p>
            </div>
          </div>
        </section>
      </main>
      {typeof window !== 'undefined' && <Footer />}
    </>
  )
}
