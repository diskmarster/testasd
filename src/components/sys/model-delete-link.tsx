'use client'

import { deleteInviteLinkAction, deleteUserAction } from '@/app/[lng]/(site)/sys/brugere/actions'
import { deleteInviteLinkValidation } from '@/app/[lng]/(site)/sys/brugere/validation'
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
import { UserLinkID } from '@/lib/database/schema/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface Props { }

export function ModalDeleteLink({ }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'sys-bruger')

  const { setValue, handleSubmit, formState, reset } = useForm<
    z.infer<typeof deleteInviteLinkValidation>
  >({
    resolver: zodResolver(deleteInviteLinkValidation),
  })

  useCustomEventListener('DeleteInviteLinkByID', (data: { linkID: UserLinkID }) => {
    setOpen(true)
    setValue('linkID', data.linkID, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof deleteInviteLinkValidation>) {
    startTransition(async () => {
      const res = await deleteInviteLinkAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(siteConfig.successTitle, {
        description: t("modal-delete-link.confirm-toast"),
      }))
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
          <CredenzaTitle>{t('modal-delete-link.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-delete-link.description')}
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
                  {t('modal-delete-link.cancel-button')}
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
                {t('modal-delete-link.confirm-button')}
              </Button>
            </div>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
