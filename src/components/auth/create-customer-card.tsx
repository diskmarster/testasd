"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from 'react-hook-form'
import { z } from "zod";
import { createCustomerValidation } from "@/app/(auth)/opret/validation";
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createCustomerAction } from "@/app/(auth)/opret/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plan, plans } from "@/data/customer.types";

export function CreateCustomerCard() {
  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>
          Opret dig som kunde
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
          Er du allerede kunde i Nem Lager?
        </Link>
      </CardFooter>
    </Card>
  )
}

function Form() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const { handleSubmit, formState, register, setValue } = useForm<z.infer<typeof createCustomerValidation>>({
    resolver: zodResolver(createCustomerValidation),
  })

  async function onSubmit(values: z.infer<typeof createCustomerValidation>) {
    startTransition(async () => {
      const response = await createCustomerAction(values)
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
      <div className="grid gap-2">
        <Label htmlFor='plan'>Plan</Label>
        <Select onValueChange={(value: Plan) => setValue('plan', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {plans.map((p, i) => (
              <SelectItem key={i} value={p} className="capitalize">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='company'>Firmanavn</Label>
        <Input id='company' type='text' {...register('company')} />
        {formState.errors.company && (
          <p className='text-sm text-destructive '>
            {formState.errors.company.message}
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
        <p className='text-sm text-muted-foreground'>
          Du vil modtage en email med at link til at oprette dit firmas første bruger.
        </p>
      </div>
      <Button type='submit' className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Opret
      </Button>
    </form>
  )
}
