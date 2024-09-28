import { updateUnitAction } from '@/app/(site)/sys/enheder/actions'
import { siteConfig } from '@/config/site'
import { Unit } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

import { createUnitValidation } from '@/app/(site)/sys/enheder/validation'
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

  const { handleSubmit, register, formState, setValue, reset} = useForm<
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
      toast.success(siteConfig.successTitle, {
        description: 'Enheden er opdateret succesfuldt.',
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
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Rediger enhed</CredenzaTitle>
          <CredenzaDescription>
            Her kan du redigere en enhed
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='grid gap-4 mb-4 md:mb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='sku'>
                  Navn på enhed
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
            <Button type='submit' disabled={pending || !formState.isValid}>
              Opdater
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
