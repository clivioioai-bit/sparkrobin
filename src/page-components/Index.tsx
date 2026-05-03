"use client";

import Hero from "@/components/home/Hero";
import DemoGallery from "@/components/home/DemoGallery";
import Sora3Capabilities from "@/components/home/Sora3Capabilities";
import HowItWorks from "@/components/home/HowItWorks";
import PricingSection from "@/components/home/PricingSection";
import FaqTeaser from "@/components/home/FaqTeaser";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import FadeInSection from "@/components/FadeInSection";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Spark Robin Workflow Lab | Release Watch and AI Video Drafts"
        description="Track Spark Robin updates, structure reusable prompts, and create reviewable AI video drafts from text or images."
        ogTitle="Spark Robin Workflow Lab | Release Watch and AI Video Drafts"
        ogDescription="Track Spark Robin updates, structure reusable prompts, and create reviewable AI video drafts from text or images."
        canonical="https://sparkrobinai.io/"
        keywords="Spark Robin release watch, AI video workflow, prompt briefs, reference image video, text to video drafts, image to video drafts"
      />
      <ScrollProgress />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Demo Gallery */}
      <FadeInSection delay={200}>
        <DemoGallery />
      </FadeInSection>
      
      {/* How It Works */}
      <FadeInSection delay={600}>
        <HowItWorks />
      </FadeInSection>
      
      {/* FAQ Teaser */}
      <FadeInSection delay={800}>
        <FaqTeaser />
      </FadeInSection>
      
      {/* Pricing Section */}
      <FadeInSection delay={1000}>
        <PricingSection />
      </FadeInSection>

      <Footer />
    </div>
  );
};

export default Index;
