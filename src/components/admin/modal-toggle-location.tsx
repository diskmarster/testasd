'use client'

import { changeLocationStatusAction } from '@/app/[lng]/(site)/admin/organisation/actions'
import { changeLocationStatusValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function ModalToggleLocation() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  const { setValue, handleSubmit, formState, watch, reset } = useForm<
    z.infer<typeof changeLocationStatusValidation>
  >({
    resolver: zodResolver(changeLocationStatusValidation),
  })

  const formValues = watch()

  useCustomEventListener('ToggleLocationByID', (data: any) => {
    setOpen(true)
    setValue('locationIDs', data.locationIDs, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof changeLocationStatusValidation>) {
    startTransition(async () => {
      const res = await changeLocationStatusAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${formValues.locationIDs.length} ${formValues.locationIDs.length == 1 ? t('toasts.location') : t('toasts.locations')} ${t('toasts.locations-toggle')}`,
      })
    })
  }

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-sm'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-toggle-location.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-toggle-location.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 pb-4 md:pb-0'>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid gap-2'>
              <Label htmlFor='groupID'>
                {t('modal-toggle-location.status')}
              </Label>
              <Select
                onValueChange={(value: 'active' | 'inactive') =>
                  setValue('status', value, {
                    shouldValidate: true,
                  })
                }>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('modal-toggle-location.choose-status')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>
                    {t('modal-toggle-location.active')}
                  </SelectItem>
                  <SelectItem value='inactive'>
                    {t('modal-toggle-location.inactive')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-2 md:flex-row md:justify-end'>
              <CredenzaClose asChild>
                <Button
                  type='button'
                  size='lg'
                  variant='secondary'
                  className='w-full'>
                  {t('modal-toggle-location.cancel-button')}
                </Button>
              </CredenzaClose>
              <Button
                disabled={
                  !formState.isValid || pending || formState.isSubmitting
                }
                variant='default'
                size='lg'
                className='w-full gap-2'>
                {pending && <Icons.spinner className='size-4 animate-spin' />}
                {t('modal-toggle-location.update-button')}
              </Button>
            </div>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
