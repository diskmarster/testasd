'use client'

import { updatePasswordAction } from '@/app/(site)/profil/actions'
import { updatePasswordValidation } from '@/app/(site)/profil/validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { siteConfig } from '@/config/site'
import { useSession } from '@/context/session'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export function ProfilePassword() {
  return (
    <div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
      <div className='grid gap-0.5'>
        <Label>Nyt kodeord</Label>
        <p className='text-sm text-muted-foreground'>Opdater dit kodeord</p>
      </div>
      <PasswordDialog />
    </div>
  )
}

function PasswordDialog() {
  const { session } = useSession()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)

  const { handleSubmit, formState, register, reset } = useForm<
    z.infer<typeof updatePasswordValidation>
  >({
    resolver: zodResolver(updatePasswordValidation),
  })

  if (!session) return null
  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant='outline' className='hover:text-destructive'>
          Nyt kodeord
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <form className='space-y-4'>
          <CredenzaHeader>
            <CredenzaTitle>Nyt kodeord</CredenzaTitle>
            <CredenzaDescription>
              Udfyld formularen for at opdatere dit kodeord
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className={cn('grid w-full items-start gap-4 md:max-w-lg')}>
              {formError && (
                <Alert variant='destructive'>
                  <Icons.alert className='size-4 !top-3' />
                  <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className='grid gap-2'>
                <Label htmlFor='currentPassword'>Nuværende kodeord</Label>
                <PasswordInput
                  id='currentPassword'
                  type='password'
                  {...register('currentPassword')}
                />
                {formState.errors.currentPassword && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='newPassword'>Nyt kodeord</Label>
                <PasswordInput
                  id='newPassword'
                  type='password'
                  {...register('newPassword')}
                />
                {formState.errors.newPassword && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmPassword'>Bekræft kodeord</Label>
                <PasswordInput
                  id='confirmPassword'
                  type='password'
                  {...register('confirmPassword')}
                />
                {formState.errors.confirmPassword && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant='link'>Luk</Button>
            </CredenzaClose>
            <Button
              disabled={!formState.isDirty}
              type='submit'
              className='flex items-center gap-2'
              onClick={handleSubmit(values => {
                startTransition(async () => {
                  reset()
                  const res = await updatePasswordAction({ ...values })
                  if (res && res.serverError) {
                    setFormError(res.serverError)
                    return
                  }
                  toast(siteConfig.successTitle, {
                    description: 'Kodeord blev opdateret',
                  })
                  setOpen(false)
                })
              })}>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              Opdater
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  )
}
