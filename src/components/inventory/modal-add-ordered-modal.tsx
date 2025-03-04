'use client'

import { addOrderedToReorderAction } from '@/app/[lng]/(site)/genbestil/actions'
import { addOrderedToReorderValidation } from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { cn, updateChipCount } from '@/lib/utils'
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

export function ModalAddOrderedReorder({ }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [alreadyOrdered, setAlreadyOrdered] = useState<number>(0)
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')
  const schema = addOrderedToReorderValidation(t)
	const [text1, setText1] = useState<string>('')
	const [maxOrderAmount, setMaxOrderAmount] = useState<number>(0)

  const { register, setValue, reset, handleSubmit, formState, watch } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
  })

  useCustomEventListener('AddOrderedReorderByIDs', (data: any) => {
    setOpen(true)
    setValue('locationID', data.locationID)
    setValue('productID', data.productID)
    setValue('ordered', data.recommended.toFixed(2))
    setAlreadyOrdered(data.ordered)
		setText1(data.text1)
		setMaxOrderAmount(data.maxOrderAmount)
		console.log("max", data.maxOrderAmount)
  })

  const formValues = watch()

  function increment() {
    // @ts-ignore
    const nextValue = parseFloat(formValues.ordered + 1)
    setValue('ordered', parseFloat(nextValue.toFixed(2)), {
      shouldValidate: true,
    })
  }

  function decrement() {
    const nextValue = Math.max(0, formValues.ordered - 1)
    setValue('ordered', parseFloat(nextValue.toFixed(2)), {
      shouldValidate: true,
    })
  }

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const res = await addOrderedToReorderAction({
        ...values,
        ordered: values.ordered + alreadyOrdered,
      })

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      reset()
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('toasts.add-ordered')} ${text1}`,
      })
      updateChipCount()
    })
  }

  return (
	<DialogV2 open={open} onOpenChange={setOpen}>
      <DialogContentV2 className='md:max-w-lg'>
        <DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.plus className="size-4 text-primary" />
						<DialogTitleV2>{t('modal-add-ordered-reorder.title')}</DialogTitleV2>
					</div>
        </DialogHeaderV2>
          <form
						id='add-reorder-amount-form'
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
            {t('modal-add-ordered-reorder.description')}
					</p>
            <div className='grid gap-2'>
              <Label>{t('modal-add-ordered-reorder.product')}</Label>
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
              <Label>{t('modal-add-ordered-reorder.ordered-quantity')}</Label>
              <div className='flex'>
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-9 w-28 border-r-0 rounded-r-none'
                  onClick={decrement}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  step={0.01}
                  type='number'
                  {...register('ordered')}
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
                  onClick={increment}>
                  <Icons.plus className='size-6' />
                </Button>
              </div>
              {formState.errors.ordered && (
                <p className='text-sm text-destructive'>
                  {formState.errors.ordered.message}
                </p>
              )}
            </div>
          </form>
					<DialogFooterV2>
					<Button onClick={() => setOpen(false)} size='sm' variant='outline'>{t("bulk.btn-close")}</Button>
            <Button
							form='add-reorder-amount-form'
              disabled={
								!formState.isValid 
								|| pending 
								|| formState.isSubmitting 
								|| (maxOrderAmount>0 && formValues.ordered > maxOrderAmount)
							}
              size='sm'
              className='flex items-center gap-2'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {t('modal-add-ordered-reorder.add-button')}
            </Button>
					</DialogFooterV2>
      </DialogContentV2>
    </DialogV2>
  )
}
