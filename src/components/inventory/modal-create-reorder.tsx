'use client'

import { createReorderAction } from '@/app/[lng]/(site)/genbestil/actions'
import { createReorderValidation } from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Product } from '@/lib/database/schema/inventory'
import { cn, formatNumber, updateChipCount } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AutoComplete } from '../ui/autocomplete'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogTriggerV2, DialogV2 } from '../ui/dialog-v2'

interface Props {
  products: Product[]
}

export function ModalCreateReorder({ products }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [searchValue, setSearchValue] = useState<string>('')
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = createReorderValidation(validationT)

  const productOptions = products
    .map(prod => ({
      label: prod.text1,
      value: prod.id.toString(),
    }))
    .filter(prod =>
      prod.label.toLowerCase().includes(searchValue.toLowerCase()),
    )

  function onOpenChange(open: boolean) {
    reset()
    setSearchValue('')
    setError(undefined)
    setOpen(open)
  }

  const { register, setValue, reset, handleSubmit, formState, watch } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      minimum: 0,
      buffer: 0,
    },
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
      const res = await createReorderAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      if (res && res.validationErrors) {
        setError(t('modal-create-reorder.error-occured'))
        return
      }

      setError(undefined)
      reset()
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${t('toasts.create-reorder')} ${products.find(prod => prod.id == formValues.productID)?.text1}`,
      })
      updateChipCount()
    })
  }

  return (
    <DialogV2 open={open} onOpenChange={onOpenChange}>
      <DialogTriggerV2 asChild>
        <Button size='icon' variant='outline' tooltip={t('modal-create-reorder.title')}>
          <Icons.plus className='size-4' />
        </Button>
      </DialogTriggerV2>
      <DialogContentV2 className='md:max-w-lg'>
        <DialogHeaderV2>
				<div className='flex items-center gap-2'>
						<Icons.plus className="size-4 text-primary" />
          <DialogTitleV2>{t('modal-create-reorder.title')}</DialogTitleV2>
				</div>
        </DialogHeaderV2>
          <form
					id='create-reorder-form'
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
            {t('modal-create-reorder.description')}
					</p>
            <div className='grid gap-2'>
              <Label>{t('modal-create-reorder.product')}</Label>
              <AutoComplete
                autoFocus={false}
                placeholder={t('modal-create-reorder.product-placeholder')}
                emptyMessage={t('modal-create-reorder.product-emptymessage')}
                items={productOptions}
                onSelectedValueChange={value =>
                  setValue('productID', parseInt(value))
                }
                onSearchValueChange={setSearchValue}
                selectedValue={
                  formValues.productID ? formValues.productID.toString() : ''
                }
                searchValue={searchValue}
              />
              {formState.errors.productID && (
                <p className='text-sm text-destructive'>
                  {formState.errors.productID.message}
                </p>
              )}
            </div>
            <div className='pt-2 flex flex-col gap-2'>
              <Label>{t('modal-create-reorder.minimum-stock')}</Label>
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
                    'w-full h-12 rounded-none text-center text-2xl z-10',
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
              <Label>{t('modal-create-reorder.restock-factor')}</Label>
              <p className='text-sm text-muted-foreground -mt-1.5'>
                {t('modal-create-reorder.restock-factor-description')}
              </p>
              <div className='flex flex-col'>
                <Input
                  type='number'
                  {...register('buffer')}
                  className={cn(
                    'w-full h-12 rounded-b-none text-center text-xl z-10',
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
                        'rounded-l-none',
                    )}
                    onClick={() =>
                      setValue('buffer', 25, { shouldValidate: true })
                    }>
                    25%
                  </Button>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className='h-10 w-1/4 rounded-none border-t-0 border-l-0'
                    onClick={() =>
                      setValue('buffer', 50, { shouldValidate: true })
                    }>
                    50%
                  </Button>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className='h-10 w-1/4 rounded-none border-t-0 border-l-0'
                    onClick={() =>
                      setValue('buffer', 75, { shouldValidate: true })
                    }>
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
                        'rounded-r-none',
                    )}
                    onClick={() =>
                      setValue('buffer', 100, { shouldValidate: true })
                    }>
                    100%
                  </Button>
                </div>
                <div
                  className={cn(
                    'bg-border rounded-b-md text-sm h-0 transition-all text-muted-foreground flex items-center gap-2 justify-center',
                    formValues.minimum > 0 && formValues.buffer > 0 && 'h-12 md:h-9',
                  )}>
                  {formValues.minimum > 0 && formValues.buffer > 0 && (
                    <p className='text-center'>
                      {t(
                        'modal-create-reorder.recommended-reorder-calculation1',
                      )}{' '}
                      {formatNumber(
                        formValues.minimum * (formValues.buffer / 100),
                      )}{' '}
                      {t(
                        'modal-create-reorder.recommended-reorder-calculation2',
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
            <Button
						form='create-reorder-form'
              disabled={!formState.isValid || pending || formState.isSubmitting}
              size='sm'
              className='gap-2'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {t('modal-create-reorder.create-button')}
            </Button>
					</DialogFooterV2>
      </DialogContentV2>
    </DialogV2>
  )
}
