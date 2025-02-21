'use client'

import { updateCustomerSettingsValidation } from '@/app/[lng]/(site)/administration/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { FieldErrors, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { CompanyEditSkeleton, FormCompanyEdit } from './form-company-edit'

export function CompanyInfoTab({
  customer,
  settings,
}: {
  customer: Customer
  settings: CustomerSettings | undefined
}) {
  return (
    <div className='space-y-8'>
      <FormCompanyEdit customer={customer} />
      <CompanySettings settings={settings} />
    </div>
  )
}

export function CompanyInfoSkeleton() {
  return (
    <div className='space-y-8'>
      <CompanyEditSkeleton />
    </div>
  )
}

function CompanySettings({
  settings,
}: {
  settings: CustomerSettings | undefined
}) {
  const context = 'settings'

  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  const [isLoading, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const [error, setError] = useState(
    settings == undefined ? t('no-settings-found') : undefined,
  )

  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateCustomerSettingsValidation(validationT)

  const { formState, register, setValue, watch, handleSubmit } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      id: settings?.id,
      settings: {
        useReference: settings?.useReference ?? true,
        usePlacement: settings?.usePlacement ?? true,
        useBatch: settings?.useBatch ?? true,
      },
    },
  })

  const onSubmit = (values: z.infer<typeof schema>) => {
    console.log(values)
    startTransition(async () => {

    })
  }

  const onSubmitError = (error: FieldErrors<z.infer<typeof schema>>) => {
    console.log(error)
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <Icons.alert className='size-4 !top-3' />
        <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const {
    settings: { useReference, usePlacement, useBatch },
  } = watch()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('company-page.title', { context })}
        </CardTitle>
        <CardDescription>
          {t('company-page.description', { context })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id='company-settings-form'
          className='grid w-full items-start gap-4 md:max-w-xl'
          onSubmit={handleSubmit(onSubmit, onSubmitError)}>
          {formError && (
            <Alert variant='destructive'>
              <Icons.alert className='size-4 !top-3' />
              <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className='flex flex-col w-full md:flex-row md:gap-4'>
            <div className='grid gap-2 md:max-w-[285px]'>
              <Label htmlFor='useReference'>
                {t('company-page.settings.reference')}
              </Label>
              <Switch
                checked={useReference}
                onCheckedChange={(val: boolean) => {
                  setValue('settings.useReference', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                id='useReference'
                {...register('settings.useReference')}
              />
              {formState.errors.settings &&
                formState.errors.settings.useReference && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.settings.useReference.message}
                  </p>
                )}
            </div>
            <div className='grid gap-2 md:max-w-[285px]'>
              <Label htmlFor='usePlacement'>
                {t('company-page.settings.placement')}
              </Label>
              <Switch
                checked={usePlacement}
                onCheckedChange={(val: boolean) => {
                  setValue('settings.usePlacement', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                id='usePlacement'
                {...register('settings.usePlacement')}
              />
              {formState.errors.settings &&
                formState.errors.settings.usePlacement && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.settings.usePlacement.message}
                  </p>
                )}
            </div>
            <div className='grid gap-2 md:max-w-[285px]'>
              <Label htmlFor='useBatch'>
                {t('company-page.settings.batch')}
              </Label>
              <Switch
                checked={useBatch}
                onCheckedChange={(val: boolean) => {
                  setValue('settings.useBatch', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                id='useBatch'
                {...register('settings.useBatch')}
              />
              {formState.errors.settings &&
                formState.errors.settings.useBatch && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.settings.useBatch.message}
                  </p>
                )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          form='company-settings-form'
          disabled={!formState.isDirty}
          type='submit'
          className='flex items-center gap-2 md:w-fit'>
          {isLoading && <Icons.spinner className='size-4 animate-spin' />}
          {t('company-page.update-button', { context })}
        </Button>
      </CardFooter>
    </Card>
  )
}
