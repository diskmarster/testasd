'use client'

import { createNewLocationAction } from '@/app/[lng]/(site)/admin/organisation/actions'
import { createNewLocationValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
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
import { UserNoHash } from '@/lib/database/schema/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { User } from 'lucia'
import { usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'

interface Props {
  users?: UserNoHash[]
  user: User
  children: React.ReactNode
}

export function ModalCreateLocation({ user, users, children }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')
  const pathname = usePathname()

  const { handleSubmit, register, formState, reset, watch, setValue } = useForm<
    z.infer<typeof createNewLocationValidation>
  >({
    resolver: zodResolver(createNewLocationValidation),
    defaultValues: {
      userIDs: [user.id],
      customerID: user.customerID,
      pathname: pathname,
    },
  })

  const formValues = watch()

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const onSubmit = async (
    values: z.infer<typeof createNewLocationValidation>,
  ) => {
    startTransition(async () => {
      const res = await createNewLocationAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${values.name} ${t('toasts.location-created')}`,
      })
    })
  }

  const filteredUser = users ? users.filter(u => u.id != user.id && u.role != 'system_administrator' && u.role != 'administrator') : []
  const numChosen = formValues.userIDs.filter(id => filteredUsers.some((u) => u.id == id)).length

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>{children}</CredenzaTrigger>
      <CredenzaContent className='md:max-w-md'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-create-location.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-create-location.description')}
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
              <Label>{t('modal-create-location.location-name')}</Label>
              <Input
                placeholder={t(
                  'modal-create-location.location-name-placeholder',
                )}
                {...register('name')}
              />
              {formState.errors.name && (
                <p className='text-sm text-destructive'>
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            {filteredUser && (
              <div className='grid gap-2'>
                <div className='flex items-center justify-between'>
                  <Label>{t('modal-create-location.access-level')}</Label>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    {numChosen}
                    {t('modal-create-location.of')}
                    {filteredUser.length} {t('modal-create-location.users-chosen')}
                  </span>
                </div>
                <ScrollArea
                  className='border p-2 rounded-md'
                  maxHeight='max-h-60'>
                  <div className='space-y-2'>
                    {filteredUser.length > 1 ? (
                        filteredUser.map(u => (
                          <div
                            key={u.id}
                            className='border rounded-sm p-2 flex items-center justify-between'>
                            <div className='flex flex-col'>
                              <span className='text-muted-foreground text-sm font-semibold'>
                                {u.name}
                              </span>
                              <div className='flex items-center gap-1'>
                                <span className='text-xs text-muted-foreground/70 capitalize'>
                                  {u.role}
                                </span>
                                <span className='text-muted-foreground text-xs' >•</span>
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
                        <p>{t('modal-create-location.create-more-users')}</p>
                        <p>{t('modal-create-location.own-user')}</p>
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
              {t('modal-create-location.create-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
