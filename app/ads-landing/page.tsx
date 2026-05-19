import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Gemini Omni Flash AI Video Generator | Prompt and Reference Video Drafts',
  description: 'Prepare Gemini Omni Flash-ready prompts, reference images, and reviewable AI video drafts while separating confirmed model updates from unverified claims.',
  robots: {
    index: false,
    follow: false,
    // Note: This page is set to noindex for SEO reasons, but it's still included in sitemap
    // so search engines are aware of its existence
  },
  openGraph: {
    title: 'Gemini Omni Flash AI Video Generator | Prompt and Reference Video Drafts',
    description: 'Prepare Gemini Omni Flash-ready prompts, reference images, and reviewable AI video drafts while separating confirmed model updates from unverified claims.',
    url: 'https://omniflashai.io/ads-landing',
    siteName: 'Gemini Omni Flash',
    images: [
      {
        url: 'https://omniflashai.io/logo-v2.png',
        width: 1200,
        height: 630,
        alt: 'Gemini Omni Flash Video Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gemini Omni Flash AI Video Generator | Prompt and Reference Video Drafts',
    description: 'Prepare Gemini Omni Flash-ready prompts, reference images, and reviewable AI video drafts while separating confirmed model updates from unverified claims.',
    images: ['https://omniflashai.io/logo-v2.png'],
  },
  alternates: {
    canonical: 'https://omniflashai.io/ads-landing',
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
              <span className="text-xl font-bold text-primary">omniflashai.io</span>
            </div>
            <Link href="/gemini-omni-flash-text-to-video">
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
            Build Gemini Omni Flash-Ready Video Drafts Before Official Details Settle
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Organize prompts, reference images, and shot notes into a repeatable workflow for AI video drafts. Keep producing while Gemini Omni Flash updates, specs, and access paths continue to evolve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/gemini-omni-flash-text-to-video">
              <Button size="lg" className="w-full sm:w-auto">
                Build a Video Draft
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Workflow Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Teams Use This Gemini Omni Flash Workflow
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Structured Prompt Briefs</h3>
              <p className="text-muted-foreground">
                Convert rough ideas into layered scene notes covering subject, camera, motion, pacing, and continuity.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Reference-Led Drafts</h3>
              <p className="text-muted-foreground">
                Use product photos, style frames, and visual samples to anchor the draft before testing motion direction.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Release-Aware Planning</h3>
              <p className="text-muted-foreground">
                Separate confirmed updates from assumptions so your pages and workflows do not depend on unsupported specs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What the Workflow Gives You
          </h2>
          <div className="space-y-4">
            {[
              'Reusable prompt structures for future model access',
              'Reference image workflows for clearer visual direction',
              'Shot notes for camera, motion, and pacing',
              'Draft generation for review and comparison',
              'Release-watch positioning that avoids overclaiming',
              'Creative iteration records your team can reuse',
              'A practical bridge between current tools and future Gemini Omni Flash updates',
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
            Ready to Build a Gemini Omni Flash-Ready Workflow?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start with a prompt brief or reference image, generate a draft, and improve the creative notes before the next version.
          </p>
          <Link href="/gemini-omni-flash-text-to-video">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start a Draft
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground text-center">
            omniflashai.io is an independent Gemini Omni Flash AI video generation tool site. We are not affiliated with Google, Google DeepMind, OpenAI, or any official Sora products. All trademarks belong to their respective owners.
          </p>
        </div>
      </section>
    </main>
  )
}

