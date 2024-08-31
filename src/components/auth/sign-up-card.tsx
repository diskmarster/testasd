"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from 'react-hook-form'
import { z } from "zod";
import { signUpValidation } from "@/app/(auth)/registrer/validation";
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signUpAction } from "@/app/(auth)/registrer/actions";

export function SignUpCard() {
  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>
          Opret en konto
        </CardTitle>
        <CardDescription>
          Udfyld dine informationer for at starte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form />
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

function Form() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const { handleSubmit, formState, register } = useForm<z.infer<typeof signUpValidation>>({
    resolver: zodResolver(signUpValidation),
  })

  async function onSubmit(values: z.infer<typeof signUpValidation>) {
    startTransition(async () => {
      const response = await signUpAction(values)
      if (response && response.serverError) {
        setError(response.serverError)
      }
    })
  }

  return (
    <form className="grid w-full items-start gap-4" onSubmit={handleSubmit(onSubmit)}>
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
      <Button type='submit' className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Opret
      </Button>
    </form>
  )
}
