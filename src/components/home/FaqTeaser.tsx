"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
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
    <section className="py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <Card className="p-8">
          <div suppressHydrationWarning>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq) => (
                <AccordionItem 
                  key={faq.id} 
                  value={faq.id}
                  className="border border-border/50 rounded-lg px-6 py-2 data-[state=open]:bg-muted/50"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary rtl:text-right">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            {tCommon('haveMoreQuestions')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="outline"
              asChild
            >
              <Link href="/faq">
                {t('viewAllFaqs')}
                <ExternalLink className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              </Link>
            </Button>
            
            <Button 
              variant="ghost"
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