import { updatePlacementAction } from '@/app/[lng]/(site)/admin/placeringer/actions'
import { createPlacementValidation } from '@/app/[lng]/(site)/admin/placeringer/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Placement } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
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

export function ModalUpdatePlacement({
  placementToEdit,
  isOpen,
  setOpen,
}: {
  placementToEdit?: Placement
  isOpen: boolean
  setOpen: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'placeringer')

  const { handleSubmit, register, formState, setValue, reset, watch } = useForm<
    z.infer<typeof createPlacementValidation>
  >({
    resolver: zodResolver(createPlacementValidation),
    defaultValues: {
      name: placementToEdit?.name || '',
    },
  })

  async function onSubmit(values: z.infer<typeof createPlacementValidation>) {
    startTransition(async () => {
      if (!placementToEdit) {
        setError('Ingen placering at redigere')
        return
      }

      const response = await updatePlacementAction({
        placementID: placementToEdit.id,
        data: values,
      })

      if (response && response.serverError) {
        setError(response.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${values.name} ${t('toasts.placement-updated')}`,
      })
    })
  }

  useEffect(() => {
    if (placementToEdit) {
      setValue('name', placementToEdit.name)
    }
  }, [placementToEdit, setValue])

  function onOpenChange(open: boolean) {
    setOpen(open)
    reset()
    setError(undefined)
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-update-placement.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-update-placement.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='mt-2 mb-2'>
              <div className='grid gap-2'>
                <Label htmlFor='sku'>
                  {t('modal-update-placement.placement')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input id='name' type='text' {...register('name')} />
                {formState.errors.name && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type='submit'
              disabled={pending || !formState.isValid}
              className='w-full md:w-auto'>
              {t('modal-update-placement.update-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
