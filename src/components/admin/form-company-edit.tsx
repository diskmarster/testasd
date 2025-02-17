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

interface Props {
  customer: Customer
}

export function FormCompanyEdit({ customer }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateCustomerValidation(validationT)

  const { handleSubmit, formState, register } = useForm<z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        company: customer.company,
        email: customer.email,
      },
    },
  )

  return (
    <form
      className={cn('grid w-full items-start gap-4 md:max-w-xl mt-4')}
      onSubmit={handleSubmit(values => {
        startTransition(async () => {
          const res = await updateCustomerAction({ ...values })
          if (res && res.serverError) {
            setFormError(res.serverError)
            return
          }
          toast(siteConfig.successTitle, {
            description: 'Din firmaprofil blev opdateret',
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
          <Label htmlFor='name'>{t('form-company-edit.company-name')}</Label>
          <Input id='name' type='text' {...register('company')} />
          {formState.errors.company && (
            <p className='text-sm text-destructive '>
              {formState.errors.company.message}
            </p>
          )}
        </div>
        <div className='grid gap-2 md:max-w-[285px]'>
          <Label htmlFor='email'>{t('form-company-edit.email')}</Label>
          <Input id='email' type='email' {...register('email')} />
          {formState.errors.email && (
            <p className='text-sm text-destructive '>
              {formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <Button
        disabled={!formState.isDirty}
        type='submit'
        className='flex items-center gap-2 md:w-fit'>
        {pending && <Icons.spinner className='size-4 animate-spin' />}
        {t('form-company-edit.update-button')}
      </Button>
    </form>
  )
}
