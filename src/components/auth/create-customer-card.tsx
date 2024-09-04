"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Dispatch, SetStateAction, useState, useTransition } from "react";
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
  const [emailSent, setEmailSent] = useState(false)

  if (emailSent) {

    return (
      <div className="max-w-lg mx-auto text-center space-y-4">
        <Icons.mail className="mx-auto h-12 w-12 text-primary animate-bounce" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tak for din tilmelding
        </h1>
        <p className="text-foreground text-md">
          Vi har sendt et aktiveringslink til din e-mailadresse. Tjek venligst din indbakke og klik på linket for at aktivere din konto.
        </p>
        <p className="text-sm text-muted-foreground">
          Hvis du ikke kan se e-mailen, så tjek venligst din spam-mappe.
        </p>
        <Button asChild className="w-full">
          <Link href="/log-ind">Gå til log ind siden</Link>
        </Button>
      </div>
    )
  }

  return (
    <Card className='relative w-full max-w-sm mx-auto'>
      <CardHeader>
        <CardTitle>
          Opret firma som kunde
        </CardTitle>
        <CardDescription>
          Udfyld firma informationer for at starte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form setEmailSent={setEmailSent} />
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

function Form({ setEmailSent }: { setEmailSent: Dispatch<SetStateAction<boolean>> }) {
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
        return
      }
      setEmailSent(true)
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
          Du vil modtage en mail med et link til at aktivere jeres firma og oprette jeres første bruger.
        </p>
      </div>
      <Button type='submit' className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Opret
      </Button>
    </form>
  )
}
