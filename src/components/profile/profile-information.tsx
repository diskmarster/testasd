'use client'

import { updateProfileInformationAction } from '@/app/[lng]/(site)/profil/actions'
import { updateProfileValidation } from '@/app/[lng]/(site)/profil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
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

  const lng = useLanguage()
  const { t } = useTranslation(lng, 'profil')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateProfileValidation(validationT)

  const { handleSubmit, formState, register } = useForm<z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        name: user?.name,
        email: user?.email,
      },
    },
  )

  if (!session) return null
  return (
    <form
      className={cn('grid w-full items-start gap-4 md:max-w-lg mb-8')}
      onSubmit={handleSubmit(values => {
        setFormError('')
        startTransition(async () => {
          const res = await updateProfileInformationAction({ ...values })
          if (res && res.serverError) {
            setFormError(res.serverError)
            return
          }
          toast(t(siteConfig.successTitle), {
            description: t('profile-information.updated'),
          })
        })
      })}>
      {formError && (
        <Alert variant='destructive'>
          <Icons.alert className='size-4 !top-3' />
          <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className='grid gap-2'>
        <Label htmlFor='name'>{t('profile-information.name')}</Label>
        <Input id='name' type='text' {...register('name')} />
        {formState.errors.name && (
          <p className='text-sm text-destructive '>
            {formState.errors.name.message}
          </p>
        )}
      </div>
      {/*
      <div className='grid gap-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' type='email' {...register('email')} />
        {formState.errors.email && (
          <p className='text-sm text-destructive '>
            {formState.errors.email.message}
          </p>
        )}
      </div>
      */}

      <Button
        disabled={!formState.isDirty}
        type='submit'
        className='flex items-center gap-2 md:w-fit'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        {t('profile-information.update-button')}
      </Button>
    </form>
  )
}
