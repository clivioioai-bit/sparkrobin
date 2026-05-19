import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { generateHreflangAlternates } from '@/utils/hreflang'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, Sparkles, Film, Image as ImageIcon } from 'lucide-react'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

const pageCopy = {
  en: {
    title: 'Gemini Omni Flash Video Generator | Text & Image to Video',
    description: 'Generate AI videos with Gemini Omni Flash from text prompts or images. Create clips for ads, social media, product demos, and creative projects online.',
    badge: 'Text to video + image to video',
    heroTitle: 'Gemini Omni Flash AI Video Generator',
    heroLead: 'Turn text prompts and images into AI-generated videos online.',
    heroSublead: 'Create ad creatives, product videos, social clips, and visual concepts with a fast Gemini Omni Flash video workflow.',
    primaryCta: 'Generate Video',
    secondaryCta: 'View Pricing',
    whyTitle: 'Why creators use Gemini Omni Flash video generation',
    whyCards: [
      {
        title: 'Text to video in one workflow',
        description: 'Turn prompts into video concepts with subject, camera, motion, pacing, and visual style in one place.'
      },
      {
        title: 'Image to video for visual control',
        description: 'Upload product images, still frames, or concept art and animate them into usable AI video clips.'
      },
      {
        title: 'Built for marketing output',
        description: 'Create videos for ads, landing pages, social posts, product demos, and campaign experiments.'
      },
      {
        title: 'Fast iteration for creators',
        description: 'Generate, review, and refine clips quickly without a full production cycle.'
      }
    ],
    featuresTitle: 'Choose a starting point',
    features: [
      {
        title: 'Text to Video Generator',
        description: 'Write a prompt and generate an AI video clip for ads, social media, or creative testing.',
        href: '/gemini-omni-flash-text-to-video'
      },
      {
        title: 'Image to Video Generator',
        description: 'Upload an image and turn it into a moving AI video with motion and camera direction.',
        href: '/gemini-omni-flash-image-to-video'
      }
    ],
    stepsTitle: 'How it works',
    steps: [
      'Enter a prompt or upload an image.',
      'Choose video settings and describe motion, camera, and style.',
      'Generate your AI video and refine the next version.'
    ]
  },
  ar: {
    title: 'مولد فيديو Gemini Omni Flash | النص والصورة وسير عمل الفيديو بالذكاء الاصطناعي',
    description: 'استخدم مولد فيديو Gemini Omni Flash لإنشاء فيديو بالذكاء الاصطناعي من النص أو الصورة مع مخرجات سريعة ونظيفة وسير عمل مرن للحملات.',
    badge: 'سير عمل مرن لفيديو AI',
    heroTitle: 'مولد فيديو Gemini Omni Flash لفرق المحتوى الحديثة',
    heroLead: 'أنشئ فيديوهات جاهزة للحملات من النصوص والصور والتوجيه الإبداعي.',
    heroSublead: 'استخدم سير عمل Gemini Omni Flash للإعلانات وفيديوهات المنتجات والمقاطع الاجتماعية وسرد العلامة التجارية.',
    primaryCta: 'ابدأ الإنشاء',
    secondaryCta: 'عرض الأسعار',
    whyTitle: 'لماذا تستخدم الفرق مولد فيديو Gemini Omni Flash هذا',
    whyCards: [
      { title: 'النص إلى فيديو لابتكار سريع', description: 'حوّل النصوص إلى مفاهيم فيديو جاهزة عندما تحتاج إلى سرعة وحركة وتوجيه واضح للمشهد.' },
      { title: 'الصورة إلى فيديو لأصول المنتج والعلامة', description: 'حوّل الصور الثابتة إلى مقاطع جاهزة للإعلانات لصفحات المنتجات والإطلاقات والنشر الاجتماعي.' },
      { title: 'مخرجات أنظف للاستخدام التسويقي الحقيقي', description: 'أنشئ أصولًا إبداعية أسهل للمراجعة والتكرار والنشر عبر الحملات.' },
      { title: 'مصمم لاختبار أسرع وتكرار أسهل', description: 'انتقل من الفكرة إلى عدة نسخ فيديو دون الاعتماد على دورة إنتاج كاملة.' }
    ],
    featuresTitle: 'اختر سير العمل المناسب لمشروعك',
    features: [
      { title: 'Gemini Omni Flash من النص إلى الفيديو', description: 'أنشئ فيديوهات AI من النصوص للإعلانات وشرح المنتجات والمحتوى الاجتماعي.', href: '/gemini-omni-flash-text-to-video' },
      { title: 'Gemini Omni Flash من الصورة إلى الفيديو', description: 'ارفع الصور وحولها إلى فيديوهات متحركة بحركة أقوى واستمرارية أفضل للمشهد.', href: '/gemini-omni-flash-image-to-video' }
    ],
    stepsTitle: 'كيف يعمل',
    steps: [
      'اختر النص إلى فيديو أو الصورة إلى فيديو حسب نوع الإدخال.',
      'حدد الأسلوب ونسبة الأبعاد وتفضيلات الإخراج.',
      'أنشئ الفيديو وراجعه ثم صدّره للحملات أو الصفحات أو القنوات الاجتماعية.'
    ]
  },
  ja: {
    title: 'Gemini Omni Flash 動画生成 | テキスト・画像・AI動画ワークフロー',
    description: 'Gemini Omni Flash 動画生成を使って、テキストから動画、画像から動画、キャンペーン向けのAI動画を作成。高速出力、きれいな書き出し、柔軟な制作フローに対応。',
    badge: '柔軟なAI動画ワークフロー',
    heroTitle: '現代のコンテンツチーム向け Gemini Omni Flash 動画生成',
    heroLead: 'プロンプト、画像、クリエイティブ指示からキャンペーン向け動画を作成します。',
    heroSublead: '広告、商品動画、SNSクリップ、ブランドストーリーに Gemini Omni Flash ワークフローを活用できます。',
    primaryCta: '作成を始める',
    secondaryCta: '料金を見る',
    whyTitle: 'この Gemini Omni Flash 動画生成が選ばれる理由',
    whyCards: [
      { title: '高速な発想向けテキストから動画', description: 'スピード、動き、明確なシーン設計が必要なときに、プロンプトから完成度の高い動画案を作成します。' },
      { title: '商品・ブランド素材向け画像から動画', description: '静止画像を、商品ページや告知、SNS配信用の広告向け動画に変換できます。' },
      { title: '実運用しやすいクリーンな書き出し', description: 'レビュー、改善、公開がしやすい動画アセットを作成できます。' },
      { title: 'より速い検証と反復に最適', description: 'フル制作体制に頼らず、アイデアから複数の動画バリエーションまで素早く進められます。' }
    ],
    featuresTitle: 'プロジェクトに合うワークフローを選択',
    features: [
      { title: 'Gemini Omni Flash テキストから動画', description: '広告、商品紹介、SNS向けに、プロンプトからAI動画を生成します。', href: '/gemini-omni-flash-text-to-video' },
      { title: 'Gemini Omni Flash 画像から動画', description: '画像をアップロードし、より自然な動きとシーンのつながりを持つ映像に変換します。', href: '/gemini-omni-flash-image-to-video' }
    ],
    stepsTitle: '使い方',
    steps: [
      '入力内容に応じてテキストから動画か画像から動画を選びます。',
      'スタイル、アスペクト比、出力設定を調整します。',
      '生成後に確認し、キャンペーンやLP、SNS向けに書き出します。'
    ]
  },
  ru: {
    title: 'Gemini Omni Flash Видео-генератор | Текст, изображение и AI-видео',
    description: 'Используйте Gemini Omni Flash видео-генератор для text to video, image to video и создания AI-видео для кампаний. Быстрый результат, чистый экспорт и гибкие сценарии.',
    badge: 'Гибкие AI-видео сценарии',
    heroTitle: 'Gemini Omni Flash Видео-генератор для современных команд контента',
    heroLead: 'Создавайте AI-видео для кампаний из текста, изображений и креативных идей.',
    heroSublead: 'Подходит для рекламы, продуктовых роликов, соцсетей и бренд-сторителлинга.',
    primaryCta: 'Начать создание',
    secondaryCta: 'Посмотреть цены',
    whyTitle: 'Почему команды выбирают этот Gemini Omni Flash видео-генератор',
    whyCards: [
      { title: 'Text to video для быстрого продакшна', description: 'Превращайте промпты в готовые видео-концепты, когда важны скорость, движение и понятная постановка сцены.' },
      { title: 'Image to video для продукта и бренда', description: 'Анимируйте изображения в ролики для запусков, карточек товара и соцсетей.' },
      { title: 'Чистый экспорт для реального маркетинга', description: 'Собирайте креативы, которые проще проверять, дорабатывать и публиковать в кампаниях.' },
      { title: 'Быстрее тестировать и итерировать', description: 'Переходите от идеи к нескольким версиям видео без полного продакшн-цикла.' }
    ],
    featuresTitle: 'Выберите подходящий режим для проекта',
    features: [
      { title: 'Gemini Omni Flash Текст в Видео', description: 'Создавайте AI-видео из текста для рекламы, продуктовых обзоров и соцсетей.', href: '/gemini-omni-flash-text-to-video' },
      { title: 'Gemini Omni Flash Изображение в Видео', description: 'Загружайте изображения и превращайте их в видео с более сильным движением и лучшей связностью сцен.', href: '/gemini-omni-flash-image-to-video' }
    ],
    stepsTitle: 'Как это работает',
    steps: [
      'Выберите text to video или image to video в зависимости от исходных материалов.',
      'Настройте стиль, формат кадра и параметры результата.',
      'Сгенерируйте, проверьте и экспортируйте ролик для кампаний, лендингов или соцсетей.'
    ]
  },
  es: {
    title: 'Generador de Video Gemini Omni Flash | Texto, imagen y flujos de video AI',
    description: 'Usa el generador de video Gemini Omni Flash para texto a video, imagen a video y creación de video AI lista para campañas. Salida rápida, exportaciones limpias y flujos flexibles.',
    badge: 'Flujos flexibles de video AI',
    heroTitle: 'Generador de Video Gemini Omni Flash para equipos modernos de contenido',
    heroLead: 'Crea videos listos para campañas a partir de prompts, imágenes y dirección creativa.',
    heroSublead: 'Usa Gemini Omni Flash para anuncios, videos de producto, clips sociales y storytelling de marca.',
    primaryCta: 'Empezar a crear',
    secondaryCta: 'Ver precios',
    whyTitle: 'Por qué los equipos usan este generador de video Gemini Omni Flash',
    whyCards: [
      { title: 'Texto a video para ideación rápida', description: 'Convierte prompts en conceptos de video pulidos cuando necesitas velocidad, movimiento y una dirección de escena clara.' },
      { title: 'Imagen a video para activos de producto y marca', description: 'Anima imágenes fijas en clips listos para anuncios, lanzamientos, páginas de producto y redes sociales.' },
      { title: 'Exportaciones más limpias para marketing real', description: 'Crea activos de video más fáciles de revisar, iterar y publicar en campañas.' },
      { title: 'Pensado para probar e iterar más rápido', description: 'Pasa de una idea a varias versiones de video sin depender de un ciclo completo de producción.' }
    ],
    featuresTitle: 'Elige el flujo adecuado para tu proyecto',
    features: [
      { title: 'Gemini Omni Flash Texto a Video', description: 'Genera videos AI desde prompts para anuncios, productos y contenido social.', href: '/gemini-omni-flash-text-to-video' },
      { title: 'Gemini Omni Flash Imagen a Video', description: 'Sube imágenes y conviértelas en visuales en movimiento con mejor dinámica y continuidad de escena.', href: '/gemini-omni-flash-image-to-video' }
    ],
    stepsTitle: 'Cómo funciona',
    steps: [
      'Elige texto a video o imagen a video según tu material de entrada.',
      'Configura estilo, proporción y preferencias de salida.',
      'Genera, revisa y exporta clips para campañas, landing pages o redes sociales.'
    ]
  },
  'zh-CN': {
    title: 'Gemini Omni Flash 视频生成器 | 文生视频与图生视频',
    description: '使用 Gemini Omni Flash 在线生成 AI 视频，把文本提示词或图片转成广告、社媒、产品展示和创意项目视频。',
    badge: '文生视频 + 图生视频',
    heroTitle: 'Gemini Omni Flash AI 视频生成器',
    heroLead: '把文本提示词和图片在线生成 AI 视频。',
    heroSublead: '快速创建广告素材、产品视频、社媒短片和视觉概念。',
    primaryCta: '生成视频',
    secondaryCta: '查看价格',
    whyTitle: '为什么创作者使用 Gemini Omni Flash 生成视频',
    whyCards: [
      { title: '文本生成视频', description: '用提示词描述主体、镜头、动作、节奏和风格，快速生成视频片段。' },
      { title: '图片生成视频', description: '上传产品图、样张或概念图，并添加运动和镜头方向。' },
      { title: '面向营销输出', description: '创建广告素材、产品展示、落地页视觉和社媒短片。' },
      { title: '快速创意迭代', description: '生成、评审并优化下一版视频，减少完整制作周期。' }
    ],
    featuresTitle: '选择你的起点',
    features: [
      { title: '文本 Prompt 实验室', description: '把粗略想法改写成分层场景提示词，并生成可评审的视频草稿。', href: '/gemini-omni-flash-text-to-video' },
      { title: '参考图实验室', description: '从产品图、视觉帧或概念图出发，测试镜头运动和画面节奏。', href: '/gemini-omni-flash-image-to-video' }
    ],
    stepsTitle: '使用方式',
    steps: [
      '从文本想法或视觉参考开始。',
      '补充镜头、运动、节奏和连续性说明。',
      '生成草稿，对照 brief 评审，再优化下一版。'
    ]
  },
  de: {
    title: 'Gemini Omni Flash Videogenerator | Text, Bild und AI-Video-Workflows',
    description: 'Nutzen Sie den Gemini Omni Flash Videogenerator für Text zu Video, Bild zu Video und kampagnentaugliche AI-Videoproduktion. Schnelle Ausgabe, saubere Exporte und flexible Workflows.',
    badge: 'Flexible AI-Video-Workflows',
    heroTitle: 'Gemini Omni Flash Videogenerator für moderne Content-Teams',
    heroLead: 'Erstellen Sie kampagnentaugliche AI-Videos aus Prompts, Bildern und kreativen Vorgaben.',
    heroSublead: 'Geeignet für Ads, Produktvideos, Social Clips und Brand Storytelling.',
    primaryCta: 'Jetzt erstellen',
    secondaryCta: 'Preise ansehen',
    whyTitle: 'Warum Teams diesen Gemini Omni Flash Videogenerator nutzen',
    whyCards: [
      { title: 'Text zu Video für schnelle Ideenfindung', description: 'Verwandeln Sie Prompts in ausgearbeitete Videokonzepte, wenn Geschwindigkeit, Bewegung und klare Szenenführung wichtig sind.' },
      { title: 'Bild zu Video für Produkt- und Markenassets', description: 'Animieren Sie statische Bilder zu Clips für Launches, Produktseiten und Social Distribution.' },
      { title: 'Sauberere Exporte für echtes Marketing', description: 'Erstellen Sie Assets, die leichter zu prüfen, zu iterieren und in Kampagnen zu veröffentlichen sind.' },
      { title: 'Für schnelleres Testen und Iterieren gebaut', description: 'Gehen Sie von einer Idee zu mehreren Video-Varianten, ohne einen vollständigen Produktionszyklus zu benötigen.' }
    ],
    featuresTitle: 'Wählen Sie den passenden Workflow für Ihr Projekt',
    features: [
      { title: 'Gemini Omni Flash Text zu Video', description: 'Erzeugen Sie AI-Videos aus Prompts für Ads, Produkt-Erklärungen und Social Content.', href: '/gemini-omni-flash-text-to-video' },
      { title: 'Gemini Omni Flash Bild zu Video', description: 'Laden Sie Bilder hoch und verwandeln Sie sie in bewegte Visuals mit stärkerer Dynamik und besserer Szenenkontinuität.', href: '/gemini-omni-flash-image-to-video' }
    ],
    stepsTitle: 'So funktioniert es',
    steps: [
      'Wählen Sie je nach Input Text zu Video oder Bild zu Video.',
      'Legen Sie Stil, Seitenverhältnis und Ausgabeoptionen fest.',
      'Generieren, prüfen und exportieren Sie Clips für Kampagnen, Landingpages oder Social Channels.'
    ]
  }
} as const

