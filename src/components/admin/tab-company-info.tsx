'use client'

import { updateCustomerSettingsAction } from '@/app/[lng]/(site)/administration/organisation/actions'
import { updateCustomerSettingsValidation } from '@/app/[lng]/(site)/administration/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { FieldErrors, useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { Separator } from '../ui/separator'
import {
  SettingBody,
  SettingContent,
  SettingDescription,
  SettingFooter,
  SettingLabel,
  SettingTitle,
  Setting,
  SettingSkeleton,
} from '../ui/settings'
import { Switch } from '../ui/switch'
import { CompanyEditSkeleton, FormCompanyEdit } from './form-company-edit'
import { Plan } from '@/data/customer.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { Skeleton } from '../ui/skeleton'

export function CompanyInfoTab({
  customer,
  settings,
}: {
  customer: Customer
  settings: CustomerSettings | undefined
}) {
  return (
    <div className='space-y-8 xl:space-y-0 xl:space-x-8 xl:grid xl:grid-cols-2'>
      <FormCompanyEdit customer={customer} />
      <CompanySettings settings={settings} companyPlan={customer.plan} />
    </div>
  )
}

export function CompanyInfoSkeleton({ plan }: { plan: Plan }) {
  return (
    <div className='space-y-8 xl:space-y-0 xl:space-x-8 xl:grid xl:grid-cols-2'>
      <CompanyEditSkeleton />
      <CompanySettingsSkeleton plan={plan} />
    </div>
  )
}

function CompanySettingsSkeleton({ plan }: { plan: Plan }) {
  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <Skeleton className="w-1/3 h-6" />
        <Skeleton className="w-2/3 h-4" />
      </CardHeader>
      <CardContent className='flex-1'>
        <div className='grid w-full items-start gap-2'>
          <div className='flex flex-col w-full'>
            <SettingSkeleton />
            {hasPermissionByPlan(plan, 'basis') && (
              <>
                <Separator />
                <SettingSkeleton />
              </>
            )}
            {hasPermissionByPlan(plan, 'pro') && (
              <>
                <Separator />
                <SettingSkeleton />
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className='h-10 w-40' />
      </CardFooter>
    </Card>
  )
}

function CompanySettings({
  settings,
  companyPlan,
}: {
  settings: CustomerSettings | undefined
  companyPlan: Plan
}) {
  const context = 'settings'

  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  const [isLoading, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const [validationError, setValidationError] = useState<string[]>()
  const error = settings == undefined ? t('no-settings-found') : undefined

  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateCustomerSettingsValidation(validationT)

  const { formState, register, setValue, watch, handleSubmit, reset } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      id: settings?.id,
      customerID: settings?.customerID,
      settings: {
        useReference: settings?.useReference ?? true,
        usePlacement: settings?.usePlacement ?? true,
        useBatch: settings?.useBatch ?? true,
      },
    },
  })

  const onSubmit = (values: z.infer<typeof schema>) => {
    startTransition(async () => {
      const res = await updateCustomerSettingsAction(values)

      if (res && res.serverError) {
        setFormError(res.serverError)
      } else if (res && res.data) {
        reset({
          id: res.data.id,
          customerID: res.data.customerID,
          settings: {
            useReference: res.data.useReference,
            useBatch: res.data.useBatch,
            usePlacement: res.data.usePlacement,
          },
        })

        toast(t(siteConfig.successTitle), {
          description: t('company-page.update-success', { context }),
        })
      }
    })
  }

  function flatten<T extends FieldErrors>(
    error: T,
    previousKeys: string[] = [],
  ): string[] {
    const keys: (keyof FieldErrors<z.infer<typeof schema>>)[] = Object.keys(
      error,
    ) as (keyof FieldErrors<z.infer<typeof schema>>)[]

    let errorMessage: string[] = []
    for (const key of keys) {
      if (error[key] && error[key].message != undefined) {
        const context = [...previousKeys, key].join('.')
        errorMessage.push(
          `${t('company-page.error.name', { context })}: ${error[key].message}`,
        )
      } else if (error[key]) {
        errorMessage = errorMessage.concat(
          //@ts-ignore
          flatten(error[key], [...previousKeys, key]),
        )
      }
    }

    return errorMessage
  }

  const onSubmitError = (error: FieldErrors<z.infer<typeof schema>>) => {
    setValidationError(flatten(error))
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
        <CardTitle>{t('company-page.title', { context })}</CardTitle>
        <CardDescription>
          {t('company-page.description', { context })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id='company-settings-form'
          className='grid w-full items-start gap-4'
          onSubmit={handleSubmit(onSubmit, onSubmitError)}>
          {formError && (
            <Alert variant='destructive'>
              <Icons.alert className='size-4 !top-3' />
              <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {validationError && (
            <Alert variant='destructive'>
              <Icons.alert className='size-4 !top-3' />
              <AlertTitle>{t('form-validation-error')}</AlertTitle>
              <AlertDescription>
                <ul>
                  {validationError.map((e, i) => (
                    <li key={`${e}_${i}`} className='list-disc ml-5'>
                      <p>{e}</p>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <div className='flex flex-col w-full'>
            <Setting>
              <SettingBody>
                <SettingLabel className='pt-0'>
                  <SettingTitle>
                    {t('company-page.settings.reference')}
                  </SettingTitle>
                  <SettingDescription>
                    {t('company-page.settings.reference-description')}
                  </SettingDescription>
                </SettingLabel>
                <SettingContent className='pt-0'>
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
                </SettingContent>
              </SettingBody>
              {formState.errors.settings &&
                formState.errors.settings.useReference && (
                  <SettingFooter>
                    <p className='text-sm text-destructive '>
                      {formState.errors.settings.useReference.message}
                    </p>
                  </SettingFooter>
                )}
            </Setting>
            {hasPermissionByPlan(companyPlan, 'basis') && (
              <>
                <Separator />
                <Setting>
                  <SettingBody>
                    <SettingLabel>
                      <SettingTitle>
                        {t('company-page.settings.placement')}
                      </SettingTitle>
                      <SettingDescription>
                        {t('company-page.settings.placement-description')}
                      </SettingDescription>
                    </SettingLabel>
                    <SettingContent>
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
                    </SettingContent>
                  </SettingBody>
                  {formState.errors.settings &&
                    formState.errors.settings.usePlacement && (
                      <SettingFooter>
                        <p className='text-sm text-destructive '>
                          {formState.errors.settings.usePlacement.message}
                        </p>
                      </SettingFooter>
                    )}
                </Setting>
              </>
            )}
            {hasPermissionByPlan(companyPlan, 'pro') && (
              <>
                <Separator />
                <Setting>
                  <SettingBody>
                    <SettingLabel>
                      <SettingTitle>
                        {t('company-page.settings.batch')}
                      </SettingTitle>
                      <SettingDescription>
                        {t('company-page.settings.batch-description')}
                      </SettingDescription>
                    </SettingLabel>
                    <SettingContent>
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
                    </SettingContent>
                  </SettingBody>
                  {formState.errors.settings &&
                    formState.errors.settings.useBatch && (
                      <SettingFooter>
                        <p className='text-sm text-destructive '>
                          {formState.errors.settings.useBatch.message}
                        </p>
                      </SettingFooter>
                    )}
                </Setting>
              </>
            )}
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
