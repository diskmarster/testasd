import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) {
    signOutAction()
    return
  }

  const location = await locationService.getLastVisited(user.id)
  if (!location) {
    signOutAction()
    return
  }

  return (
    <SiteWrapper
      title='Oftest stillede spørgsmål'
      description='Her kan du få svar på nogle af de oftest stillede spørgsmål til Nem Lager'>
      <div className='lg:w-1/2'>
        <QandA
          id='1'
          question='Hvordan formaterer jeg min import fil til beholdning?'
          answer={<AnswerImportInventory />}
        />
      </div>
    </SiteWrapper>
  )
}

function QandA({
  question,
  answer,
  id,
}: {
  question: string
  answer: string | React.ReactNode
  id: string
}) {
  return (
    <Accordion id={id} type='single' collapsible>
      <AccordionItem value='item-1'>
        <AccordionTrigger>{question}</AccordionTrigger>
        <AccordionContent>{answer}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

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
