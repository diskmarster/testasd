"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FormState, SubmitHandler, useForm, UseFormHandleSubmit, UseFormRegister, } from 'react-hook-form';
import { z } from "zod";
import { createCustomerValidation } from "@/app/(auth)/opret/validation";
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createCustomerAction } from "@/app/(auth)/opret/actions";
import { PlanConfig, plansConfig } from "@/config/plan";
import { siteConfig } from "@/config/site";


export function CreateCustomer() {
  const [emailSent, setEmailSent] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const { handleSubmit, formState, register, setValue, getValues, watch } = useForm<z.infer<typeof createCustomerValidation>>({
    resolver: zodResolver(createCustomerValidation),

  });

  watch('plan')

  async function onSubmit(values: z.infer<typeof createCustomerValidation>) {
    startTransition(async () => {
      const response = await createCustomerAction(values);
      if (response && response.serverError) {
        setError(response.serverError);
        return;
      }
      setEmailSent(true);
    });
  }

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
    );
  }

  return (
    <div className="flex flex-col items-center p-6 my-6">
      <Badge variant={"default"} className="mb-5 text-primary-foreground">
        Vælg en plan
      </Badge>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full md:w-fit">
        {plansConfig.map((plan, index) => (
          <ExpandableCard key={index} plan={plan} isExpanded={isExpanded} setPlan={(plan) => {
            setValue("plan", plan, { shouldValidate: true })
          }} isSelected={getValues().plan == plan.plan}
          />
        ))}
      </div>
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="my-6"
      >
        {isExpanded ? ("Se mindre") : ("Se mere")}
      </Button>
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
          <FormCard
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            error={error}
            formState={formState}
            register={register}
            pending={pending}
          />
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
    </div>
  );
}

function ExpandableCard({
  plan,
  isExpanded,
  setPlan: setValue,
  isSelected,
}: {
  plan: PlanConfig;
  isExpanded: boolean;
  setPlan: (value: 'lite' | 'plus' | 'pro') => void;
  isSelected: boolean;
}) {
  return (
    <Card
      className={cn(
        "w-full md:w-60 rounded-lg border-2 border-muted transition-transform duration-300 ease-in-out transform flex flex-col group hover:scale-105 cursor-pointer",
        isSelected && "border-primary"
      )}
      onClick={() => setValue(plan.plan)}
    >
      <CardHeader className={cn("bg-muted rounded-md dark:bg-muted", isExpanded && "rounded-b-none")}>
        <CardTitle className="text-2xl capitalize transition-colors duration-150">{plan.plan}</CardTitle>
        <CardDescription className="text-2xl font-semibold mt-2 text-primary">
          {plan.price}{" "}
          <span className="text-muted-foreground opacity-50 text-xs">DKK / måned</span>
        </CardDescription>
        <p className="text-xs font-semibold text-muted-foreground mt-1">{plan.description}</p>
      </CardHeader>
      <div
        className={cn(
          "transition-all duration-500 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[500px] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
        )}
      >
        <CardContent className="px-6 flex-grow">
          <p className="font-semibold mb-2 text-sm">Features:</p>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex text-xl">
                <div className="mr-2">
                  <Icons.check className="w-5 h-5 text-success" />
                </div>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </div>
    </Card>
  );
}

function FormCard({ handleSubmit, onSubmit, error, formState, register, pending, }:
  {
    handleSubmit: UseFormHandleSubmit<z.infer<typeof createCustomerValidation>>
    onSubmit: SubmitHandler<z.infer<typeof createCustomerValidation>>;
    error: string | undefined;
    formState: FormState<z.infer<typeof createCustomerValidation>>;
    register: UseFormRegister<z.infer<typeof createCustomerValidation>>
    pending: boolean;
  }) {

  return (
    <form className="grid w-full items-start gap-4" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert variant='destructive'>
          <Icons.alert className='size-4 !top-3' />
          <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='grid gap-2'>
        <Label htmlFor='company'>
          Firmanavn
        </Label>
        <Input id='company' type='text' {...register('company')} />
        {formState.errors.company && (
          <p className='text-sm text-destructive'>
            {formState.errors.company.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='email'>
          Email
        </Label>
        <Input id='email' type='email' {...register('email')} />
        {formState.errors.email && (
          <p className='text-sm text-destructive'>
            {formState.errors.email.message}
          </p>
        )}
        <p className='text-sm text-muted-foreground'>
          Du vil modtage en mail med et link til at aktivere din virksomhed og oprette din første bruger.
        </p>
      </div>
      <Button type='submit' disabled={pending || !formState.isValid} className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Opret
      </Button>
    </form>
  );
}
