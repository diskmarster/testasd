'use client'

import { inviteNewUserAction } from '@/app/[lng]/(site)/admin/organisation/actions'
import { inviteNewUserValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { UserRole, userRoles } from '@/data/user.types'
import { Location } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { AutoComplete } from '../ui/autocomplete'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'

interface Props {
  locations: Location[]
  currentLocationID: string
  isDisabled: boolean
}

export function ModalInviteUser({
  locations,
  currentLocationID,
  isDisabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = inviteNewUserValidation(validationT)
  const [searchRoles, setSearchRoles] = useState('Bruger')

  const rolesOptions = userRoles
    .filter(
      role =>
        role != 'system_administrator' &&
        role.toLowerCase().includes(searchRoles.toLowerCase()),
    )
    .map(role => ({
      label: role.replace('_', ' '),
      value: role,
    }))

  const { handleSubmit, register, formState, reset, watch, setValue } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      locationIDs: [currentLocationID],
      role: 'bruger',
      webAccess: true,
      appAccess: true,
      priceAccess: true,
    },
  })

  const formValues = watch()

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    startTransition(async () => {
      const res = await inviteNewUserAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('toasts.invitation-sent')} ${values.email}`,
      })
    })
  }
  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button
          size='icon'
          variant='outline'
          disabled={isDisabled}
          className={cn(isDisabled && 'pointer-events-none')}>
          <Icons.userPlus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-3xl'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-invite-user.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-invite-user.description')}
            {siteConfig.name}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='flex flex-col gap-4 pb-4 md:pb-0 justify-between'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='flex gap-4 h-[inherit] flex-col md:flex-row'>
              <div className='w-full space-y-4'>
                <div className='grid gap-2'>
                  <Label>{t('modal-invite-user.email')}</Label>
                  <Input
                    placeholder={t('modal-invite-user.email-placeholder')}
                    {...register('email')}
                  />
                  {formState.errors.email && (
                    <p className='text-sm text-destructive'>
                      {formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='grid gap-2'>
                    <Label>{t('modal-invite-user.role')}</Label>
                    <AutoComplete
                      autoFocus={false}
                      placeholder={t('modal-invite-user.role-placeholder')}
                      emptyMessage='Ingen roller fundet'
                      items={rolesOptions}
                      onSelectedValueChange={value => {
                        const role = value as UserRole

                        switch (role) {
                          case 'administrator':
                          case 'moderator':
                          case 'bruger':
                            setValue('webAccess', true, {
                              shouldValidate: true,
                            })
                            setValue('appAccess', true, {
                              shouldValidate: true,
                            })
                            setValue('priceAccess', true, {
                              shouldValidate: true,
                            })
                            break
                          case 'afgang':
                            setValue('webAccess', false, {
                              shouldValidate: true,
                            })
                            setValue('appAccess', true, {
                              shouldValidate: true,
                            })
                            setValue('priceAccess', false, {
                              shouldValidate: true,
                            })
                            break
                          case 'læseadgang':
                            setValue('webAccess', true, {
                              shouldValidate: true,
                            })
                            setValue('appAccess', false, {
                              shouldValidate: true,
                            })
                            setValue('priceAccess', false, {
                              shouldValidate: true,
                            })
                            break
                        }

                        setValue('role', role, { shouldValidate: true })
                      }}
                      onSearchValueChange={setSearchRoles}
                      selectedValue={
                        formValues.role ? formValues.role.toString() : ''
                      }
                      searchValue={searchRoles}
                    />
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <p>
                        {t('modal-invite-user.role-question')}{' '}
                        <Link
                          className='underline'
                          href={`/faq?"${t('modal-invite-user.role-url')}"`}
                          target='_blank'>
                          {t('modal-invite-user.role-link')}
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
                {formValues.role == 'bruger' && (
                  <div className='flex flex-col gap-2'>
                    <Label>{t('modal-invite-user.user-rights')}</Label>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          checked={formValues.webAccess}
                          onCheckedChange={(checked: boolean) => {
                            setValue('webAccess', checked, {
                              shouldValidate: true,
                            })
                          }}
                        />
                        <span className='text-muted-foreground text-sm'>
                          {t('modal-invite-user.user-rights-web')}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          checked={formValues.appAccess}
                          onCheckedChange={(checked: boolean) => {
                            setValue('appAccess', checked, {
                              shouldValidate: true,
                            })
                          }}
                        />
                        <span className='text-muted-foreground text-sm'>
                          {t('modal-invite-user.user-rights-app')}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          checked={formValues.priceAccess}
                          onCheckedChange={(checked: boolean) => {
                            setValue('priceAccess', checked, {
                              shouldValidate: true,
                            })
                          }}
                        />
                        <span className='text-muted-foreground text-sm'>
                          {t('modal-invite-user.user-rights-prices')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  'flex w-px bg-border',
                  formValues.role == 'administrator' && 'hidden',
                )}
              />
              <div
                className={cn(
                  'grid gap-2 w-full',
                  formValues.role == 'administrator' && 'hidden',
                )}>
                <div className='flex items-center justify-between'>
                  <Label>{t('modal-invite-user.location-access')}</Label>
                  <span className='text-muted-foreground text-xs tabular-nums leading-[14px]'>
                    {formValues.locationIDs.length} {t('modal-invite-user.of')}{' '}
                    {locations.length} {t('modal-invite-user.locations-chosen')}
                  </span>
                </div>
                <ScrollArea className='h-[300px]'>
                  <div className='space-y-2'>
                    {locations.map(loc => (
                      <div
                        key={loc.id}
                        className={cn(
                          'border rounded-sm py-2 px-3 flex items-center justify-between transition-colors h-9',
                          formValues.locationIDs.includes(loc.id) &&
                            'bg-primary/5',
                        )}>
                        <span className='text-muted-foreground text-sm'>
                          {loc.name}
                        </span>
                        <Switch
                          checked={formValues.locationIDs.includes(loc.id)}
                          onCheckedChange={(checked: boolean) => {
                            let locations = formValues.locationIDs

                            if (checked) {
                              locations.push(loc.id)
                            } else {
                              locations = locations.filter(
                                locID => locID != loc.id,
                              )
                            }

                            setValue('locationIDs', locations, {
                              shouldValidate: true,
                            })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {formState.errors.locationIDs && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.locationIDs.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              className='w-full flex items-center gap-2'
              type='submit'
              disabled={pending || !formState.isValid}>
              {pending && <Icons.spinner className='animate-spin size-4' />}
              {t('modal-invite-user.send-invite')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
