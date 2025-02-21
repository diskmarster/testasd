'use client'

import { updateCustomerAction } from '@/app/[lng]/(site)/administration/organisation/actions'
import { updateCustomerValidation } from '@/app/[lng]/(site)/administration/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Customer } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@radix-ui/react-label'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Skeleton } from '../ui/skeleton'

interface Props {
  customer: Customer
}

export function FormCompanyEdit({ customer }: Props) {
  const context = 'details'

  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateCustomerValidation(validationT)

  const { handleSubmit, formState, register, reset } = useForm<z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        company: customer.company,
        email: customer.email,
      },
    },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('company-page.title', { context })}</CardTitle>
        <CardDescription>
          {t('company-page.description', { context })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id='company-details-form'
          className={cn('grid w-full items-start gap-4 md:max-w-xl')}
          onSubmit={handleSubmit(values => {
            startTransition(async () => {
              const res = await updateCustomerAction({ ...values })
              if (res && res.serverError) {
                setFormError(res.serverError)
                return
              } else if (res && res.data == true) {
                reset(values)
              }
              toast(t(siteConfig.successTitle), {
                description: t('company-page.update-success', { context }),
              })
            })
          })}>
          {formError && (
            <Alert variant='destructive'>
              <Icons.alert className='size-4 !top-3' />
              <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className='flex flex-col w-full md:flex-row md:gap-4'>
            <div className='grid gap-2 md:max-w-[285px]'>
              <Label htmlFor='name'>
                {t('company-page.form-company-edit.company-name')}
              </Label>
              <Input id='name' type='text' {...register('company')} />
              {formState.errors.company && (
                <p className='text-sm text-destructive '>
                  {formState.errors.company.message}
                </p>
              )}
            </div>
            <div className='grid gap-2 md:max-w-[285px]'>
              <Label htmlFor='email'>
                {t('company-page.form-company-edit.email')}
              </Label>
              <Input id='email' type='email' {...register('email')} />
              {formState.errors.email && (
                <p className='text-sm text-destructive '>
                  {formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

        </form>
      </CardContent>
      <CardFooter>
        <Button
          form='company-details-form'
          disabled={!formState.isDirty}
          type='submit'
          className='flex items-center gap-2 md:w-fit'>
          {pending && <Icons.spinner className='size-4 animate-spin' />}
          {t('company-page.update-button', { context })}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CompanyEditSkeleton() {
  return (
    <div className={cn('grid w-full items-start gap-4 md:max-w-xl mt-4')}>
      <div className='flex flex-col w-full md:flex-row md:gap-4'>
        <div className='grid gap-2 w-full md:w-[285px]'>
          <Skeleton className='w-1/3 h-6' />
          <Skeleton className='w-full h-10' />
        </div>
        <div className='grid gap-2 w-full md:w-[285px]'>
          <Skeleton className='w-1/3 h-6' />
          <Skeleton className='w-full h-10' />
        </div>
      </div>
      <Skeleton className='h-11 w-20' />
    </div>
  )
}
