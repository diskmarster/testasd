import { updateUnitAction } from '@/app/[lng]/(site)/sys/enheder/actions'
import { siteConfig } from '@/config/site'
import { Unit } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

import { createUnitValidation } from '@/app/[lng]/(site)/sys/enheder/validation'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
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

export function ModalUpdateUnit({
  unitToEdit,
  isOpen,
  setOpen,
}: {
  unitToEdit?: Unit
  isOpen: boolean
  setOpen: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'enheder')

  const { handleSubmit, register, formState, setValue, reset } = useForm<
    z.infer<typeof createUnitValidation>
  >({
    resolver: zodResolver(createUnitValidation),
    defaultValues: {
      name: unitToEdit?.name || '',
    },
  })

  async function onSubmit(values: z.infer<typeof createUnitValidation>) {
    startTransition(async () => {
      if (!unitToEdit) {
        setError('No unit to edit')
        return
      }

      const response = await updateUnitAction({
        unitID: unitToEdit.id,
        data: values,
      })

      if (response && response.serverError) {
        setError(response.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${values.name} ${t('toasts.unit-updated')}`,
      })
    })
  }

  useEffect(() => {
    if (unitToEdit) {
      setValue('name', unitToEdit.name)
    }
  }, [unitToEdit, setValue])

  function onOpenChange(open: boolean) {
    setOpen(open)
    reset()
    setError(undefined)
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>
            {t('modal-update-unit.update-unit-title')}
          </CredenzaTitle>
          <CredenzaDescription>
            {t('modal-update-unit.update-unit-description')}
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
                  {t('modal-update-unit.unit-name')}
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
              {t('modal-update-unit.update-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
