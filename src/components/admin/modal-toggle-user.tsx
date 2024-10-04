'use client'

import { toggleUserStatusAction } from '@/app/(site)/admin/firma/actions'
import { toggleUserStatusValidation } from '@/app/(site)/admin/firma/validation'
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

export function ModalToggleUser({ users }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const { setValue, handleSubmit, formState, watch, reset } = useForm<
    z.infer<typeof toggleUserStatusValidation>
  >({
    resolver: zodResolver(toggleUserStatusValidation),
  })

  const formValues = watch()
  const user = users.find(user => user.id == formValues.userID)

  useCustomEventListener('ToggleUserByID', (data: any) => {
    setOpen(true)
    setValue('userID', data.userID, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof toggleUserStatusValidation>) {
    startTransition(async () => {
      const res = await toggleUserStatusAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      const userStatus = users.find(user => user.id == values.userID)?.isActive

      setError(undefined)
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `Brugeren blev ${userStatus ? 'Aktiveret' : 'Deaktiveret'}`,
      })
    })
  }

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const title = user && user.isActive ? 'Deaktiver bruger' : 'Aktiver bruger'
  const desc =
    user && user.isActive
      ? 'Denne handling vil deaktivere brugeren og logge vedkommende ud af systemet'
      : 'Denne handling vil aktivere brugeren og tillade dem at logge ind i systemet'

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-sm'>
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{desc}</CredenzaDescription>
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
                  Luk
                </Button>
              </CredenzaClose>
              <Button
                disabled={
                  !formState.isValid || pending || formState.isSubmitting
                }
                variant={user && user.isActive ? 'destructive' : 'default'}
                size='lg'
                className='w-full gap-2'>
                {pending && <Icons.spinner className='size-4 animate-spin' />}
                {user && user.isActive ? 'Deaktiver' : 'Aktiver'}
              </Button>
            </div>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
