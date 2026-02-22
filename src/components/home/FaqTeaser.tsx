"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

const FaqTeaser = () => {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');

  const faqs = [
    {
      id: 'item-1',
      question: t('questions.whatMakesDifferent.question'),
      answer: t('questions.whatMakesDifferent.answer')
    },
    {
      id: 'item-2',
      question: t('questions.characterConsistency.question'),
      answer: t('questions.characterConsistency.answer')
    },
    {
      id: 'item-3',
      question: t('questions.videosLongerThan10s.question'),
      answer: t('questions.videosLongerThan10s.answer')
    },
    {
      id: 'item-5',
      question: t('questions.commercialUse.question'),
      answer: t('questions.commercialUse.answer')
    },
    {
      id: 'item-6',
      question: t('questions.watermarks.question'),
      answer: t('questions.watermarks.answer')
    },
    {
      id: 'item-10',
      question: t('questions.officialModel.question'),
      answer: t('questions.officialModel.answer')
    },
    {
      id: 'item-11',
      question: t('questions.25SecondVideos.question'),
      answer: t('questions.25SecondVideos.answer')
    },
    {
      id: 'item-7',
      question: t('questions.paymentSafe.question'),
      answer: t('questions.paymentSafe.answer')
    },
    {
      id: 'item-8',
      question: t('questions.hiddenCharges.question'),
      answer: t('questions.hiddenCharges.answer')
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#030712]">
      {/* Subtle top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg text-white/40 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div suppressHydrationWarning>
          <Accordion type="single" collapsible className="w-full space-y-1.5">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border border-white/[0.06] rounded-xl px-5 sm:px-6 py-0.5 data-[state=open]:bg-white/[0.02] transition-colors"
              >
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-white/80 hover:text-white hover:no-underline rtl:text-right py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-white/35 pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10 sm:mt-12">
          <p className="text-sm text-white/30 mb-5">
            {tCommon('haveMoreQuestions')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15]"
              asChild
            >
              <Link href="/faq">
                {t('viewAllFaqs')}
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 rtl:ml-0 rtl:mr-1.5" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
              asChild
            >
              <a href="mailto:support@sora3ai.io">
                {t('contactSupport')}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqTeaser;
