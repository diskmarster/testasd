"use client"

import { SiteWrapper } from '@/components/common/site-wrapper'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useSearchParams } from 'next/navigation'
import { forwardRef, useEffect, useRef, useState } from 'react'

export default function Page() {
  const searchParams = useSearchParams()
  const questionParam = searchParams.get("spørgsmål")

  const [accordionValue, setAccordionValue] = useState<string>()

  const questionRefs = useRef<Array<HTMLDivElement | null>>([])

  const questions: { question: string, answer: string | React.ReactNode }[] = [
    {
      question: "Hvordan opretter jeg en vare?",
      answer: "Du opretter den"
    },
    {
      question: 'Hvordan formaterer jeg min import fil til varekartoteket?',
      answer: <AnswerImportInventory />
    }
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
  }, [questionParam])

  return (
    <SiteWrapper
      title='Oftest stillede spørgsmål'
      description='Her kan du få svar på nogle af de oftest stillede spørgsmål til Nem Lager'>
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
  return (
    <div className='flex flex-col gap-4'>
      <p>
        For at kunnne importerer en import fil til at opdaterer din lager
        beholdning, skal filen opfylde disse kritirier.
      </p>
      <p>
        Tabel dataen skal være opbygget, i ingen vigtig rækkefølge, og indeholde
        værdier som stemmer overens med listen nedenunder.
      </p>
      <ol className='space-y-2'>
        <li>
          <span className='font-semibold'>Text1 </span>
          <span className=''>
            må ikke kun indeholde tal. F.eks. 34567 skal have minimum et
            bogstav.
          </span>
        </li>
        <li>
          <span className='font-semibold'>CostPrice </span>
          <span>
            skal skilles med et komma (,) ved decimaler. Tusinde separator kan
            benyttes med et punktum (.) men dette er ikke nødvendigt.
          </span>
        </li>
        <li>
          <span className='font-semibold'>Unit </span>
          <span>
            skal skrives som de står på varekortene. Tager ikke højde for store
            eller små bogstaver. F.eks. Stk eller stk.
          </span>
        </li>
        <li>
          <span className='font-semibold'>Barred </span>
          <span>
            skal skrives som enten true, false, ja eller nej. Truthy værdier er
            true og ja. Falsy værdier er false og nej.
          </span>
        </li>
        <li>
          <span className='font-semibold'>Inserted </span>
          <span>
            skal skrives således det matcher dd-MM-yyyy. F.eks. 01-06-2024 for
            at skrive 1. juni 2024.
          </span>
        </li>
      </ol>
    </div>
  )
}
