"use client"

import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"
import { FormattedError } from "@/data/errors.types"
import { Credenza, CredenzaBody, CredenzaContent, CredenzaHeader, CredenzaTitle, CredenzaTrigger } from "@/components/ui/credenza"
import { Badge } from "../ui/badge"
import { ButtonCopy } from "../common/button-copy"
import { ScrollArea } from "../ui/scroll-area"
import { formatRelative } from "date-fns"
import * as DateFnsLocale from 'date-fns/locale'

interface Props {
  error: FormattedError
}

export function ModalViewMore({ error }: Props) {
  const lng = useLanguage() as keyof typeof DateFnsLocale
  const { t } = useTranslation(lng, 'errors')
  const time = formatRelative(error.inserted, Date.now(), { locale: DateFnsLocale[lng] })
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <span className="hover:underline cursor-pointer">{t('view-modal.trigger')}</span>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{t('view-modal.title')}</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('view-modal.sub', { time, user: error.user, company: error.company })}
            </p>
            <div className="flex items-center gap-2">
              <Badge className="capitalize" variant='gray'>{error.type}</Badge>
              <Badge variant='blue'>{error.origin}</Badge>
            </div>
            <div className="rounded-md bg-muted overflow-hidden">
              <div className="flex items-center justify-between gap-1 bg-foreground/10 py-2 px-3">
                <span className="text-xs font-semibold text-foreground">{t('view-modal.input')}</span>
                <ButtonCopy text={JSON.stringify(error.input, null, 2)} />
              </div>
              <ScrollArea className="py-2 px-3" maxHeight="max-h-64">
                <pre className="text-sm">{JSON.stringify(error.input, null, 2)}</pre>
              </ScrollArea>
            </div>
            <div className="rounded-md bg-muted overflow-hidden">
              <div className="flex items-center justify-between gap-1 bg-foreground/10 py-2 px-3">
                <span className="text-xs font-semibold text-foreground">{t('view-modal.output')}</span>
                <ButtonCopy text={JSON.stringify(error.error, null, 2)} />
              </div>
              <ScrollArea className="py-2 px-3" maxHeight="max-h-32">
                <pre className="text-sm">{JSON.stringify(error.error, null, 2)}</pre>
              </ScrollArea>
            </div>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
