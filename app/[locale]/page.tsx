"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Hero from '@/components/home/Hero'
import ToolsSection from '@/components/home/ToolsSection'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// 动态导入非关键组件，延迟加载以提升首屏性能
const DemoGallery = dynamic(() => import('@/components/home/DemoGallery'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const HowItWorks = dynamic(() => import('@/components/home/HowItWorks'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const PricingTeaser = dynamic(() => import('@/components/home/PricingTeaser'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const FaqTeaser = dynamic(() => import('@/components/home/FaqTeaser'), {
  loading: () => <div className="h-96" />,
  ssr: true
});
const Sora3Capabilities = dynamic(() => import('@/components/home/Sora3Capabilities'), {
  loading: () => <div className="h-96" />,
  ssr: true
});

function ErrorHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 检查 URL 中的错误参数
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');
    const hashParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.substring(1)) : null;
    const hashError = hashParams?.get('error');
    const hashErrorDescription = hashParams?.get('error_description');

    const isDatabaseError = 
      (error === 'server_error' && errorDescription?.includes('Database error saving new user')) ||
      (hashError === 'server_error' && hashErrorDescription?.includes('Database error saving new user'));

    if (isDatabaseError) {
      // 尝试修复：检查用户是否已登录但缺少 users 表记录
      const fixUserRecord = async () => {
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('🔧 Attempting to fix missing user record for:', session.user.email);
            
            // 检查 users 表中是否存在记录
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .single();

            // 如果用户不存在，尝试创建
            if (fetchError?.code === 'PGRST116' || !existingUser) {
              console.log('📝 Creating missing user record...');
              
              const { supabase: supabaseClient } = await import("@/lib/supabase");
              const { error: createError } = await supabaseClient
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || session.user.email,
                  subscription_plan: 'free',
                  subscription_status: 'active',
                  credits_balance: 3,
                  credits_total: 3,
                  credits_spent: 0,
                  credits_limit: 50,
                });

              if (createError) {
                console.error('❌ Failed to create user record:', createError);
                // 如果客户端创建失败，可能需要服务端 API
                try {
                  const response = await fetch('/api/users/fix-missing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.user.id }),
                  });
                  
                  if (!response.ok) {
                    console.error('❌ API fix also failed');
                  }
                } catch (apiError) {
                  console.error('❌ API fix request failed:', apiError);
                }
              } else {
                console.log('✅ User record created successfully');
              }
            }

            // 创建 user_subscriptions 记录（如果不存在）
            const { supabase: supabaseClient2 } = await import("@/lib/supabase");
            const { data: existingSub, error: subFetchError } = await supabaseClient2
              .from('user_subscriptions')
              .select('user_id')
              .eq('user_id', session.user.id)
              .single();

            if (subFetchError?.code === 'PGRST116' || !existingSub) {
              console.log('📝 Creating missing subscription record...');
              await supabaseClient2
                .from('user_subscriptions')
                .insert({ user_id: session.user.id });
            }

            // 清除 URL 中的错误参数并刷新
            const cleanUrl = window.location.pathname;
            router.replace(cleanUrl);
            
            // 刷新页面以重新加载用户数据
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } catch (error) {
          console.error('❌ Error fixing user record:', error);
        }
      };

      fixUserRecord();
    }
  }, [searchParams, router]);

  return null;
}

export default function HomePage() {

  useEffect(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Sora 3 Video Generator',
      alternateName: ['Sora 3 Generator', 'Sora 3 Video Creator', 'Sora3'],
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description: 'Transform ideas into polished Sora 3 video clips perfect for ads and brand campaigns. Our Sora 3 platform generates professional videos without watermarks, ideal for marketing teams and creators. Start creating Sora 3 content today.',
      url: 'https://sora3ai.io',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Sora 3 video generation with credits, paid plans available'
      },
      creator: {
        '@type': 'Organization',
        name: 'Sora3',
        url: 'https://sora3ai.io'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
        worstRating: '1'
      },
      featureList: [
        'Sora 3 text-to-video generation',
        'Sora 3 image-to-video conversion',
        'Sora 3 Storyboard builder for extended narratives',
        'Sora 3 multi-model generation pipeline',
        'Sora 3 character consistency across scenes',
        'Sora 3 extended 25-30 second videos',
        'Sora 3 ad-ready output formats',
        'Sora 3 vertical and horizontal layouts',
        'Sora 3 watermark-free exports',
        'Sora 3 campaign-ready video generation'
      ]
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://sora3ai.io'
        }
      ]
    }

    const videoJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Sora 3 Video Generator Demo - Create Ad-Ready Content',
      description: 'Discover how Sora3ai.io transforms concepts into polished Sora 3 video clips using advanced Sora 3 technology. Learn to create Sora 3 videos for text-to-video, image-to-video, and Sora 3 Storyboard narratives. Sora3ai.io is an independent Sora 3 platform.',
      thumbnailUrl: 'https://sora3ai.io/logo.png',
      uploadDate: '2024-01-01T00:00:00Z',
      contentUrl: 'https://sora3ai.io',
      embedUrl: 'https://sora3ai.io',
      duration: 'PT30S',
      publisher: {
        '@type': 'Organization',
        name: 'Sora3',
        logo: {
          '@type': 'ImageObject',
          url: 'https://sora3ai.io/logo.png'
        }
      }
    }

    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Does this platform use official Sora 3 technology?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We leverage advanced Sora 3 compatible technology within our generation pipeline. This enables immediate Sora 3 video creation without waiting for official access. Sora3ai.io is not affiliated with OpenAI or any official Sora products.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can I build 25-second Sora 3 videos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes — Sora 3 Storyboard enables 25-second Sora 3 multi-scene generation for complete brand narratives.'
          }
        },
        {
          '@type': 'Question',
          name: 'Do Sora 3 videos include watermarks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No — all Sora 3 exports are completely watermark-free. Premium Sora 3 plans ensure no platform branding on downloads.'
          }
        },
        {
          '@type': 'Question',
          name: 'How do I create Sora 3 videos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'To create Sora 3 videos, enter your prompt on sora3ai.io and generate. We support Sora 3 text-to-video, image-to-video, and Sora 3 Storyboard creation. All Sora 3 videos export without watermarks.'
          }
        }
      ]
    }

    const scripts = [
      { id: 'jsonld-software', data: jsonLd },
      { id: 'jsonld-breadcrumb', data: breadcrumbJsonLd },
      { id: 'jsonld-video', data: videoJsonLd },
      { id: 'jsonld-faq', data: faqJsonLd }
    ]

    // Defer JSON-LD scripts to reduce render blocking
    const loadScripts = () => {
      scripts.forEach(({ id, data }) => {
        if (document.getElementById(id)) return
        const script = document.createElement('script')
        script.id = id
        script.type = 'application/ld+json'
        script.textContent = JSON.stringify(data)
        script.defer = true
        document.head.appendChild(script)
      })
    }

    // Load after page is interactive
    if (document.readyState === 'complete') {
      loadScripts()
    } else {
      window.addEventListener('load', loadScripts, { once: true })
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>
      <Navigation />
      <main>
        <Hero />
        <ToolsSection />
        <Suspense fallback={<div className="h-96" />}>
          <Sora3Capabilities />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <DemoGallery />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <PricingTeaser />
        </Suspense>
        <Suspense fallback={<div className="h-96" />}>
          <FaqTeaser />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

