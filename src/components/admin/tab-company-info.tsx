import { getCustomerSettingsAction } from '@/app/[lng]/(site)/administration/organisation/actions'
import { updateCustomerSettingsValidation } from '@/app/[lng]/(site)/administration/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import {
  Customer,
  CustomerID,
  CustomerSettings,
} from '@/lib/database/schema/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { FormCompanyEdit } from './form-company-edit'

export function CompanyInfoTab({ customer }: { customer: Customer }) {
  return (
    <div className='space-y-8'>
      <FormCompanyEdit customer={customer} />
      <CompanySettings customerID={customer.id} />
    </div>
  )
}

function CompanySettings({ customerID }: { customerID: CustomerID }) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  const [isLoading, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const [error, setError] = useState<string>()
  const [settings, setSettings] = useState<CustomerSettings>()

  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateCustomerSettingsValidation(validationT)

  const { formState, register, setValue, watch } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      id: settings?.id,
      settings: {
        useReference: settings?.useReference ?? false,
        usePlacement: settings?.usePlacement ?? false,
        useBatch: settings?.useBatch ?? false,
      },
    },
  })

  const getSettings = useCallback(() => {
    startTransition(async () => {
      const res = await getCustomerSettingsAction({ customerID })

      if (res && res.serverError) {
        setError(res.serverError)
      } else if (res && res.data) {
        setSettings(res.data)
      }
    })
  }, [customerID, setError])

  useEffect(() => {
    getSettings()
  }, [getSettings])

  if (error) {
    return (
      <Alert variant='destructive'>
        <Icons.alert className='size-4 !top-3' />
        <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading && settings == undefined) {
    return <p>LOADING...</p>
  }

  const { useReference, usePlacement, useBatch } = watch('settings')

  console.log({ useReference, usePlacement, useBatch })

  return (
    <form className='grid w-full items-start gap-4 md:max-w-xl mt-4'>
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
            {t('form-company-edit.company-name')}
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
            {t('form-company-edit.company-name')}
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
            {t('form-company-edit.company-name')}
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
          {formState.errors.settings && formState.errors.settings.useBatch && (
            <p className='text-sm text-destructive '>
              {formState.errors.settings.useBatch.message}
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
