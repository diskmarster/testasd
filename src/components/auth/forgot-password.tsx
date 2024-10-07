'use client'

import { forgotPasswordValidation } from '@/app/(auth)/glemt-password/validation'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>Glemt kodeord</CardTitle>
        <CardDescription>
          Udfyld din email for at nulstille dit kodeord
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
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

function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition()

  const { register, formState, handleSubmit } = useForm<
    z.infer<typeof forgotPasswordValidation>
  >({
    resolver: zodResolver(forgotPasswordValidation),
  })

  const submitHandler = (values: z.infer<typeof forgotPasswordValidation>) => {
    startTransition(async () => {
      console.log("reset password", values)
    })
  }

  return (
    <form className='grid w-full items-start gap-8' onSubmit={handleSubmit(submitHandler)}>
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
