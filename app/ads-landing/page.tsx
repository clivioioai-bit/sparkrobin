import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sora 3 Video Generator | Ad-Ready Content Platform',
  description: 'Transform ideas into polished Sora 3 video clips perfect for ads and brand campaigns. Our Sora 3 platform generates professional videos without watermarks. Start creating Sora 3 content for your campaigns today.',
  robots: {
    index: false,
    follow: false,
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
              <span className="text-xl font-bold text-primary">sora3ai.io</span>
            </div>
            <Link href="/text-to-video">
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
            Turn Ideas Into Polished Sora 3 Clips Ready for Ads
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform concepts into professional Sora 3 video content without any branding on top. Our Sora 3 platform generates ad-ready clips perfect for marketing campaigns, brand storytelling, and social media. Start creating Sora 3 videos today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/text-to-video">
              <Button size="lg" className="w-full sm:w-auto">
                Create Sora 3 Videos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Sora 3 Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Marketing Teams Choose Sora 3
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Sora 3 Text-to-Video</h3>
              <p className="text-muted-foreground">
                Transform ideas into polished Sora 3 clips ready for ads. Our Sora 3 text-to-video generator produces professional content without watermarks, perfect for campaigns.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Sora 3 Image-to-Video</h3>
              <p className="text-muted-foreground">
                Animate photos into professional Sora 3 video content. Sora 3 image-to-video tool creates dynamic sequences ideal for product launches and brand content.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Sora 3 Storyboard</h3>
              <p className="text-muted-foreground">
                Build multi-scene Sora 3 narratives up to 25 seconds. Sora 3 Storyboard maintains character consistency across scenes for complete brand stories.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Sora 3 Delivers
          </h2>
          <div className="space-y-4">
            {[
              'Sora 3 videos with full commercial licensing',
              'Sora 3 exports without any platform watermarks',
              'Sora 3 fast generation for campaign timelines',
              'Sora 3 HD and 4K quality output options',
              'Sora 3 character consistency across scenes',
              'Sora 3 extended 25-30 second video support',
              'Sora 3 integrated audio synchronization',
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
            Ready to Build Campaigns with Sora 3?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start creating Sora 3 videos with free credits. Upgrade your Sora 3 plan when you need more capacity for campaigns.
          </p>
          <Link href="/text-to-video">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Creating Sora 3
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground text-center">
            sora3ai.io is an independent platform specializing in Sora 3 video generation. We leverage advanced Sora 3 technology to produce professional content. sora3ai.io is not affiliated with OpenAI, Google or any official Sora products. All trademarks belong to their respective owners.
          </p>
        </div>
      </section>
    </main>
  )
}






