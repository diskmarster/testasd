'use client'

import { editLocationAction } from '@/app/[lng]/(site)/admin/organisation/actions'
import { editLocationValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { UserNoHash } from '@/lib/database/schema/auth'
import { LinkLocationToUser } from '@/lib/database/schema/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { User } from 'lucia'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'

interface Props {
  users?: UserNoHash[]
  user: User
  userAccesses: LinkLocationToUser[]
}

export function ModalEditLocation({ user, users, userAccesses }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  const { handleSubmit, register, formState, reset, watch, setValue } = useForm<
    z.infer<typeof editLocationValidation>
  >({
    resolver: zodResolver(editLocationValidation),
    defaultValues: {
      userIDs: [user.id],
      customerID: user.customerID,
    },
  })

  const formValues = watch()

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const onSubmit = async (values: z.infer<typeof editLocationValidation>) => {
    startTransition(async () => {
      const res = await editLocationAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${values.name} ${t('toasts.location-updated')}`,
      })
    })
  }

  useCustomEventListener('EditLocationByID', (data: any) => {
    setValue('locationID', data.locationID, { shouldValidate: true })
    setValue('name', data.name, { shouldValidate: true })

    const locationAccesses = userAccesses
      .filter(access => access.locationID == data.locationID)
      .map(access => access.userID)
    setValue('userIDs', locationAccesses, { shouldValidate: true })

    setOpen(true)
  })

  const filteredUsers = users ? users.filter(u => u.id != user.id && u.role != 'system_administrator' && u.role != 'administrator') : []
  const numChosen = formValues.userIDs.filter(id => filteredUsers.some((u) => u.id == id)).length

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-md'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-edit-location.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-edit-location.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-6 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='grid gap-2'>
              <Label>{t('modal-edit-location.location-name')}</Label>
              <Input
                placeholder={t('modal-edit-location.location-name-placeholder')}
                {...register('name')}
              />
              {formState.errors.name && (
                <p className='text-sm text-destructive'>
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            {filteredUsers && (
              <div className='grid gap-2'>
                <div className='flex items-center justify-between'>
                  <Label>{t('modal-edit-location.access-level')}</Label>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    {numChosen}
                    {' af '}
                    {filteredUsers.length} {t('modal-edit-location.users-chosen')}
                  </span>
                </div>
                <ScrollArea
                  className='border p-2 rounded-md'
                  maxHeight='max-h-60'>
                  <div className='space-y-2'>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(u => (
                        <div
                          key={u.id}
                          className='border rounded-sm p-2 flex items-center justify-between'>
                          <div className='flex flex-col'>
                            <span className='text-muted-foreground text-sm'>
                              {u.name}
                            </span>
                            <div className='flex items-center gap-1'>
                              <span className='text-xs text-muted-foreground/70 capitalize'>
                                {u.role}
                              </span>
                              <span className='text-muted-foreground text-xs'>•</span>
                              <span className='text-xs text-muted-foreground/70'>
                                {u.email}
                              </span>
                            </div>
                          </div>
                          <Switch
                            checked={formValues.userIDs.includes(u.id)}
                            onCheckedChange={(checked: boolean) => {
                              let users = formValues.userIDs

                              if (checked) {
                                users.push(u.id)
                              } else {
                                users = users.filter(us => us != u.id)
                              }

                              setValue('userIDs', users, {
                                shouldValidate: true,
                              })
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className='text-center mx-auto w-4/5 text-muted-foreground text-xs leading-5 space-y-2'>
                        <p>{t('modal-edit-location.create-more-users')}</p>
                        <p>{t('modal-edit-location.own-user')}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {formState.errors.userIDs && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.userIDs.message}
                  </p>
                )}
              </div>
            )}
            <Button
              className='w-full flex items-center gap-2'
              type='submit'
              disabled={pending || !formState.isValid}>
              {pending && <Icons.spinner className='animate-spin size-4' />}
              {t('modal-edit-location.create-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
