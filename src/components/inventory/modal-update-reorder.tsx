'use client'

import { updateReorderAction } from '@/app/[lng]/(site)/genbestil/actions'
import { updateReorderValidation } from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Product } from '@/lib/database/schema/inventory'
import { cn, formatNumber } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogV2 } from '../ui/dialog-v2'

interface Props {
  products: Product[]
}

export function ModalUpdateReorder({ products }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateReorderValidation(validationT)

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
    setValue('buffer', data.buffer.toFixed(2))
  })

  const formValues = watch()

  function increment() {
    // @ts-ignore
    const nextValue = parseFloat(formValues.minimum) + 1
    setValue('minimum', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function decrement() {
    const nextValue = Math.max(0, formValues.minimum - 1)
    setValue('minimum', parseFloat(nextValue.toFixed(4)), {
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
        description: `${t('toasts.update-reorder')} ${products.find(prod => prod.id == formValues.productID)?.text1}`,
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
                defaultValue={
                  products.find(prod => prod.id === formValues.productID)?.text1
                }
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
                  className='h-12 w-28 border-r-0 rounded-r-none'
                  onClick={decrement}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  type='number'
                  step={0.01}
                  {...register('minimum')}
                  className={cn(
                    'w-full h-12 rounded-none text-center text-xl z-10',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-12 w-28 border-l-0 rounded-l-none'
                  onClick={increment}>
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
              <Label>{t('modal-update-reorder.restock-factor')}</Label>
              <p className='text-sm text-muted-foreground -mt-1.5'>
                {t('modal-update-reorder.restock-factor-description')}
              </p>
              <div className='flex flex-col'>
                <Input
                  type='number'
                  step={0.01}
                  {...register('buffer')}
                  className={cn(
                    'w-full h-12 rounded-b-none text-center text-xl z-10 shadow-none',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <div className='flex'>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className={cn(
                      'h-10 w-1/4 rounded-tl-none rounded-r-none border-t-0',
                      formValues.minimum != 0 &&
                      formValues.buffer != 0 &&
                      'rounded-1-none',
                    )}
                    onClick={() => setValue('buffer', 25)}>
                    25%
                  </Button>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className='h-10 w-1/4 rounded-none border-t-0 border-l-0'
                    onClick={() => setValue('buffer', 50)}>
                    50%
                  </Button>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className='h-10 w-1/4 rounded-none border-t-0 border-l-0'
                    onClick={() => setValue('buffer', 75)}>
                    75%
                  </Button>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className={cn(
                      'h-10 w-1/4 border-t-0 border-l-0 rounded-l-none rounded-tr-none',
                      formValues.minimum != 0 &&
                      formValues.buffer != 0 &&
                      'rounded-1-none',
                    )}
                    onClick={() => setValue('buffer', 100)}>
                    100%
                  </Button>
                </div>
                <div
                  className={cn(
                    'bg-border rounded-b-md text-sm h-0 transition-all text-muted-foreground flex items-center gap-2 justify-center',
                    formValues.minimum && formValues.buffer && 'h-12 md:h-9',
                  )}>
                  {formValues.minimum != 0 && formValues.buffer != 0 && (
                    <p className='text-center'>
                      {t(
                        'modal-update-reorder.recommended-reorder-calculation1',
                      )}{' '}
                      {formatNumber((formValues.minimum * (formValues.buffer / 100)))}{' '}
                      {t(
                        'modal-update-reorder.recommended-reorder-calculation2',
                      )}
                    </p>
                  )}
                </div>
              </div>
              {formState.errors.buffer && (
                <p className='text-sm text-destructive'>
                  {formState.errors.buffer.message}
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
