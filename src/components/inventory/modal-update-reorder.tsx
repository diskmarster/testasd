'use client'

import { updateReorderAction } from '@/app/[lng]/(site)/genbestil/actions'
import { updateReorderValidation } from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogV2 } from '../ui/dialog-v2'

interface Props { }

export function ModalUpdateReorder({}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')
  const schema = updateReorderValidation(t)
	const [text1, setText1] = useState<string>()

  const { register, setValue, reset, handleSubmit, formState, watch } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
  })

  useCustomEventListener('UpdateReorderByIDs', (data: any) => {
    setOpen(true)
    setValue('locationID', data.locationID)
    setValue('productID', data.productID)
    setValue('minimum', data.minimum)
    setValue('orderAmount', data.orderAmount)
    setValue('maxOrderAmount', data.maxOrderAmount)
		setText1(data.text1)
  })

  const formValues = watch()

  function increment(key: 'minimum' | 'maxOrderAmount' | 'orderAmount') {
    // @ts-ignore
    const nextValue = parseFloat(formValues[key] + 1)
    setValue(key, parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function decrement(key: 'minimum' | 'maxOrderAmount' | 'orderAmount') {
    const nextValue = Math.max(0, formValues[key] - 1)
    setValue(key, parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const res = await updateReorderAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

			onOpenChange(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('toasts.update-reorder')} ${text1}`,
      })
    })
  }

	function onOpenChange(open: boolean) {
      setError(undefined)
      reset()
      setOpen(open)
	}

  return (
    <DialogV2 open={open} onOpenChange={onOpenChange}>
      <DialogContentV2 className='md:max-w-lg'>
        <DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.pencil className="size-4 text-primary" />
						<DialogTitleV2>{t('modal-update-reorder.title')}</DialogTitleV2>
					</div>
        </DialogHeaderV2>
          <form
						id='update-reorder-form'
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 px-3'>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
					<p className="text-sm text-muted-foreground">
            {t('modal-update-reorder.description')}
					</p>
            <div className='grid gap-2'>
              <Label>{t('modal-update-reorder.product')}</Label>
              <Input
                defaultValue={text1}
                disabled
              />
              {formState.errors.productID && (
                <p className='text-sm text-destructive'>
                  {formState.errors.productID.message}
                </p>
              )}
            </div>
            <div className='pt-2 flex flex-col gap-2'>
              <Label>{t('modal-update-reorder.minimum-stock')}</Label>
              <div className='flex'>
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-9 w-28 border-r-0 rounded-r-none'
                  onClick={() => decrement('minimum')}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  type='number'
                  step={0.01}
                  {...register('minimum')}
                  className={cn(
                    'w-full h-9 rounded-none text-center text-xl z-10',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-9 w-28 border-l-0 rounded-l-none'
                  onClick={() => increment('minimum')}>
                  <Icons.plus className='size-6' />
                </Button>
              </div>
              {formState.errors.minimum && (
                <p className='text-sm text-destructive'>
                  {formState.errors.minimum.message}
                </p>
              )}
            </div>
            <div className='pt-2 flex flex-col gap-2'>
              <Label>{t('modal-create-reorder.orderAmount')}</Label>
              <p className='text-sm text-muted-foreground -mt-1.5'>
                {t('modal-create-reorder.orderAmount-description')}
              </p>
              <div className='flex'>
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-9 w-28 border-r-0 rounded-r-none'
                  onClick={() => decrement('orderAmount')}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  type='number'
                  step={0.01}
                  {...register('orderAmount')}
                  className={cn(
                    'w-full h-9 rounded-none text-center text-xl z-10',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-9 w-28 border-l-0 rounded-l-none'
                  onClick={() => increment('orderAmount')}>
                  <Icons.plus className='size-6' />
                </Button>
              </div>
              {formState.errors.orderAmount && (
                <p className='text-sm text-destructive'>
                  {formState.errors.orderAmount.message}
                </p>
              )}
            </div>
            <div className='pt-2 flex flex-col gap-2'>
              <Label>{t('modal-create-reorder.maxAmount')}</Label>
              <p className='text-sm text-muted-foreground -mt-1.5'>
                {t('modal-create-reorder.maxAmount-description')}
              </p>
              <div className='flex'>
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-9 w-28 border-r-0 rounded-r-none'
                  onClick={() => decrement('maxOrderAmount')}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  type='number'
                  step={0.01}
                  {...register('maxOrderAmount')}
                  className={cn(
                    'w-full h-9 rounded-none text-center text-xl z-10',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-9 w-28 border-l-0 rounded-l-none'
                  onClick={() => increment('maxOrderAmount')}>
                  <Icons.plus className='size-6' />
                </Button>
              </div>
              {formState.errors.maxOrderAmount && (
                <p className='text-sm text-destructive'>
                  {formState.errors.maxOrderAmount.message}
                </p>
              )}
            </div>
          </form>
					<DialogFooterV2>
						<Button onClick={() => onOpenChange(false)} size='sm' variant='outline'>{t("bulk.btn-close")}</Button>
            <Button
              disabled={!formState.isValid || pending || formState.isSubmitting}
              size='sm'
							form='update-reorder-form'
              className='flex items-center gap-2'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {t('modal-update-reorder.update-button')}
            </Button>
					</DialogFooterV2>
      </DialogContentV2>
    </DialogV2>
  )
}
