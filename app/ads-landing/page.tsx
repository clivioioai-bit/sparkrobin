import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Veo 4 Video Generator | Ad-Ready Content Platform',
  description: 'Transform ideas into polished Veo 4 video clips perfect for ads and brand campaigns. Our Veo 4 platform generates professional videos without watermarks. Start creating Veo 4 content for your campaigns today.',
  robots: {
    index: false,
    follow: false,
    // Note: This page is set to noindex for SEO reasons, but it's still included in sitemap
    // so search engines are aware of its existence
  },
  openGraph: {
    title: 'Veo 4 Video Generator | Ad-Ready Content Platform',
    description: 'Transform ideas into polished Veo 4 video clips perfect for ads and brand campaigns. Our Veo 4 platform generates professional videos without watermarks.',
    url: 'https://veo4video.io/ads-landing',
    siteName: 'Veo4',
    images: [
      {
        url: 'https://veo4video.io/logo-v2.png',
        width: 1200,
        height: 630,
        alt: 'Veo 4 Video Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veo 4 Video Generator | Ad-Ready Content Platform',
    description: 'Transform ideas into polished Veo 4 video clips perfect for ads and brand campaigns.',
    images: ['https://veo4video.io/logo-v2.png'],
  },
  alternates: {
    canonical: 'https://veo4video.io/ads-landing',
  },
}

export default function AdsLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">veo4video.io</span>
            </div>
            <Link href="/veo4-text-to-video">
              <Button variant="outline" size="sm">
                Start Creating
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Turn Ideas Into Polished Veo 4 Clips Ready for Ads
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform concepts into professional Veo 4 video content without any branding on top. Our Veo 4 platform generates ad-ready clips perfect for marketing campaigns, brand storytelling, and social media. Start creating Veo 4 videos today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/veo4-text-to-video">
              <Button size="lg" className="w-full sm:w-auto">
                Create Veo 4 Videos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Veo 4 Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Marketing Teams Choose Veo 4
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Veo 4 Text-to-Video</h3>
              <p className="text-muted-foreground">
                Transform ideas into polished Veo 4 clips ready for ads. Our Veo 4 text-to-video generator produces professional content without watermarks, perfect for campaigns.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Veo 4 Image-to-Video</h3>
              <p className="text-muted-foreground">
                Animate photos into professional Veo 4 video content. Veo 4 image-to-video tool creates dynamic sequences ideal for product launches and brand content.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Veo 4 Fast Production</h3>
              <p className="text-muted-foreground">
                Generate polished Veo 4 campaign clips quickly with flexible prompt control, strong visual consistency, and export-ready output for ads and brand content.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Veo 4 Delivers
          </h2>
          <div className="space-y-4">
            {[
              'Veo 4 videos with full commercial licensing',
              'Veo 4 exports without any platform watermarks',
              'Veo 4 fast generation for campaign timelines',
              'Veo 4 HD and 4K quality output options',
              'Veo 4 character consistency across scenes',
              'Veo 4 extended 25-30 second video support',
              'Veo 4 integrated audio synchronization',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Campaigns with Veo 4?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start creating Veo 4 videos with free credits. Upgrade your Veo 4 plan when you need more capacity for campaigns.
          </p>
          <Link href="/veo4-text-to-video">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Creating Veo 4
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground text-center">
            veo4video.io is an independent platform specializing in Veo 4 video generation. We leverage advanced Veo 4 technology to produce professional content. veo4video.io is not affiliated with OpenAI, Google or any official Sora products. All trademarks belong to their respective owners.
          </p>
        </div>
      </section>
    </main>
  )
}



