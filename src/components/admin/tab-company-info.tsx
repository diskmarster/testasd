'use client'

import { updateCustomerSettingsAction } from '@/app/[lng]/(site)/administration/organisation/actions'
import { updateCustomerSettingsValidation } from '@/app/[lng]/(site)/administration/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Plan } from '@/data/customer.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
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
import { Hint } from '../ui/Hint'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Separator } from '../ui/separator'
import {
  Setting,
  SettingBody,
  SettingContent,
  SettingDescription,
  SettingFooter,
  SettingLabel,
  SettingSkeleton,
  SettingTitle,
} from '../ui/settings'
import { Skeleton } from '../ui/skeleton'
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
        <Skeleton className='w-1/3 h-6' />
        <Skeleton className='w-2/3 h-4' />
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
        useReference: settings?.useReference ?? {
          tilgang: true,
          afgang: true,
          regulering: true,
          flyt: true,
        },
        usePlacement: settings?.usePlacement ?? true,
        authTimeoutMinutes: settings?.authTimeoutMinutes ?? 5,
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
            usePlacement: res.data.usePlacement,
            authTimeoutMinutes: res.data.authTimeoutMinutes,
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

  const {
    settings: { useReference, usePlacement, authTimeoutMinutes },
  } = watch()

  const [useReferencePartial, useReferenceFull] = useMemo(
    () => [
      useReference.tilgang ||
      useReference.afgang ||
      useReference.regulering ||
      useReference.flyt,
      useReference.tilgang &&
      useReference.afgang &&
      useReference.regulering &&
      useReference.flyt,
    ],
    [
      useReference.tilgang,
      useReference.afgang,
      useReference.regulering,
      useReference.flyt,
    ],
  )

  if (error) {
    return (
      <Alert variant='destructive'>
        <Icons.alert className='size-4 !top-3' />
        <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

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
              <SettingBody className='pt-0'>
                <SettingLabel>
                  <SettingTitle>
                    {t('company-page.settings.reference')}
                  </SettingTitle>
                  <SettingDescription>
                    {t('company-page.settings.reference-description')}
                  </SettingDescription>
                </SettingLabel>
                <SettingContent>
                  <Switch
                    checked={useReferencePartial}
                    onCheckedChange={(input: boolean) => {
                      const val =
                        (useReferencePartial && !useReferenceFull) || input
                      setValue(
                        'settings.useReference',
                        {
                          tilgang: val,
                          afgang: val,
                          regulering: val,
                          flyt: val,
                        },
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        },
                      )
                    }}
                    id='useReference'
                    partial={useReferencePartial && !useReferenceFull}
                    {...register('settings.useReference')}
                  />
                </SettingContent>
              </SettingBody>
              <SettingFooter>
                <div className='flex gap-4 justify-between w-full'>
                  <div className='flex gap-2 justify-center items-center text-center'>
                    <Label>Tilgang</Label>
                    <Switch
                      checked={useReference.tilgang}
                      onCheckedChange={(val: boolean) => {
                        setValue('settings.useReference.tilgang', val, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }}
                      id='useReference.tilgang'
                      {...register('settings.useReference.tilgang')}
                    />
                  </div>
                  <div className='flex gap-2 justify-center items-center text-center'>
                    <Label>Afgang</Label>
                    <Switch
                      checked={useReference.afgang}
                      onCheckedChange={(val: boolean) => {
                        setValue('settings.useReference.afgang', val, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }}
                      id='useReference.afgang'
                      {...register('settings.useReference.afgang')}
                    />
                  </div>
                  <div className='flex gap-2 justify-center items-center text-center'>
                    <Label>Regulering</Label>
                    <Switch
                      checked={useReference.regulering}
                      onCheckedChange={(val: boolean) => {
                        setValue('settings.useReference.regulering', val, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }}
                      id='useReference.regulering'
                      {...register('settings.useReference.regulering')}
                    />
                  </div>
                  <div className='flex gap-2 justify-center items-center text-center'>
                    <Label>Flyt</Label>
                    <Switch
                      disabled={!usePlacement}
                      checked={useReference.flyt}
                      onCheckedChange={(val: boolean) => {
                        setValue('settings.useReference.flyt', val, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }}
                      id='useReference.flyt'
                      {...register('settings.useReference.flyt')}
                    />
                  </div>
                </div>
                {formState.errors.settings &&
                  formState.errors.settings.useReference && (
                    <p className='text-sm text-destructive '>
                      {formState.errors.settings.useReference.message}
                    </p>
                  )}
              </SettingFooter>
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
            <Separator />
            <Setting>
              <SettingBody>
                <SettingLabel className='flex-none w-2/3'>
                  <SettingTitle className='flex gap-1'>
                    {t('company-page.settings.app-signout')}
                    <Hint className='size-3 cursor-pointer'>
                      <p className='max-w-[60ch] text-pretty'>
                        {t('company-page.settings.app-signout-hint')}{' '}
                        <Link
                          href={`/${lng}/faq?spørgsmål=${t('company-page.settings.app-signout-faq-question')}`}
                          className='underline'>
                          {t('company-page.settings.app-signout-hint-link')}
                        </Link>
                      </p>
                    </Hint>
                  </SettingTitle>
                  <SettingDescription>
                    {t('company-page.settings.app-signout-description')}
                  </SettingDescription>
                </SettingLabel>
                <SettingContent className='w-1/3'>
                  <Select
                    value={String(authTimeoutMinutes)}
                    onValueChange={value =>
                      setValue('settings.authTimeoutMinutes', parseInt(value), {
                        shouldDirty: true,
                      })
                    }>
                    <SelectTrigger className='w-[192px]'>
                      <SelectValue className='normal-case'>
                        {t('company-page.settings.app-signout-value', {
                          context: authTimeoutMinutes,
                        })}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>
                        {t('company-page.settings.app-signout-value', {
                          context: 0,
                        })}
                      </SelectItem>
                      <SelectItem value='5'>
                        {t('company-page.settings.app-signout-value', {
                          context: 5,
                        })}
                      </SelectItem>
                      <SelectItem value='10'>
                        {t('company-page.settings.app-signout-value', {
                          context: 10,
                        })}
                      </SelectItem>
                      <SelectItem value='15'>
                        {t('company-page.settings.app-signout-value', {
                          context: 15,
                        })}
                      </SelectItem>
                      <SelectItem value='30'>
                        {t('company-page.settings.app-signout-value', {
                          context: 30,
                        })}
                      </SelectItem>
                      <SelectItem value='60'>
                        {t('company-page.settings.app-signout-value', {
                          context: 60,
                        })}
                      </SelectItem>
                      <SelectItem value='99999999'>
                        {t('company-page.settings.app-signout-value', {
                          context: 99999999,
                        })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </SettingContent>
              </SettingBody>
              {formState.errors.settings &&
                formState.errors.settings.authTimeoutMinutes && (
                  <SettingFooter>
                    <p className='text-sm text-destructive '>
                      {formState.errors.settings.authTimeoutMinutes.message}
                    </p>
                  </SettingFooter>
                )}
            </Setting>
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
