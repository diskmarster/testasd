'use client'

import {
  editUserAction,
  getLocationsByUserIDAction,
} from '@/app/[lng]/(site)/admin/organisation/actions'
import { editUserValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { getUserRoles, lte, UserRole } from '@/data/user.types'
import { UserID, UserNoHash } from '@/lib/database/schema/auth'
import { CustomerID, Location, LocationID } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { useSession } from '@/context/session'

interface Props { }

export function ModalEditUser({}: Props) {
  const {session, user: sessionUser} = useSession()
  const [error, setError] = useState<string>()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserNoHash>()
  const [locations, setLocations] = useState<
    { id: LocationID; name: string }[] | undefined
  >(undefined)
  const [pending, startTransition] = useTransition()
  const [searchRoles, setSearchRoles] = useState('')

  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  if (!session) return null
  const userRoles = getUserRoles(lte(sessionUser.role))

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
    setUser(undefined)
    setLocations([])
    setError(undefined)
    reset()
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const res = await editUserAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      onOpenChange(false)
      toast.success(t(siteConfig.successTitle), {
        description: t('modal-edit-user.success'),
      })
    })
  }

  const fetchLocations = (userID: UserID, customerID: CustomerID) => {
    startTransition(async () => {
      const res = await getLocationsByUserIDAction({ userID, customerID })

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      const userLocations = res?.data?.userLocations ?? []
      const allLocations = res?.data?.allLocations ?? []

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

  useCustomEventListener('EditUserByID', (data: { user: UserNoHash }) => {
    setUser(data.user)
    setSearchRoles(data.user.role)
    if (data.user) {
      setValue('userID', data.user.id, {
        shouldValidate: true,
        shouldDirty: false,
      })
      setValue(
        'data',
        {
          ...data.user,
          locationIDs: [],
        },
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      )
    }
    fetchLocations(data.user.id, data.user.customerID)
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
          <ScrollArea>
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
                          emptyMessage={t('modal-invite-user.role-not-found')}
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

                            setValue('data.role', role, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
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
                            <span
                              className={cn(
                                'text-muted-foreground text-sm cursor-pointer select-none',
                                pending && 'cursor-not-allowed',
                              )}
                              onClick={() => {
                                if (!pending) {
                                  setValue(
                                    'data.webAccess',
                                    !formValues.data.webAccess,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    },
                                  )
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
                            <span
                              className={cn(
                                'text-muted-foreground text-sm cursor-pointer select-none',
                                pending && 'cursor-not-allowed',
                              )}
                              onClick={() => {
                                if (!pending) {
                                  setValue(
                                    'data.appAccess',
                                    !formValues.data.appAccess,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    },
                                  )
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
                            <span
                              className={cn(
                                'text-muted-foreground text-sm cursor-pointer select-none',
                                pending && 'cursor-not-allowed',
                              )}
                              onClick={() => {
                                if (!pending) {
                                  setValue(
                                    'data.priceAccess',
                                    !formValues.data.priceAccess,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    },
                                  )
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
                      <div className='flex items-center justify-between h-[14px]'>
                        <Label>{t('modal-edit-user.access-level')}</Label>
                    {locations && (
                        <span className={cn('text-muted-foreground text-xs tabular-nums')}>
                          {pending
                            ? 0
                            : formValues.data.locationIDs.filter(id =>
                              locations.some(l => l.id == id),
                            ).length}
                          {' af '}
                          {locations.length} {t('modal-edit-user.locations-chosen')}
                        </span>
                        )}
                      </div>
                    <ScrollArea className='md:border md:p-2 md:rounded-md max-md:max-h-[125px] md:h-[300px] [&>div>div]:h-full'>
                      <div className='h-full'>
                        {!locations || pending ? (
                            <div className='w-full h-full grid place-items-center'>

                          <Icons.spinner className='size-8 animate-spin' />
                            </div>
                        ) : (
                              <div className='space-y-2'>

                          {locations.map(loc => (
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
                                  disabled={locations.length == 1}
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
                         ))}
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
          </ScrollArea>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
