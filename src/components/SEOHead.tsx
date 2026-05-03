"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  noindex?: boolean;
  keywords?: string;
  image?: string;
}

const SEOHead = ({ 
  title = "Spark Robin Workflow Lab | Release Watch and AI Video Drafts",
  description = "Track Spark Robin updates, structure reusable prompts, and create reviewable AI video drafts from text or images.",
  ogTitle = "Spark Robin Workflow Lab | Release Watch and AI Video Drafts",
  ogDescription = "Track Spark Robin updates, structure reusable prompts, and create reviewable AI video drafts from text or images.",
  canonical,
  noindex = false,
  keywords = "Spark Robin release watch, AI video prompt workflow, text to video drafts, image to video references, AI video planning, reusable prompts",
  image = "https://sparkrobinai.io/logo-v2.png"
}: SEOHeadProps) => {
  const pathname = usePathname();
  const baseUrl = "https://sparkrobinai.io"; // Replace with your actual domain
  const currentUrl = canonical || `${baseUrl}${pathname}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', keywords);
      document.head.appendChild(metaKeywords);
    }

    // Add author meta tag
    let metaAuthor = document.querySelector('meta[name="author"]');
    if (!metaAuthor) {
      metaAuthor = document.createElement('meta');
      metaAuthor.setAttribute('name', 'author');
      metaAuthor.setAttribute('content', 'Spark Robin');
      document.head.appendChild(metaAuthor);
    }

    // Add Google Site Verification meta tag
    let googleVerification = document.querySelector('meta[name="google-site-verification"]');
    if (!googleVerification) {
      googleVerification = document.createElement('meta');
      googleVerification.setAttribute('name', 'google-site-verification');
      googleVerification.setAttribute('content', 'RXG1GciT_6Lk-VckDXsTp0wkUZYZfI0RDWy-9D_P-0E');
      document.head.appendChild(googleVerification);
    }

    // Update or create canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', currentUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', currentUrl);
      document.head.appendChild(canonicalLink);
    }

    // Update or create robots meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';
    if (metaRobots) {
      metaRobots.setAttribute('content', robotsContent);
    } else {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      metaRobots.setAttribute('content', robotsContent);
      document.head.appendChild(metaRobots);
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (ogTag) {
        ogTag.setAttribute('content', content);
      } else {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        ogTag.setAttribute('content', content);
        document.head.appendChild(ogTag);
      }
    };

    updateOGTag('og:title', ogTitle);
    updateOGTag('og:description', ogDescription);
    updateOGTag('og:url', currentUrl);
    updateOGTag('og:type', 'website');
    updateOGTag('og:image', image);
    updateOGTag('og:image:width', '1200');
    updateOGTag('og:image:height', '630');
    updateOGTag('og:site_name', 'Spark Robin');
    updateOGTag('og:locale', 'en_US');

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`);
      if (twitterTag) {
        twitterTag.setAttribute('content', content);
      } else {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', name);
        twitterTag.setAttribute('content', content);
        document.head.appendChild(twitterTag);
      }
    };

    updateTwitterTag('twitter:title', ogTitle);
    updateTwitterTag('twitter:description', ogDescription);
    updateTwitterTag('twitter:card', 'summary_large_image');
    updateTwitterTag('twitter:image', image);
    updateTwitterTag('twitter:site', '@sora3aiteam');
    updateTwitterTag('twitter:creator', '@sora3aiteam');

    // Add structured data for SEO
    const addStructuredData = () => {
      const existingScript = document.querySelector('#structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Spark Robin",
        "alternateName": ["Spark Robin", "sparkrobinai.io", "AI Video Ads", "AI Video Generator"],
        "description": "Track Spark Robin updates, structure reusable prompts, and create reviewable AI video drafts from text or images.",
        "url": baseUrl,
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "19",
          "priceCurrency": "USD",
          "priceValidUntil": "2025-12-31",
          "availability": "https://schema.org/InStock",
          "description": "AI video workflow and draft generation subscription"
        },
        "creator": {
          "@type": "Organization",
          "name": "Spark Robin",
          "url": baseUrl,
          "logo": `${baseUrl}/logo-v2.png`
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250",
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "Spark Robin release-watch guidance",
          "Reusable AI video prompt briefs",
          "Reference-led image to video drafts",
          "Text to video draft workflow",
          "Shot notes and continuity prompts",
          "Creative review and iteration"
        ],
        "screenshot": `${baseUrl}/placeholder.svg`,
        "video": {
          "@type": "VideoObject",
          "name": "Spark Robin AI Video Workflow Tutorial",
          "description": "Learn how to structure prompts, references, and draft reviews for Spark Robin-ready AI video workflows",
          "thumbnailUrl": `${baseUrl}/placeholder.svg`,
          "uploadDate": "2025-01-01"
        },
        "keywords": keywords
      };

      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    };

    addStructuredData();

  }, [title, description, ogTitle, ogDescription, currentUrl, noindex, keywords, image, baseUrl]);

  return null; // This component doesn't render anything
};

export default SEOHead;
