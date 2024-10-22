"use client"

import { useTranslation } from '@/app/i18n/client'
import { SiteWrapper } from '@/components/common/site-wrapper'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useLanguage } from '@/context/language'
import { useSearchParams } from 'next/navigation'
import { forwardRef, useEffect, useRef, useState } from 'react'

export default function Page() {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'other')
  const searchParams = useSearchParams()
  const questionParam = searchParams.get("spørgsmål")

  const [accordionValue, setAccordionValue] = useState<string>()

  const questionRefs = useRef<Array<HTMLDivElement | null>>([])

  const questions: { question: string, answer: string | React.ReactNode }[] = [
    {
      // TODO: add translation here
      question: 'Hvad kan brugerrollerne?',
      answer: <AnswerUserRoles />
    },
    {
      question: t('faq-page.question-format-import'),
      answer: <AnswerImportInventory />
    },
  ]

  const questionIndex = questions.findIndex(q => q.question == questionParam)

  useEffect(() => {
    if (questionParam) {
      if (questionRefs.current[questionIndex]) {
        setAccordionValue(`q-${questionIndex}`)
        questionRefs.current[questionIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'end'
        })
      } else {
        console.warn("no ref at index")
      }
    }
  }, [questionIndex, questionParam])

  return (
    <SiteWrapper
      title={t('faq-page.title')}
      description={t('faq-page.description')}>
      <div className='lg:w-1/2'>
        <Accordion type='single' value={accordionValue} onValueChange={(value) => setAccordionValue(value)} collapsible className='space-y-4'>
          {questions.map((q, i) => (
            <QandA
              key={i}
              // @ts-ignore
              ref={(el) => (questionRefs.current[i] = el)}
              question={q.question}
              answer={q.answer}
              index={i}
            />
          ))}
        </Accordion>
      </div>
    </SiteWrapper>
  )
}

const QandA = forwardRef<HTMLDivElement, { question: string, answer: string | React.ReactNode, index: number }>(function QandA({ question, answer, index }, ref) {
  return (
    <AccordionItem ref={ref} value={`q-${index}`}>
      <AccordionTrigger>{question}</AccordionTrigger>
      <AccordionContent>{answer}</AccordionContent>
    </AccordionItem>
  )
})

function AnswerImportInventory() {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'other')

  return (
    <div className='flex flex-col gap-4'>
      <p>
        {t('faq-page.to-import')}
      </p>
      <p>
        {t('faq-page.table-data')}
      </p>
      <ol className='space-y-2'>
        <li>
          <span className='font-semibold'>{t('faq-page.product-no')}</span>
          <span className=''>
            {t('faq-page.product-no-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.barcode')} </span>
          <span className=''>
            {t('faq-page.barcode-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.product-group')}</span>
          <span className='font-semibold'>Group </span>
          <span className=''>
            {t('faq-page.product-group-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.unit')} </span>
          <span>
            {t('faq-page.unit-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.text1')} </span>
          <span className=''>
            {t('faq-page.text1-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.text2')} </span>
          <span className=''>
            {t('faq-page.text2-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.text3')} </span>
          <span className=''>
            {t('faq-page.text3-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.cost-price')} </span>
          <span>
            {t('faq-page.cost-price-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.sales-price')} </span>
          <span>
            {t('faq-page.sales-price-criteria')}
          </span>
        </li>
        <li>
          <span className='font-semibold'>{t('faq-page.barred')} </span>
          <span>
            {t('faq-page.barred-criteria')}
          </span>
        </li>
      </ol>
    </div>
  )
}

function AnswerUserRoles() {
  return (
    <div className='flex flex-col gap-4'>
      <p>Brugerrollerne er fordelt på fem niveauer, med hver deres forskellige rettigheder. De fordeles således:</p>
      <ol className='space-y-2'>
        <li>
          <span className='font-semibold'>Administrator </span>
          <span className=''>
            er den øverste brugerrolle på en kundekonto, og har adgang til alle funktioner, data relateret til beholdning og brugerstyring.
          </span>
        </li>
        <li>
          <span className='font-semibold'>Moderator </span>
          <span className=''>
            er den næstøverste brugerrolle, og har samme rettigheder som en administrator, men kun på tildelte lokationer.
          </span>
        </li>
        <li>
          <span className='font-semibold'>Bruger </span>
          <span className=''>
            er den alminidelige dag-til-dag bruger som har adgang funktioner relateret til beholdningstyring. Denne brugerrolle kan yderligere afgrænses med hvilken platform de har adgang til samt om priser må vises.
          </span>
        </li>
        <li>
          <span className='font-semibold'>Afgang </span>
          <span>er til den begrænsede beholdningstyring på lageret hvor kun brugere skal have adgang til appen og lave afgange.</span>
        </li>
        <li>
          <span className='font-semibold'>Læseadgang </span>
          <span className=''>er til den helt begrænsede adgang til kun oversigt og historikken. Denne brugerrolle har kun adgang til web platformen.</span>
        </li>
      </ol>
    </div>
  )
}
