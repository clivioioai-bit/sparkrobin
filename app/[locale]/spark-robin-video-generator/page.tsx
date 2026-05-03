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
    title: 'Spark Robin Workflow Lab | Text, Image, and Prompt Systems',
    description: 'Track Spark Robin updates, structure reusable prompts, and create text-to-video or image-to-video drafts your team can review, compare, and improve.',
    badge: 'Release watch + video workflow',
    heroTitle: 'Prepare Your Spark Robin Video Workflow Before the Hype Catches Up',
    heroLead: 'Turn ideas, references, and shot notes into reviewable AI video drafts.',
    heroSublead: 'Use this workspace to separate confirmed model news from speculation while keeping production moving.',
    primaryCta: 'Build a Draft',
    secondaryCta: 'View Pricing',
    whyTitle: 'Why teams use this Spark Robin workflow',
    whyCards: [
      {
        title: 'Prompt systems for faster learning',
        description: 'Turn loose ideas into structured briefs that preserve subject, camera, motion, pacing, and continuity.'
      },
      {
        title: 'Image-led drafts for clearer direction',
        description: 'Use references to anchor composition and style before testing motion, framing, and pacing.'
      },
      {
        title: 'Release-aware SEO and content planning',
        description: 'Track what Google has actually confirmed and avoid building pages around unsupported Spark Robin specs.'
      },
      {
        title: 'Review loops instead of one-off renders',
        description: 'Compare drafts against the brief, keep what worked, and improve the next prompt with less guesswork.'
      }
    ],
    featuresTitle: 'Choose a starting point',
    features: [
      {
        title: 'Text Prompt Lab',
        description: 'Convert rough ideas into layered scene prompts and generate draft videos for review.',
        href: '/spark-robin-text-to-video'
      },
      {
        title: 'Reference Image Lab',
        description: 'Start from a product photo, still frame, or visual concept and test motion direction.',
        href: '/spark-robin-image-to-video'
      }
    ],
    stepsTitle: 'How it works',
    steps: [
      'Start with a text idea or visual reference.',
      'Add shot notes for camera, motion, pacing, and continuity.',
      'Generate a draft, review it against the brief, and refine the next version.'
    ]
  },
  ar: {
    title: 'مولد فيديو Spark Robin | النص والصورة وسير عمل الفيديو بالذكاء الاصطناعي',
    description: 'استخدم مولد فيديو Spark Robin لإنشاء فيديو بالذكاء الاصطناعي من النص أو الصورة مع مخرجات سريعة ونظيفة وسير عمل مرن للحملات.',
    badge: 'سير عمل مرن لفيديو AI',
    heroTitle: 'مولد فيديو Spark Robin لفرق المحتوى الحديثة',
    heroLead: 'أنشئ فيديوهات جاهزة للحملات من النصوص والصور والتوجيه الإبداعي.',
    heroSublead: 'استخدم سير عمل Spark Robin للإعلانات وفيديوهات المنتجات والمقاطع الاجتماعية وسرد العلامة التجارية.',
    primaryCta: 'ابدأ الإنشاء',
    secondaryCta: 'عرض الأسعار',
    whyTitle: 'لماذا تستخدم الفرق مولد فيديو Spark Robin هذا',
    whyCards: [
      { title: 'النص إلى فيديو لابتكار سريع', description: 'حوّل النصوص إلى مفاهيم فيديو جاهزة عندما تحتاج إلى سرعة وحركة وتوجيه واضح للمشهد.' },
      { title: 'الصورة إلى فيديو لأصول المنتج والعلامة', description: 'حوّل الصور الثابتة إلى مقاطع جاهزة للإعلانات لصفحات المنتجات والإطلاقات والنشر الاجتماعي.' },
      { title: 'مخرجات أنظف للاستخدام التسويقي الحقيقي', description: 'أنشئ أصولًا إبداعية أسهل للمراجعة والتكرار والنشر عبر الحملات.' },
      { title: 'مصمم لاختبار أسرع وتكرار أسهل', description: 'انتقل من الفكرة إلى عدة نسخ فيديو دون الاعتماد على دورة إنتاج كاملة.' }
    ],
    featuresTitle: 'اختر سير العمل المناسب لمشروعك',
    features: [
      { title: 'Spark Robin من النص إلى الفيديو', description: 'أنشئ فيديوهات AI من النصوص للإعلانات وشرح المنتجات والمحتوى الاجتماعي.', href: '/spark-robin-text-to-video' },
      { title: 'Spark Robin من الصورة إلى الفيديو', description: 'ارفع الصور وحولها إلى فيديوهات متحركة بحركة أقوى واستمرارية أفضل للمشهد.', href: '/spark-robin-image-to-video' }
    ],
    stepsTitle: 'كيف يعمل',
    steps: [
      'اختر النص إلى فيديو أو الصورة إلى فيديو حسب نوع الإدخال.',
      'حدد الأسلوب ونسبة الأبعاد وتفضيلات الإخراج.',
      'أنشئ الفيديو وراجعه ثم صدّره للحملات أو الصفحات أو القنوات الاجتماعية.'
    ]
  },
  ja: {
    title: 'Spark Robin 動画生成 | テキスト・画像・AI動画ワークフロー',
    description: 'Spark Robin 動画生成を使って、テキストから動画、画像から動画、キャンペーン向けのAI動画を作成。高速出力、きれいな書き出し、柔軟な制作フローに対応。',
    badge: '柔軟なAI動画ワークフロー',
    heroTitle: '現代のコンテンツチーム向け Spark Robin 動画生成',
    heroLead: 'プロンプト、画像、クリエイティブ指示からキャンペーン向け動画を作成します。',
    heroSublead: '広告、商品動画、SNSクリップ、ブランドストーリーに Spark Robin ワークフローを活用できます。',
    primaryCta: '作成を始める',
    secondaryCta: '料金を見る',
    whyTitle: 'この Spark Robin 動画生成が選ばれる理由',
    whyCards: [
      { title: '高速な発想向けテキストから動画', description: 'スピード、動き、明確なシーン設計が必要なときに、プロンプトから完成度の高い動画案を作成します。' },
      { title: '商品・ブランド素材向け画像から動画', description: '静止画像を、商品ページや告知、SNS配信用の広告向け動画に変換できます。' },
      { title: '実運用しやすいクリーンな書き出し', description: 'レビュー、改善、公開がしやすい動画アセットを作成できます。' },
      { title: 'より速い検証と反復に最適', description: 'フル制作体制に頼らず、アイデアから複数の動画バリエーションまで素早く進められます。' }
    ],
    featuresTitle: 'プロジェクトに合うワークフローを選択',
    features: [
      { title: 'Spark Robin テキストから動画', description: '広告、商品紹介、SNS向けに、プロンプトからAI動画を生成します。', href: '/spark-robin-text-to-video' },
      { title: 'Spark Robin 画像から動画', description: '画像をアップロードし、より自然な動きとシーンのつながりを持つ映像に変換します。', href: '/spark-robin-image-to-video' }
    ],
    stepsTitle: '使い方',
    steps: [
      '入力内容に応じてテキストから動画か画像から動画を選びます。',
      'スタイル、アスペクト比、出力設定を調整します。',
      '生成後に確認し、キャンペーンやLP、SNS向けに書き出します。'
    ]
  },
  ru: {
    title: 'Spark Robin Видео-генератор | Текст, изображение и AI-видео',
    description: 'Используйте Spark Robin видео-генератор для text to video, image to video и создания AI-видео для кампаний. Быстрый результат, чистый экспорт и гибкие сценарии.',
    badge: 'Гибкие AI-видео сценарии',
    heroTitle: 'Spark Robin Видео-генератор для современных команд контента',
    heroLead: 'Создавайте AI-видео для кампаний из текста, изображений и креативных идей.',
    heroSublead: 'Подходит для рекламы, продуктовых роликов, соцсетей и бренд-сторителлинга.',
    primaryCta: 'Начать создание',
    secondaryCta: 'Посмотреть цены',
    whyTitle: 'Почему команды выбирают этот Spark Robin видео-генератор',
    whyCards: [
      { title: 'Text to video для быстрого продакшна', description: 'Превращайте промпты в готовые видео-концепты, когда важны скорость, движение и понятная постановка сцены.' },
      { title: 'Image to video для продукта и бренда', description: 'Анимируйте изображения в ролики для запусков, карточек товара и соцсетей.' },
      { title: 'Чистый экспорт для реального маркетинга', description: 'Собирайте креативы, которые проще проверять, дорабатывать и публиковать в кампаниях.' },
      { title: 'Быстрее тестировать и итерировать', description: 'Переходите от идеи к нескольким версиям видео без полного продакшн-цикла.' }
    ],
    featuresTitle: 'Выберите подходящий режим для проекта',
    features: [
      { title: 'Spark Robin Текст в Видео', description: 'Создавайте AI-видео из текста для рекламы, продуктовых обзоров и соцсетей.', href: '/spark-robin-text-to-video' },
      { title: 'Spark Robin Изображение в Видео', description: 'Загружайте изображения и превращайте их в видео с более сильным движением и лучшей связностью сцен.', href: '/spark-robin-image-to-video' }
    ],
    stepsTitle: 'Как это работает',
    steps: [
      'Выберите text to video или image to video в зависимости от исходных материалов.',
      'Настройте стиль, формат кадра и параметры результата.',
      'Сгенерируйте, проверьте и экспортируйте ролик для кампаний, лендингов или соцсетей.'
    ]
  },
  es: {
    title: 'Generador de Video Spark Robin | Texto, imagen y flujos de video AI',
    description: 'Usa el generador de video Spark Robin para texto a video, imagen a video y creación de video AI lista para campañas. Salida rápida, exportaciones limpias y flujos flexibles.',
    badge: 'Flujos flexibles de video AI',
    heroTitle: 'Generador de Video Spark Robin para equipos modernos de contenido',
    heroLead: 'Crea videos listos para campañas a partir de prompts, imágenes y dirección creativa.',
    heroSublead: 'Usa Spark Robin para anuncios, videos de producto, clips sociales y storytelling de marca.',
    primaryCta: 'Empezar a crear',
    secondaryCta: 'Ver precios',
    whyTitle: 'Por qué los equipos usan este generador de video Spark Robin',
    whyCards: [
      { title: 'Texto a video para ideación rápida', description: 'Convierte prompts en conceptos de video pulidos cuando necesitas velocidad, movimiento y una dirección de escena clara.' },
      { title: 'Imagen a video para activos de producto y marca', description: 'Anima imágenes fijas en clips listos para anuncios, lanzamientos, páginas de producto y redes sociales.' },
      { title: 'Exportaciones más limpias para marketing real', description: 'Crea activos de video más fáciles de revisar, iterar y publicar en campañas.' },
      { title: 'Pensado para probar e iterar más rápido', description: 'Pasa de una idea a varias versiones de video sin depender de un ciclo completo de producción.' }
    ],
    featuresTitle: 'Elige el flujo adecuado para tu proyecto',
    features: [
      { title: 'Spark Robin Texto a Video', description: 'Genera videos AI desde prompts para anuncios, productos y contenido social.', href: '/spark-robin-text-to-video' },
      { title: 'Spark Robin Imagen a Video', description: 'Sube imágenes y conviértelas en visuales en movimiento con mejor dinámica y continuidad de escena.', href: '/spark-robin-image-to-video' }
    ],
    stepsTitle: 'Cómo funciona',
    steps: [
      'Elige texto a video o imagen a video según tu material de entrada.',
      'Configura estilo, proporción y preferencias de salida.',
      'Genera, revisa y exporta clips para campañas, landing pages o redes sociales.'
    ]
  },
  'zh-CN': {
    title: 'Spark Robin 工作流实验室 | 文本、图片与 Prompt 系统',
    description: '跟踪 Spark Robin 更新，整理可复用提示词，并用文本或图片生成可评审的视频草稿。',
    badge: '发布观察 + 视频工作流',
    heroTitle: '在 Spark Robin 热度到来前，先准备好视频工作流',
    heroLead: '把创意、参考图和镜头说明整理成可评审的 AI 视频草稿。',
    heroSublead: '区分官方确认与市场传闻，同时保持内容生产不断档。',
    primaryCta: '创建草稿',
    secondaryCta: '查看价格',
    whyTitle: '为什么团队需要这个 Spark Robin 工作流',
    whyCards: [
      { title: 'Prompt 系统，而不是临时发挥', description: '把想法拆成主体、镜头、动作、节奏和连续性说明，方便复用和比较。' },
      { title: '参考图驱动的视频草稿', description: '用产品图、样张或视觉帧作为锚点，再测试运动、构图和节奏。' },
      { title: '面向发布观察的 SEO', description: '把 Google 已确认信息和 Spark Robin 传闻分开表达，减少过度承诺。' },
      { title: '可复盘的创意迭代', description: '每次生成都能对照 brief 评审，记录有效镜头语言，再进入下一版。' }
    ],
    featuresTitle: '选择你的起点',
    features: [
      { title: '文本 Prompt 实验室', description: '把粗略想法改写成分层场景提示词，并生成可评审的视频草稿。', href: '/spark-robin-text-to-video' },
      { title: '参考图实验室', description: '从产品图、视觉帧或概念图出发，测试镜头运动和画面节奏。', href: '/spark-robin-image-to-video' }
    ],
    stepsTitle: '使用方式',
    steps: [
      '从文本想法或视觉参考开始。',
      '补充镜头、运动、节奏和连续性说明。',
      '生成草稿，对照 brief 评审，再优化下一版。'
    ]
  },
  de: {
    title: 'Spark Robin Videogenerator | Text, Bild und AI-Video-Workflows',
    description: 'Nutzen Sie den Spark Robin Videogenerator für Text zu Video, Bild zu Video und kampagnentaugliche AI-Videoproduktion. Schnelle Ausgabe, saubere Exporte und flexible Workflows.',
    badge: 'Flexible AI-Video-Workflows',
    heroTitle: 'Spark Robin Videogenerator für moderne Content-Teams',
    heroLead: 'Erstellen Sie kampagnentaugliche AI-Videos aus Prompts, Bildern und kreativen Vorgaben.',
    heroSublead: 'Geeignet für Ads, Produktvideos, Social Clips und Brand Storytelling.',
    primaryCta: 'Jetzt erstellen',
    secondaryCta: 'Preise ansehen',
    whyTitle: 'Warum Teams diesen Spark Robin Videogenerator nutzen',
    whyCards: [
      { title: 'Text zu Video für schnelle Ideenfindung', description: 'Verwandeln Sie Prompts in ausgearbeitete Videokonzepte, wenn Geschwindigkeit, Bewegung und klare Szenenführung wichtig sind.' },
      { title: 'Bild zu Video für Produkt- und Markenassets', description: 'Animieren Sie statische Bilder zu Clips für Launches, Produktseiten und Social Distribution.' },
      { title: 'Sauberere Exporte für echtes Marketing', description: 'Erstellen Sie Assets, die leichter zu prüfen, zu iterieren und in Kampagnen zu veröffentlichen sind.' },
      { title: 'Für schnelleres Testen und Iterieren gebaut', description: 'Gehen Sie von einer Idee zu mehreren Video-Varianten, ohne einen vollständigen Produktionszyklus zu benötigen.' }
    ],
    featuresTitle: 'Wählen Sie den passenden Workflow für Ihr Projekt',
    features: [
      { title: 'Spark Robin Text zu Video', description: 'Erzeugen Sie AI-Videos aus Prompts für Ads, Produkt-Erklärungen und Social Content.', href: '/spark-robin-text-to-video' },
      { title: 'Spark Robin Bild zu Video', description: 'Laden Sie Bilder hoch und verwandeln Sie sie in bewegte Visuals mit stärkerer Dynamik und besserer Szenenkontinuität.', href: '/spark-robin-image-to-video' }
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

  const baseUrl = 'https://sparkrobin.app'
  const prefix = locale === 'en' ? '' : `/${locale}`
  const copy = pageCopy[locale as SupportedLocale] ?? pageCopy.en

  return {
    title: copy.title,
    description: copy.description,
    alternates: generateHreflangAlternates('/spark-robin-video-generator', locale),
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `${baseUrl}${prefix}/spark-robin-video-generator`,
      siteName: 'Spark Robin',
      images: [
        {
          url: 'https://sparkrobin.app/logo-v2.png',
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
      images: ['https://sparkrobin.app/logo-v2.png']
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function SparkRobinVideoGeneratorPage({
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
    url: `https://sparkrobin.app${prefix}/spark-robin-video-generator`,
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Spark Robin Video Generator',
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
                  <Link href={`${prefix}/spark-robin-text-to-video`}>
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
                <Link href={`${prefix}/spark-robin-text-to-video`}>
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
