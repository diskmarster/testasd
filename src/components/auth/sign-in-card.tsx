'use client'
'use client'

import { signInAction } from '@/app/[lng]/(auth)/log-ind/actions'
import { signInValidation } from '@/app/[lng]/(auth)/log-ind/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface SignInCardProps {
  lng: string
	redirect: string | null
}

export function SignInCard({ lng, redirect }: SignInCardProps) {
  const { t } = useTranslation(lng, 'log-ind')

  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>{t('sign-in-card.title')}</CardTitle>
        <CardDescription>{t('sign-in-card.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form t={t} redirectPath={redirect} />
      </CardContent>
      <CardFooter>
        <Link
          className={cn(
            buttonVariants({ variant: 'link' }),
            'mx-auto h-auto p-0',
          )}
          href={`/${lng}/opret`}>
          {t('sign-in-card.opret-en-bruger')}
        </Link>
      </CardFooter>
    </Card>
  )
}

interface FormProps {
  t: (key: string) => string
	redirectPath: string | null
}

function Form({ t, redirectPath }: FormProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = signInValidation(validationT)

  const { handleSubmit, formState, register } = useForm<z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
			defaultValues: {
				redirectPath,
			}
    },
  )

  async function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const response = await signInAction(values)
      if (response && response.serverError) {
        setError(response.serverError)
      }
    })
  }

  return (
    <form
      className='grid w-full items-start gap-4'
      onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert variant='destructive'>
          <Icons.alert className='size-4 !top-3' />
          <AlertTitle>{t('sign-in-card.error-title')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className='grid gap-2'>
        <Label htmlFor='email'>{t('sign-in-card.email')}</Label>
        <Input id='email' type='email' {...register('email')} />
        {formState.errors.email && (
          <p className='text-sm text-destructive '>
            {formState.errors.email.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <div className='flex justify-between'>
          <Label htmlFor='password'>{t('sign-in-card.password')}</Label>
          <Link
            className={
              'hover:underline text-xs font-medium text-muted-foreground'
            }
            href={`/${lng}/glemt-password`}>
            {t('sign-in-card.forgot-password')}
          </Link>
        </div>

        <PasswordInput id='password' {...register('password')} />
        {formState.errors.password && (
          <p className='text-sm text-destructive '>
            {formState.errors.password.message}
          </p>
        )}
      </div>
      <Button type='submit' className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        {t('sign-in-card.login')}
      </Button>
    </form>
  )
}
