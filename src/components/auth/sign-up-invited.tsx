'use client'

import { signUpInvitedAction } from '@/app/[lng]/(auth)/invitering/[linkID]/actions'
import { signUpInvitedValidation } from '@/app/[lng]/(auth)/invitering/[linkID]/validation'
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
import { siteConfig } from '@/config/site'
import { UserLink } from '@/lib/database/schema/auth'
import { Customer } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PasswordInput } from '../ui/password-input'

export function SignUpInvitedCard({
  customer,
  inviteLink,
}: {
  customer: Customer
  inviteLink: UserLink
}) {
  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>Velkommen til {siteConfig.name}</CardTitle>
        <CardDescription>
          {customer.company} har inviteret dig til deres firmakonto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form customer={customer} inviteLink={inviteLink} />
      </CardContent>
      <CardFooter>
        <Link
          className={cn(
            buttonVariants({ variant: 'link' }),
            'mx-auto h-auto p-0',
          )}
          href={'/log-ind'}>
          Har du allerede en bruger?
        </Link>
      </CardFooter>
    </Card>
  )
}

function Form({
  customer,
  inviteLink,
}: {
  customer: Customer
  inviteLink: UserLink
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const { handleSubmit, formState, register } = useForm<
    z.infer<typeof signUpInvitedValidation>
  >({
    resolver: zodResolver(signUpInvitedValidation),
    defaultValues: {
      linkID: inviteLink.id,
      email: inviteLink.email,
      clientID: inviteLink.customerID,
    },
  })

  async function onSubmit(values: z.infer<typeof signUpInvitedValidation>) {
    startTransition(async () => {
      const response = await signUpInvitedAction(values)
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
          <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
        <Input
          id='email'
          type='email'
          defaultValue={inviteLink.email}
          disabled
        />
        {formState.errors.email && (
          <p className='text-sm text-destructive '>
            {formState.errors.email.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='password'>Kodeord</Label>
        <PasswordInput id='password' {...register('password')} />
        {formState.errors.password && (
          <p className='text-sm text-destructive '>
            {formState.errors.password.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='confirmPassword'>Bekræft kodeord</Label>
        <PasswordInput id='confirmPassword' {...register('confirmPassword')} />
        {formState.errors.confirmPassword && (
          <p className='text-sm text-destructive '>
            {formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='pin'>PIN-Kode</Label>
        <PasswordInput id='pin' {...register('pin')} />
        {formState.errors.pin && (
          <p className='text-sm text-destructive '>
            {formState.errors.pin.message}
          </p>
        )}
      </div>

      <Button type='submit' className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Opret
      </Button>
    </form>
  )
}