type SupportedLocale = keyof typeof pageCopy

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const baseUrl = 'https://omniflashai.io'
  const prefix = locale === 'en' ? '' : `/${locale}`
  const copy = pageCopy[locale as SupportedLocale] ?? pageCopy.en

  return {
    title: copy.title,
    description: copy.description,
    alternates: generateHreflangAlternates('/gemini-omni-flash-video-generator', locale),
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `${baseUrl}${prefix}/gemini-omni-flash-video-generator`,
      siteName: 'Gemini Omni Flash',
      images: [
        {
          url: 'https://omniflashai.io/logo-v2.png',
          width: 1200,
          height: 630,
          alt: copy.title,
        }
      ],
      locale: locale === 'ar' ? 'ar_SA' : locale === 'ja' ? 'ja_JP' : locale === 'ru' ? 'ru_RU' : locale === 'es' ? 'es_ES' : locale === 'zh-CN' ? 'zh_CN' : locale === 'de' ? 'de_DE' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: ['https://omniflashai.io/logo-v2.png']
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function GeminiOmniFlashVideoGeneratorPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const prefix = locale === 'en' ? '' : `/${locale}`
  const copy = pageCopy[locale as SupportedLocale] ?? pageCopy.en

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: copy.title,
    description: copy.description,
    url: `https://omniflashai.io${prefix}/gemini-omni-flash-video-generator`,
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Gemini Omni Flash Video Generator',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: copy.description,
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
        <section className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-background to-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>{copy.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                {copy.heroTitle}
              </h1>

              <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-4">
                {copy.heroLead}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {copy.heroSublead}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  asChild
                >
                  <Link href={`${prefix}/gemini-omni-flash-text-to-video`}>
                    <Play className="w-5 h-5 mr-2" />
                    {copy.primaryCta}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6"
                  asChild
                >
                  <Link href={`${prefix}/pricing`}>
                    {copy.secondaryCta}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {copy.whyTitle}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {copy.whyCards.map((card) => (
                <div key={card.title} className="p-6 rounded-xl border border-border bg-card">
                  <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                  <p className="text-muted-foreground">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {copy.featuresTitle}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {copy.features.map((feature) => (
                <div key={feature.title} className="p-6 rounded-xl border border-border bg-background">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {feature.href.includes('image') ? <ImageIcon className="w-6 h-6" /> : <Film className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-5">{feature.description}</p>
                  <Button asChild variant="outline">
                    <Link href={`${prefix}${feature.href}`}>{feature.title}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {copy.stepsTitle}
              </h2>
            </div>

            <div className="space-y-4">
              {copy.steps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-xl border border-border bg-card p-5 text-left">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-lg text-foreground">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href={`${prefix}/gemini-omni-flash-text-to-video`}>
                  <Play className="w-5 h-5 mr-2" />
                  {copy.primaryCta}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link href={`${prefix}/faq`}>
                  FAQ
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
