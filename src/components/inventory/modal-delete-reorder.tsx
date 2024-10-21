'use client'

import { deleteReorderAction } from '@/app/[lng]/(site)/genbestil/actions'
import { deleteReorderValidation } from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Product } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface Props {
  products: Product[]
}

export function ModalDeleteReorder({ products }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')

  const { setValue, handleSubmit, formState, watch, reset } = useForm<
    z.infer<typeof deleteReorderValidation>
  >({
    resolver: zodResolver(deleteReorderValidation),
  })

  const formValues = watch()

  useCustomEventListener('DeleteReorderByIDs', (data: any) => {
    setOpen(true)
    setValue('productID', data.productID, { shouldValidate: true })
    setValue('locationID', data.locationID, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof deleteReorderValidation>) {
    startTransition(async () => {
      const res = await deleteReorderAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('toasts.delete-reorder')} ${products.find(prod => prod.id == formValues.productID)?.text1}`,
      })
    })
  }

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-sm'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-delete-reorder.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-delete-reorder.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 pb-4 md:pb-0'>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='flex flex-col gap-2 md:flex-row md:justify-end'>
              <CredenzaClose asChild>
                <Button
                  type='button'
                  size='lg'
                  variant='secondary'
                  className='w-full'>
                  {t('modal-delete-reorder.cancel-button')}
                </Button>
              </CredenzaClose>
              <Button
                disabled={
                  !formState.isValid || pending || formState.isSubmitting
                }
                variant='destructive'
                size='lg'
                className='w-full gap-2'>
                {pending && <Icons.spinner className='size-4 animate-spin' />}
                {t('modal-delete-reorder.delete-button')}
              </Button>
            </div>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
