'use client'

import { updateProfileInformationAction } from '@/app/(site)/profil/actions'
import { updateProfileValidation } from '@/app/(site)/profil/validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { siteConfig } from '@/config/site'
import { useSession } from '@/context/session'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@radix-ui/react-label'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export function ProfileInformation() {
  const { session, user } = useSession()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const { handleSubmit, formState, register } = useForm<
    z.infer<typeof updateProfileValidation>
  >({
    resolver: zodResolver(updateProfileValidation),
    defaultValues: {
      name: user?.name,
      email: user?.email,
    },
  })

  if (!session) return null
  return (
    <form
      className={cn('grid w-full items-start gap-4 md:max-w-lg')}
      onSubmit={handleSubmit(values => {
        startTransition(async () => {
          const res = await updateProfileInformationAction({ ...values })
          if (res && res.serverError) {
            setFormError(res.serverError)
            return
          }
          toast(siteConfig.successTitle, {
            description: 'Din profil blev opdateret',
          })
        })
      })}>
      {formError && (
        <Alert variant='destructive'>
          <Icons.alert className='size-4 !top-3' />
          <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className='grid gap-2'>
        <Label htmlFor='name'>Navn</Label>
        <Input id='name' type='text' {...register('name')} />
        {formState.errors.name && (
          <p className='text-sm text-destructive '>
            {formState.errors.name.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' type='email' {...register('email')} />
        {formState.errors.email && (
          <p className='text-sm text-destructive '>
            {formState.errors.email.message}
          </p>
        )}
      </div>

      <Button
        disabled={!formState.isDirty}
        type='submit'
        className='flex items-center gap-2 md:w-fit'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Opdater
      </Button>
    </form>
  )
}
