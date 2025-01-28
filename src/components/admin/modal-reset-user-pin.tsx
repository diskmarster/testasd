'use client'

import { resetUserPinAction } from '@/app/[lng]/(site)/(admin)/organisation/actions'
import { resetUserPasswordValidation } from '@/app/[lng]/(site)/(admin)/organisation/validation'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface Props {}

export function ModalResetUserPin({ }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  const { setValue, handleSubmit, formState, watch, reset } = useForm<
    z.infer<typeof resetUserPasswordValidation>
  >({
    resolver: zodResolver(resetUserPasswordValidation),
  })

  const formValues = watch()

  useCustomEventListener('ResetUserPinByID', (data: any) => {
    setOpen(true)
    setValue('userID', data.userID, { shouldValidate: true })
    setValue('email', data.email, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof resetUserPasswordValidation>) {
    startTransition(async () => {
      const res = await resetUserPinAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(siteConfig.successTitle), {
        description: `${t('toasts.reset-pw-email')} ${formValues.email}`,
      })
    })
  }

  function onOpenChange(open: boolean) {
    reset()
    setError(undefined)
    setOpen(open)
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-sm'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-reset-userpin.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-reset-userpin.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 pb-4 md:pb-0'>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
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
                  {t('modal-reset-userpin.cancel-button')}
                </Button>
              </CredenzaClose>
              <Button
                disabled={
                  !formState.isValid || pending || formState.isSubmitting
                }
                variant='default'
                size='lg'
                className='w-full gap-2'>
                {pending && <Icons.spinner className='size-4 animate-spin' />}
                {t('modal-reset-userpin.reset-button')}
              </Button>
            </div>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
