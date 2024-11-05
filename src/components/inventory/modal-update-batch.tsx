'use client'

import { updateBatchAction } from '@/app/[lng]/(site)/admin/batch/actions'
import { updateBatchValidation } from '@/app/[lng]/(site)/admin/batch/validation'
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
import { Batch } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'

export function ModalUpdateBatch({
  batchToEdit,
  isOpen,
  setOpen,
}: {
  batchToEdit: Batch
  isOpen: boolean
  setOpen: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'batch')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateBatchValidation(validationT)

  const { handleSubmit, register, formState, setValue, reset, watch } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      if (!batchToEdit) {
        setError(t('modal-update-batch.no-batch-to-edit'))
        return
      }

      const response = await updateBatchAction({
        batchID: batchToEdit.id!,
        data: {
          batch: values.data.batch,
          expiry: values.data.expiry,
        },
      })

      if (response && response.serverError) {
        setError(response.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('modal-update-batch.batch-updated-successfully')}`,
      })
    })
  }

  useEffect(() => {
    if (batchToEdit) {
      setValue('data.batch', batchToEdit.batch)
    }
  }, [batchToEdit, setValue])

  function onOpenChange(open: boolean) {
    setOpen(open)
    reset()
    setError(undefined)
  }

  console.log(formState.errors.data?.batch)
  console.log(formState.errors.data?.batch?.message)

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>
            {t('modal-update-batch.credenza-title')}
          </CredenzaTitle>
          <CredenzaDescription>
            {t('modal-update-batch.credenza-description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='mt-2 mb-2'>
              <div className='grid gap-2'>
                <Label htmlFor='sku'>
                  {t('modal-update-batch.batch')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input id='name' type='text' {...register('data.batch')} />
                {formState.errors.data?.batch && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.data.batch.message}
                  </p>
                )}
              </div>
            </div>
            <Button
              type='submit'
              disabled={pending || !formState.isValid}
              className='w-full md:w-auto'>
              {t('modal-update-batch.update-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
