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
        title="Gemini Omni Flash AI Video Generator | Text to Video"
        description="Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects."
        ogTitle="Gemini Omni Flash AI Video Generator | Text to Video"
        ogDescription="Create AI videos with Gemini Omni Flash from text prompts or images for ads, social media, products, and creative projects."
        canonical="https://omniflashai.io/"
        keywords="gemini omni flash, gemini omni flash video generator, gemini omni flash text to video, gemini omni flash image to video, AI video generator"
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
