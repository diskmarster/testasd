'use client'

import { resetPasswordAction } from '@/app/[lng]/(auth)/glemt-password/actions'
import { resetPasswordValidation } from '@/app/[lng]/(auth)/glemt-password/validation'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { ResetPassword } from '@/lib/database/schema/auth'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button, buttonVariants } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import { PasswordInput } from '../ui/password-input'

export function ResetPasswordCard({ link }: { link: ResetPassword }) {
  const [passwordResat, setPasswordResat] = useState<boolean>(false)
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'emails')
  if (passwordResat) {
    return (
      <div className='mx-auto max-w-lg space-y-4 text-center'>
        <Icons.check className='mx-auto h-12 w-12 animate-bounce text-primary' />
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>
          {t('reset-password-card.password-reset')}
        </h1>
        <p className='text-md text-foreground'>
          {t('reset-password-card.password-reset-description')}
        </p>
        <Button asChild className='w-full'>
          <Link href={`/${lng}/log-ind`}>
            {t('reset-password-card.back-to-login')}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>{t('reset-password-card.reset-password')}</CardTitle>
        <CardDescription>
          {t('reset-password-card.new-password')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm setPasswordResat={setPasswordResat} link={link} />
      </CardContent>
      <CardFooter>
        <Link
          href={`/${lng}/log-ind`}
          className={cn(
            buttonVariants({ variant: 'link' }),
            'mx-auto h-auto p-0',
          )}>
          {t('reset-password-card.back-to-login')}
        </Link>
      </CardFooter>
    </Card>
  )
}

function ResetPasswordForm({
  setPasswordResat,
  link,
}: {
  setPasswordResat: (val: boolean) => void
  link: ResetPassword
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'log-ind')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = resetPasswordValidation(validationT)

  const { register, formState, handleSubmit } = useForm<z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        link: link,
      },
    },
  )

  const submitHandler = (values: z.infer<typeof schema>) => {
    startTransition(async () => {
      const res = await resetPasswordAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
      } else {
        setPasswordResat(true)
      }
    })
  }

  return (
    <form
      className='grid w-full items-start gap-4'
      onSubmit={handleSubmit(submitHandler)}>
      {error && (
        <Alert variant='destructive'>
          <Icons.alert className='size-4 !top-3' />
          <AlertTitle>{t('reset-password-card.error-occured')}</AlertTitle>
          <AlertDescription className='flex flex-col'>{error}</AlertDescription>
        </Alert>
      )}
      <div className='grid gap-2'>
        <Label htmlFor='password'>
          {t('reset-password-card.new-password')}
        </Label>
        <PasswordInput {...register('password')} />
        {formState.errors.password && (
          <p className='text-sm text-destructive '>
            {formState.errors.password.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='confirmPassword'>
          {t('reset-password-card.confirm-new-password')}
        </Label>
        <PasswordInput {...register('confirmPassword')} />
        {formState.errors.confirmPassword && (
          <p className='text-sm text-destructive '>
            {formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button type='submit' className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        {t('reset-password-card.reset-password')}
      </Button>
    </form>
  )
}
