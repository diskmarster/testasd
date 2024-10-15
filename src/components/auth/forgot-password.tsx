'use client'

import { forgotPasswordAction } from '@/app/[lng]/(auth)/glemt-password/actions'
import { forgotPasswordValidation } from '@/app/[lng]/(auth)/glemt-password/validation'
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
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export function ForgotPasswordCard() {
  const [emailSent, setEmailSent] = useState<boolean>(false)
  if (emailSent) {
    return (
      <div className='mx-auto max-w-lg space-y-4 text-center'>
        <Icons.mail className='mx-auto h-12 w-12 animate-bounce text-primary' />
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>
          Vi har modtaget din forespørgsel
        </h1>
        <p className='text-md text-foreground'>
          Vi har sendt en mail til din e-mailadresse, som viser dig hvordan du
          kan nulstille dit kodeord. Tjek venligst din indbakke, for at
          fortsætte.
        </p>
        <p className='text-sm text-muted-foreground'>
          Hvis du ikke kan se e-mailen, tjek venligst din spam-mappe.
        </p>
        <Button asChild className='w-full'>
          <Link href='/log-ind'>Gå til log ind siden</Link>
        </Button>
      </div>
    )
  }

  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>Glemt kodeord</CardTitle>
        <CardDescription>
          Udfyld din email for at nulstille dit kodeord
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm setEmailSent={setEmailSent} />
      </CardContent>
      <CardFooter>
        <Link
          className={cn(
            buttonVariants({ variant: 'link' }),
            'mx-auto h-auto p-0',
          )}
          href={'/log-ind'}>
          Tilbage til log ind
        </Link>
      </CardFooter>
    </Card>
  )
}

function ForgotPasswordForm({
  setEmailSent,
}: {
  setEmailSent: (val: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const { register, formState, handleSubmit } = useForm<
    z.infer<typeof forgotPasswordValidation>
  >({
    resolver: zodResolver(forgotPasswordValidation),
  })

  const submitHandler = (values: z.infer<typeof forgotPasswordValidation>) => {
    startTransition(async () => {
      const res = await forgotPasswordAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
      } else {
        setEmailSent(true)
      }
    })
  }

  return (
    <form
      className='grid w-full items-start gap-8'
      onSubmit={handleSubmit(submitHandler)}>
      {error && (
        <Alert variant='destructive'>
          <Icons.alert className='size-4 !top-3' />
          <AlertTitle>Der skete en fejl</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className='grid gap-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' type='email' {...register('email')} />
        {formState.errors.email && (
          <p className='text-sm text-destructive '>
            {formState.errors.email.message}
          </p>
        )}
      </div>
      <Button type='submit' className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Nulstil kodeord
      </Button>
    </form>
  )
}
