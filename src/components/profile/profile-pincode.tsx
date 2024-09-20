'use client'

import { updatePasswordAction, updatePincodeAction } from '@/app/(site)/profil/actions'
import { updatePasswordValidation, updatePincodeValidation } from '@/app/(site)/profil/validation'
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

export function ProfilePincode() {
  return (
    <div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
      <div className='grid gap-0.5'>
        <Label>Ny PIN-kode</Label>
        <p className='text-sm text-muted-foreground'>Opdater din PIN-kode</p>
      </div>
      <PincodeDialog />
    </div>
  )
}

function PincodeDialog() {
  const { session } = useSession()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)

  const { handleSubmit, formState, register, reset, watch } = useForm<
    z.infer<typeof updatePincodeValidation> //lav validation i profil/validation /done
  >({
    resolver: zodResolver(updatePincodeValidation), // same / done
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
                <Label htmlFor='currentPincode'>Nuværende PIN-kode</Label>
                <PasswordInput
                  id='currentPincode' //current 
                  {...register('currentPincode')} //register('currentPincode')
                />
                {formState.errors.currentPincode && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.currentPincode.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='newPincode'>Ny PIN-kode</Label>
                <PasswordInput
                  id='newPincode'
                  {...register('newPincode')} //register('newPincode')
                />
                {formState.errors.newPincode && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.newPincode.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmPincode'>Bekræft PIN-kode</Label>
                <PasswordInput
                  id='confirmPincode'
                  {...register('confirmPincode')} //register('confirmPincode')?
                />
                {formState.errors.confirmPincode && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.confirmPincode.message}
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
                  const res = await updatePincodeAction({ ...values })
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
