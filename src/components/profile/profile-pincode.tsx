'use client'

import { updatePinAction } from '@/app/(site)/profil/actions'
import { updatePinValidation } from '@/app/(site)/profil/validation'
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

export function ProfilePin() {
  return (
    <div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
      <div className='grid gap-0.5'>
        <Label>Ny PIN-kode</Label>
        <p className='text-sm text-muted-foreground'>Opdater din PIN-kode</p>
      </div>
      <PinDialog />
    </div>
  )
}

export function PinDialog() {
  const { session } = useSession()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)

  const { handleSubmit, formState, register, reset, watch } = useForm<
    z.infer<typeof updatePinValidation>
  >({
    resolver: zodResolver(updatePinValidation),
  })

  const watchedValues = watch()
  console.log('Form Values:', watchedValues)

  if (!session) return null
  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant='outline' className='hover:text-destructive'>
          Ny PIN-kode
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <form className='space-y-4'>
          <CredenzaHeader>
            <CredenzaTitle>Ny PIN-kode</CredenzaTitle>
            <CredenzaDescription>
              Udfyld formularen for at opdatere din PIN-kode
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
                <Label htmlFor='currentPin'>Nuværende PIN-kode</Label>
                <PasswordInput
                  id='currentPin' //current
                  {...register('currentPin')} //register('currentpin')
                />
                {formState.errors.currentPin && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.currentPin.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='newPin'>Ny PIN-kode</Label>
                <PasswordInput
                  id='newPin'
                  {...register('newPin')} //register('newpin')
                />
                {formState.errors.newPin && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.newPin.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmpin'>Bekræft PIN-kode</Label>
                <PasswordInput
                  id='confirmPin'
                  {...register('confirmPin')} //register('confirmpin')?
                />
                {formState.errors.confirmPin && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.confirmPin.message}
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
                  const res = await updatePinAction({ ...values })
                  if (res && res.serverError) {
                    setFormError(res.serverError)
                    return
                  }
                  toast(siteConfig.successTitle, {
                    description: 'PIN-kode blev opdateret',
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
