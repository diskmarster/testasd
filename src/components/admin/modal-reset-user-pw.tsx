'use client'

import { resetUserPasswordAction } from '@/app/[lng]/(site)/admin/organisation/actions'
import { resetUserPasswordValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
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
import { UserNoHash } from '@/lib/database/schema/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface Props {
  users: UserNoHash[]
}

export function ModalResetUserPW({ users }: Props) {
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

  useCustomEventListener('ResetUserPasswordByID', (data: any) => {
    setOpen(true)
    setValue('userID', data.userID, { shouldValidate: true })
    setValue('email', data.email, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof resetUserPasswordValidation>) {
    startTransition(async () => {
      const res = await resetUserPasswordAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      const user = users.find(u => u.id == formValues.userID)

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('toasts.reset-pw-email')} ${user?.name}`,
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
          <CredenzaTitle>{t('modal-reset-userpw.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-reset-userpw.description')}
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
                  {t('modal-reset-userpw.cancel-button')}
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
                {t('modal-reset-userpw.reset-button')}
              </Button>
            </div>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
