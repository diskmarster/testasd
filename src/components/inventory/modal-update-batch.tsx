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
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverTrigger } from '@radix-ui/react-popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent } from '../ui/popover'

export function ModalUpdateBatch() {
  const [pending, startTransition] = useTransition()
  const [isOpen, setOpen] = useState<boolean>(false)
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

  const formValues = watch()

  async function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const response = await updateBatchAction(values)

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

  useCustomEventListener('UpdateBatchByID', (data: { batch: Batch }) => {
    setValue('batchID', data.batch.id)
    setValue('data', data.batch, { shouldValidate: true })
    setOpen(true)
  })

  function onOpenChange(open: boolean) {
    setOpen(open)
    reset()
    setError(undefined)
  }

  const date = watch('data.expiry')

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
            <div className='grid gap-2'>
              <Label htmlFor='batch'>
                {t('modal-update-batch.batch')}
                <span className='text-destructive'> * </span>
              </Label>
              <Input id='name' type='text' {...register('data.batch')} />
              {formState.errors.data?.batch && (
                <p className='text-sm text-destructive'>
                  {formState.errors.data.batch.message}
                </p>
              )}
              <div className='grid gap-2 mt-2'>
                <Label>{t('create-batch-modal.expiration-date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[280px] justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                      )}>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {date ? (
                        format(date, 'PPP')
                      ) : (
                        <span>{t('create-batch-modal.choose-date')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={date ?? undefined}
                      onSelect={value =>
                        setValue('data.expiry', value ?? new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
