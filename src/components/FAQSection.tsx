'use client';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';

interface FAQ {
  question: string;
  answer: string;
}

export const FAQSection = () => {
  const { t } = useLanguage();

  const faqs: FAQ[] = [
    {
      question: t('faq.questions.0.question'),
      answer: t('faq.questions.0.answer'),
    },
    {
      question: t('faq.questions.1.question'),
      answer: t('faq.questions.1.answer'),
    },
    {
      question: t('faq.questions.2.question'),
      answer: t('faq.questions.2.answer'),
    },
    {
      question: t('faq.questions.3.question'),
      answer: t('faq.questions.3.answer'),
    },
    {
      question: t('faq.questions.4.question'),
      answer: t('faq.questions.4.answer'),
    },
    {
      question: t('faq.questions.5.question'),
      answer: t('faq.questions.5.answer'),
    },
    {
      question: t('faq.questions.6.question'),
      answer: t('faq.questions.6.answer'),
    },
    {
      question: t('faq.questions.7.question'),
      answer: t('faq.questions.7.answer'),
    },
    {
      question: t('faq.questions.8.question'),
      answer: t('faq.questions.8.answer'),
    },
  ];

  return (
    <Card variant="gradient" noHover className="border-blue-500/20 w-full relative overflow-hidden">
      {/* Patrón decorativo de fondo - puntos */}
      <div className="absolute inset-0 pointer-events-none z-0" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.15'%3E%3Ccircle cx='16' cy='16' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
             backgroundSize: '32px 32px'
           }}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none z-0"></div>
      <CardHeader className="relative z-10">
        <p className="text-sm font-medium uppercase tracking-[0.4em] text-slate-300 mb-4 text-center">
          {t('faq.title')}
        </p>
        <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl lg:text-5xl text-center">
          {t('faq.heading')}
        </h2>
        <CardDescription className="text-center">
          {t('faq.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="rounded-lg border border-white/15 bg-white/[0.05] px-4 transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.08] border-b-0"
            >
              <AccordionTrigger className="text-base font-semibold text-slate-50 hover:no-underline sm:text-lg data-[state=open]:text-cyan-300">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-200 sm:text-base pt-2 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

