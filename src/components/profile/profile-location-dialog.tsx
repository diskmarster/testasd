'use client'

import { updatePrimaryLocationAction } from '@/app/[lng]/(site)/profil/actions'
import { updatePrimaryLocationValidation } from '@/app/[lng]/(site)/profil/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { LocationID, LocationWithPrimary } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '../ui/credenza'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function LocationDialog({
  locations,
}: {
  locations: LocationWithPrimary[]
}) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'profil')
  const { session } = useSession()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)

  const primaryLocation = locations.find(loc => loc.isPrimary)

  const { handleSubmit, formState, reset, getValues, setValue } = useForm<
    z.infer<typeof updatePrimaryLocationValidation>
  >({
    resolver: zodResolver(updatePrimaryLocationValidation),
    defaultValues: {
      locationID: primaryLocation?.id,
    },
  })

  if (!session) return null
  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant='outline' className='hover:text-destructive'>
          {t('profile-location-dialog.title')}
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <form className='space-y-4'>
          <CredenzaHeader>
            <CredenzaTitle>{t('profile-location-dialog.title')}</CredenzaTitle>
            <CredenzaDescription>
              {t('profile-location-dialog.description')}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className={cn('grid w-full items-start gap-4 md:max-w-lg')}>
              {formError && (
                <Alert variant='destructive'>
                  <Icons.alert className='size-4 !top-3' />
                  <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className='grid gap-2'>
                <Label htmlFor='role'>
                  {t('profile-location-dialog.location')}
                </Label>
                <Select
                  defaultValue={getValues().locationID}
                  onValueChange={value =>
                    setValue('locationID', value as LocationID, {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger id='role'>
                    <SelectValue
                      placeholder={t(
                        'profile-location-dialog.location-placeholder',
                      )}
                      className='capitalize'
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc, i) => (
                      <SelectItem key={i} value={loc.id} className='capitalize'>
                        <div className='flex items-center gap-1'>
                          <p>{loc.name}</p>
                          {loc.isPrimary && (
                            <Icons.star className='size-3 fill-warning text-warning' />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.locationID && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.locationID.message}
                  </p>
                )}
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant='link'>
                {t('profile-location-dialog.cancel-button')}
              </Button>
            </CredenzaClose>
            <Button
              disabled={
                !getValues().locationID ||
                getValues().locationID == primaryLocation?.id
              }
              type='submit'
              className='flex items-center gap-2'
              onClick={handleSubmit(values => {
                startTransition(async () => {
                  reset()
                  const res = await updatePrimaryLocationAction({ ...values })
                  if (res && res.serverError) {
                    setFormError(res.serverError)
                    return
                  }
                  toast(siteConfig.successTitle, {
                    description: `Hovedlokation opdateret til ${locations.find(loc => loc.id == values.locationID)?.name ?? 'Unavngivet'}`,
                  })
                  setOpen(false)
                  setValue('locationID', values.locationID)
                })
              })}>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {t('profile-location-dialog.update-button')}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  )
}
