'use client'

import { editUserAction, getLocationsByUserIDAction } from '@/app/[lng]/(site)/admin/organisation/actions'
import { editUserValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { UserRole, userRoles } from '@/data/user.types'
import { UserID, UserNoHash } from '@/lib/database/schema/auth'
import { Location, LocationID } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { AutoComplete } from '../ui/autocomplete'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '../ui/credenza'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'
import { toast } from 'sonner'
import { siteConfig } from '@/config/site'

interface Props {
  users: UserNoHash[]
  locations: Location[]
}

export function ModalEditUser({ users, locations: allLocations }: Props) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserNoHash>()
  const [locations, setLocations] = useState<
    { id: LocationID; name: string }[]
  >(allLocations.map(l => ({ id: l.id, name: l.name })))
  const [pending, startTransition] = useTransition()
  const [searchRoles, setSearchRoles] = useState('')

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

  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  const formSchema = editUserValidation(t)

  const { formState, watch, setValue, reset, register, handleSubmit } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userID: user?.id,
      data: {
        name: user?.name,
        email: user?.email,
        role: user?.role,
        locationIDs: [],
        webAccess: user?.webAccess,
        appAccess: user?.appAccess,
        priceAccess: user?.priceAccess,
      },
    },
  })

  const formValues = watch()

  const onOpenChange = (val: boolean) => {
    setOpen(val)
    reset()
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const res = await editUserAction(values)

      if (res && res.serverError) {
        // TODO: Do something with the error
        return
      }

      onOpenChange(false)
      toast.success(t(siteConfig.successTitle), {
        description: t('modal-edit-user.success'),
      })
    })
  }

  const fetchLocations = (userID: UserID) => {
    startTransition(async () => {
      const res = await getLocationsByUserIDAction({ userID })

      if (res && res.serverError) {
        // TODO: Do something with the error
        return
      }

      const userLocations = res?.data ?? []

      setLocations(
        allLocations.map(l => ({
          id: l.id,
          name: l.name,
        })),
      )
      setValue(
        'data.locationIDs',
        userLocations.map(l => l.id),
        {
          shouldValidate: true,
          shouldDirty: false,
        },
      )
    })
  }

  useCustomEventListener('EditUserByID', (data: { userID: UserID }) => {
    const user = users.find(u => u.id == data.userID)
    setUser(user)
    setSearchRoles(user?.role ?? '')
    if (user) {
      setValue('userID', data.userID, {
        shouldValidate: true,
        shouldDirty: false,
      })
      setValue(
        'data',
        {
          ...user,
          locationIDs: [],
        },
        {
          shouldValidate: true,
          shouldDirty: false,
        },
      )
    }
    fetchLocations(data.userID)
    setOpen(true)
  })

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-3xl'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-edit-user.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-edit-user.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {!user ? (
            <Alert>
              <AlertTitle>{t('user-not-found-title')}</AlertTitle>
              <AlertDescription>
                {t('user-not-found-description')}
              </AlertDescription>
            </Alert>
          ) : (
            <form
              className='flex flex-col gap-4 pb-4 md:pb-0 justify-between'
              onSubmit={handleSubmit(onSubmit, e => console.log(e))}>
              <div className='flex gap-4 h-[inherit] flex-col md:flex-row'>
                <div className='w-full space-y-4'>
                  <div className='grid gap-2'>
                    <Label>{t('modal-edit-user.user-name')}</Label>
                    <Input
                      disabled={pending}
                      placeholder={t('modal-edit-user.user-name-placeholder')}
                      {...register('data.name')}
                    />
                    {formState.errors.data && formState.errors.data.name && (
                      <p className='text-sm text-destructive'>
                        {formState.errors.data.name.message}
                      </p>
                    )}
                  </div>
                  <div className='grid gap-2'>
                    <Label>{t('modal-invite-user.email')}</Label>
                    <Input
                      disabled={pending}
                      placeholder={t('modal-invite-user.email-placeholder')}
                      {...register('data.email')}
                    />
                    {formState.errors.data && formState.errors.data.email && (
                      <p className='text-sm text-destructive'>
                        {formState.errors.data.email.message}
                      </p>
                    )}
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='grid gap-2'>
                      <Label>{t('modal-invite-user.role')}</Label>
                      <AutoComplete
                        disabled={pending}
                        className='capitalize'
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
                              setValue('data.webAccess', true, {
                                shouldValidate: true,
                              })
                              setValue('data.appAccess', true, {
                                shouldValidate: true,
                              })
                              setValue('data.priceAccess', true, {
                                shouldValidate: true,
                              })
                              break
                            case 'afgang':
                              setValue('data.webAccess', false, {
                                shouldValidate: true,
                              })
                              setValue('data.appAccess', true, {
                                shouldValidate: true,
                              })
                              setValue('data.priceAccess', false, {
                                shouldValidate: true,
                              })
                              break
                            case 'læseadgang':
                              setValue('data.webAccess', true, {
                                shouldValidate: true,
                              })
                              setValue('data.appAccess', false, {
                                shouldValidate: true,
                              })
                              setValue('data.priceAccess', false, {
                                shouldValidate: true,
                              })
                              break
                          }

                          setValue('data.role', role, { shouldValidate: true, shouldDirty: true, })
                        }}
                        onSearchValueChange={setSearchRoles}
                        selectedValue={
                          formValues.data.role
                            ? formValues.data.role.toString()
                            : ''
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
                  {formValues.data.role == 'bruger' && (
                    <div className='flex flex-col gap-2'>
                      <Label>{t('modal-invite-user.user-rights')}</Label>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            disabled={pending}
                            checked={formValues.data.webAccess}
                            onCheckedChange={(checked: boolean) => {
                              setValue('data.webAccess', checked, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }}
                          />
                          <span className={cn('text-muted-foreground text-sm cursor-pointer select-none', pending && 'cursor-not-allowed')} onClick={() => {
                            if (!pending) {
                              setValue('data.webAccess', !formValues.data.webAccess, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                          }}>
                            {t('modal-invite-user.user-rights-web')}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            disabled={pending}
                            checked={formValues.data.appAccess}
                            onCheckedChange={(checked: boolean) => {
                              setValue('data.appAccess', checked, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }}
                          />
                          <span className={cn('text-muted-foreground text-sm cursor-pointer select-none', pending && 'cursor-not-allowed')} onClick={() => {
                            if (!pending) {
                              setValue('data.appAccess', !formValues.data.appAccess, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                          }}>
                            {t('modal-invite-user.user-rights-app')}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            disabled={pending}
                            checked={formValues.data.priceAccess}
                            onCheckedChange={(checked: boolean) => {
                              setValue('data.priceAccess', checked, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }}
                          />
                          <span className={cn('text-muted-foreground text-sm cursor-pointer select-none', pending && 'cursor-not-allowed')} onClick={() => {
                            if (!pending) {
                              setValue('data.priceAccess', !formValues.data.priceAccess, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                          }}>
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
                    formValues.data.role == 'administrator' && 'hidden',
                  )}
                />
                <div
                  className={cn(
                    'grid gap-2 w-full',
                    formValues.data.role == 'administrator' && 'hidden',
                  )}>
                  <div className='flex items-center justify-between'>
                    <Label>{t('modal-edit-user.access-level')}</Label>
                    <span className='text-muted-foreground text-xs tabular-nums'>
                      {pending ? 0 : formValues.data.locationIDs.length}
                      {' af '}
                      {locations.length} {t('modal-edit-user.locations-chosen')}
                    </span>
                  </div>
                  <ScrollArea className='border p-2 rounded-md h-[300px]'>
                    <div className='space-y-2'>
                      {locations.length > 0 ? (
                        locations.map(loc => (
                          <div
                            key={loc.id}
                            className='border rounded-sm p-2 flex items-center justify-between'>
                            <div className='flex flex-col'>
                              <span className='text-muted-foreground text-sm font-semibold'>
                                {loc.name}
                              </span>
                            </div>
                            {pending ? (
                              <Loader2 className='animate-spin size-[20px]' />
                            ) : (
                              <Switch
                                checked={formValues.data.locationIDs.includes(
                                  loc.id,
                                )}
                                onCheckedChange={(checked: boolean) => {
                                  let users = formValues.data.locationIDs

                                  if (checked) {
                                    users.push(loc.id)
                                  } else {
                                    users = users.filter(us => us != loc.id)
                                  }

                                  setValue('data.locationIDs', users, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  })
                                }}
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className='text-center mx-auto w-4/5 text-muted-foreground text-xs leading-5'>
                          {t('modal-edit-user.create-more-locations')}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  {formState.errors.data &&
                    formState.errors.data.locationIDs && (
                      <p className='text-sm text-destructive'>
                        {formState.errors.data.locationIDs.message}
                      </p>
                    )}
                </div>
              </div>
              <Button
                className='w-full flex items-center gap-2'
                type='submit'
                disabled={pending || !formState.isDirty || !formState.isValid}>
                {pending && formState.isDirty && (
                  <Icons.spinner className='animate-spin size-4' />
                )}
                {t('modal-edit-user.update-button')}
              </Button>
            </form>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
