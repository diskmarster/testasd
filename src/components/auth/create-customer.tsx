'use client'

import { createCustomerAction } from '@/app/(auth)/opret/actions'
import { createCustomerValidation } from '@/app/(auth)/opret/validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { PlanConfig, plansConfig } from '@/config/plan'
import { siteConfig } from '@/config/site'
import { Plan } from '@/data/customer.types'
import { cn } from '@/lib/utils'
import { planUserLimits } from '@/service/customer.utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  FormState,
  SubmitHandler,
  useForm,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'
import { z } from 'zod'

export function CreateCustomer() {
  const [emailSent, setEmailSent] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const { handleSubmit, formState, register, setValue, getValues, watch } =
    useForm<z.infer<typeof createCustomerValidation>>({
      resolver: zodResolver(createCustomerValidation),
      defaultValues: {
        extraUsers: 0,
      },
    })

  watch('plan')

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

  if (emailSent) {
    return (
      <div className='mx-auto max-w-lg space-y-4 text-center'>
        <Icons.mail className='mx-auto h-12 w-12 animate-bounce text-primary' />
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>
          Tak for din tilmelding
        </h1>
        <p className='text-md text-foreground'>
          Vi har sendt et aktiveringslink til din e-mailadresse. Tjek venligst
          din indbakke og klik på linket for at aktivere din konto.
        </p>
        <p className='text-sm text-muted-foreground'>
          Hvis du ikke kan se e-mailen, så tjek venligst din spam-mappe.
        </p>
        <Button asChild className='w-full'>
          <Link href='/log-ind'>Gå til log ind siden</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center'>
      <Badge variant={'default'} className='mb-5 text-primary-foreground'>
        Vælg en plan
      </Badge>
      <div className='grid w-full grid-cols-1 gap-6 md:w-fit md:grid-cols-3'>
        {plansConfig.map((plan, index) => (
          <ExpandableCard
            key={index}
            plan={plan}
            isExpanded={isExpanded}
            setPlan={plan => {
              setValue('plan', plan, { shouldValidate: true })
            }}
            isSelected={getValues().plan == plan.plan}
          />
        ))}
      </div>
      <Button
        variant='outline'
        onClick={() => setIsExpanded(!isExpanded)}
        className='my-6'>
        {isExpanded ? 'Se mindre' : 'Se mere'}
      </Button>
      <Card className='relative mx-auto w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Opret dig som kunde</CardTitle>
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
            formValues={watch()}
            setValue={setValue}
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
  )
}

function ExpandableCard({
  plan,
  isExpanded,
  setPlan: setValue,
  isSelected,
}: {
  plan: PlanConfig
  isExpanded: boolean
  setPlan: (value: 'lite' | 'plus' | 'pro') => void
  isSelected: boolean
}) {
  return (
    <Card
      className={cn(
        'group flex w-full transform cursor-pointer flex-col rounded-lg border-2 border-muted transition-transform duration-300 ease-in-out hover:scale-[1.03] md:w-60',
        isSelected && 'border-primary',
      )}
      onClick={() => setValue(plan.plan)}>
      <CardHeader
        className={cn(
          'rounded-md bg-muted dark:bg-muted',
          isExpanded && 'rounded-b-none',
        )}>
        <CardTitle className='text-2xl capitalize transition-colors duration-150'>
          {plan.plan}
        </CardTitle>
        <CardDescription className='mt-2 text-2xl font-semibold text-primary'>
          {plan.price}{' '}
          <span className='text-xs text-muted-foreground opacity-50'>
            DKK / måned
          </span>
        </CardDescription>
        <p className='mt-1 text-xs font-semibold text-muted-foreground'>
          {plan.description}
        </p>
      </CardHeader>
      <div
        className={cn(
          'overflow-hidden transition-all duration-500 ease-in-out',
          isExpanded
            ? 'max-h-[500px] py-4 opacity-100'
            : 'max-h-0 py-0 opacity-0',
        )}>
        <CardContent className='flex-grow px-6'>
          <p className='mb-2 text-xl font-semibold'>Features:</p>
          <ul className='space-y-2'>
            {plan.features.map((feature, index) => {
              const isFirstFeature =
                (plan.plan === 'plus' && index === 0) ||
                (plan.plan === 'pro' && index === 0)
              return (
                <li key={index} className='flex text-xl'>
                  {!isFirstFeature && (
                    <div className='mr-2'>
                      <Icons.check className='h-5 w-5 text-success' />
                    </div>
                  )}
                  <span
                    className={`text-sm ${isFirstFeature ? 'font-bold' : ''}`}>
                    {feature}
                  </span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </div>
    </Card>
  )
}

function FormCard({
  handleSubmit,
  onSubmit,
  error,
  formState,
  register,
  setValue,
  formValues,
  pending,
}: {
  handleSubmit: UseFormHandleSubmit<z.infer<typeof createCustomerValidation>>
  onSubmit: SubmitHandler<z.infer<typeof createCustomerValidation>>
  error: string | undefined
  formState: FormState<z.infer<typeof createCustomerValidation>>
  register: UseFormRegister<z.infer<typeof createCustomerValidation>>
  setValue: UseFormSetValue<{
    company: string
    email: string
    plan: 'lite' | 'plus' | 'pro'
    extraUsers: number
  }>
  formValues: { extraUsers: number; plan: Plan }
  pending: boolean
}) {
  function increment() {
    // @ts-ignore
    const nextValue = parseFloat(formValues.extraUsers) + 1
    setValue('extraUsers', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function decrement() {
    const nextValue = Math.max(0, formValues.extraUsers - 1)
    setValue('extraUsers', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  return (
    <form
      className='grid w-full items-start gap-4'
      onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert variant='destructive'>
          <Icons.alert className='!top-3 size-4' />
          <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className='grid gap-2'>
        <div className='flex justify-between'>
          <Label htmlFor='extraUsers'>Ekstra brugere</Label>
          <p className='text-xs text-muted-foreground'>49,- kr pr. bruger/md</p>
        </div>
        <div>
          <div className='flex'>
            <Button
              tabIndex={-1}
              size='icon'
              type='button'
              variant='outline'
              className='h-14 w-1/4 border-r-0 rounded-r-none rounded-bl-none'
              onClick={decrement}>
              <Icons.minus className='size-6' />
            </Button>
            <Input
              type='number'
              step={1}
              {...register('extraUsers')}
              onChange={e => {
                const value = parseInt(e.target.value, 10) || 0
                setValue('extraUsers', value, { shouldValidate: true })
              }}
              className={cn(
                'w-1/2 h-14 rounded-none text-center text-2xl z-10 shadow-none',
                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              )}
            />
            <Button
              tabIndex={-1}
              size='icon'
              type='button'
              variant='outline'
              className='h-14 w-1/4 border-l-0 rounded-l-none rounded-br-none'
              onClick={increment}>
              <Icons.plus className='size-6' />
            </Button>
          </div>
          <div className='flex'>
            <Button
              tabIndex={-1}
              size='icon'
              type='button'
              variant='outline'
              className={cn(
                'h-10 w-1/4 rounded-tl-none rounded-r-none border-t-0 border-r-0',
                formValues.extraUsers &&
                  formValues.plan &&
                  'rounded-l-none shadow-none',
              )}
              onClick={() =>
                setValue('extraUsers', 5, { shouldValidate: true })
              }>
              5
            </Button>
            <Button
              tabIndex={-1}
              size='icon'
              type='button'
              variant='outline'
              className={cn(
                'h-10 w-1/4 rounded-none border-t-0',
                formValues.extraUsers && formValues.plan && 'shadow-none',
              )}
              onClick={() =>
                setValue('extraUsers', 10, { shouldValidate: true })
              }>
              10
            </Button>
            <Button
              tabIndex={-1}
              size='icon'
              type='button'
              variant='outline'
              className={cn(
                'h-10 w-1/4 rounded-none border-t-0 border-l-0',
                formValues.extraUsers && formValues.plan && 'shadow-none',
              )}
              onClick={() =>
                setValue('extraUsers', 15, { shouldValidate: true })
              }>
              15
            </Button>
            <Button
              tabIndex={-1}
              size='icon'
              type='button'
              variant='outline'
              className={cn(
                'h-10 w-1/4 border-t-0 border-l-0 rounded-l-none rounded-tr-none',
                formValues.extraUsers &&
                  formValues.plan &&
                  'rounded-r-none shadow-none',
              )}
              onClick={() =>
                setValue('extraUsers', 20, { shouldValidate: true })
              }>
              20
            </Button>
          </div>
          <div
            className={cn(
              'bg-border rounded-b-md text-sm h-0 transition-all text-muted-foreground flex items-center gap-2 justify-center',
              formValues.extraUsers &&
                formValues.plan &&
                'shadow-sm h-12 md:h-9',
            )}>
            {formValues.extraUsers != 0 && formValues.plan && (
              <p className='text-center'>
                Total antal brugere:{' '}
                {formValues.extraUsers + planUserLimits[formValues.plan]}{' '}
              </p>
            )}
          </div>
        </div>
        {formState.errors.extraUsers && (
          <p className='text-sm text-destructive'>
            {formState.errors.extraUsers.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='company'>Firmanavn</Label>
        <Input id='company' type='text' {...register('company')} />
        {formState.errors.company && (
          <p className='text-sm text-destructive'>
            {formState.errors.company.message}
          </p>
        )}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' type='email' {...register('email')} />
        {formState.errors.email && (
          <p className='text-sm text-destructive'>
            {formState.errors.email.message}
          </p>
        )}
        <p className='text-sm text-muted-foreground'>
          Du vil modtage en mail med et link til at aktivere din virksomhed og
          oprette din første bruger.
        </p>
      </div>
      <Button
        type='submit'
        disabled={pending || !formState.isValid}
        className='flex items-center gap-2'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        Opret
      </Button>
    </form>
  )
}
