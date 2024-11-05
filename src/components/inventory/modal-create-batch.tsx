'use client'
import { createBatchAction } from '@/app/[lng]/(site)/admin/batch/actions' // Adjust the action path
import { createBatchValidation } from '@/app/[lng]/(site)/admin/batch/validation'
import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Calendar } from '../ui/calendar'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

export function ModalCreateBatch() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'batch')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = createBatchValidation(validationT)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const router = useRouter()

  const onSubmit = (data: z.infer<typeof schema>) => {
    startTransition(async () => {
      const res = await createBatchAction({
        batchName: data.batchName,
        expiry: data.expiry,
      })
      if (res && res.serverError) {
        toast.error(t('create-batch-modal.toast-error'), {
          description: res.serverError,
        })
        return
      }
      toast.success(t('create-batch-modal.batch-created'), {
        description: `${t('create-batch-modal.new-batch')} ${data.batchName}`,
      })

      setOpen(false)

      router.refresh()
    })
  }

  const date = watch('expiry')
  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.plus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>
            {t('create-batch-modal.create-new-batch')}
          </CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            <div className='grid gap-2'>
              <Label>{t('create-batch-modal.batch-name')}</Label>
              <Input
                placeholder={t('create-batch-modal.batch-placeholder')}
                {...register('batchName')}
              />
              {errors.batchName && (
                <p className='text-sm text-destructive'>
                  {errors.batchName.message}
                </p>
              )}
            </div>
            <div className='grid gap-2'>
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
                    selected={date}
                    onSelect={value => setValue('expiry', value ?? new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting}
              className='w-full'>
              {isSubmitting ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : (
                t('create-batch-modal.create-batch-button')
              )}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
