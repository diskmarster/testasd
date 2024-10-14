'use client'

import { updateReorderAction } from '@/app/[lng]/(site)/genbestil/actions'
import { updateReorderValidation } from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Product } from '@/lib/database/schema/inventory'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface Props {
  products: Product[]
}

export function ModalUpdateReorder({ products }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')

  const { register, setValue, reset, handleSubmit, formState, watch } = useForm<
    z.infer<typeof updateReorderValidation>
  >({
    resolver: zodResolver(updateReorderValidation),
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

  function onSubmit(values: z.infer<typeof updateReorderValidation>) {
    startTransition(async () => {
      const res = await updateReorderAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      reset()
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `Genbestil opdateret for ${products.find(prod => prod.id == formValues.productID)?.text1}`,
      })
    })
  }

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-update-reorder.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-update-reorder.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 pb-4 md:pb-0'>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
                  className='h-14 w-28 border-r-0 rounded-r-none'
                  onClick={decrement}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  type='number'
                  step={0.01}
                  {...register('minimum')}
                  className={cn(
                    'w-full h-14 rounded-none text-center text-2xl z-10',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <Button
                  tabIndex={-1}
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-14 w-28 border-l-0 rounded-l-none'
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
                    'w-full h-14 rounded-b-none text-center text-2xl z-10',
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
                      'h-14 w-1/4 rounded-tl-none rounded-r-none border-t-0',
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
                    className='h-14 w-1/4 rounded-none border-t-0 border-l-0'
                    onClick={() => setValue('buffer', 50)}>
                    50%
                  </Button>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className='h-14 w-1/4 rounded-none border-t-0 border-l-0'
                    onClick={() => setValue('buffer', 75)}>
                    75%
                  </Button>
                  <Button
                    tabIndex={-1}
                    size='icon'
                    type='button'
                    variant='outline'
                    className={cn(
                      'h-14 w-1/4 border-t-0 border-l-0 rounded-l-none rounded-tr-none',
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
                      {(formValues.minimum * (formValues.buffer / 100)).toFixed(
                        2,
                      )}{' '}
                      {t(
                        'modal-update-reorder.recommended-reorder-calculation2',
                      )}
                    </p>
                  )}
                </div>
              </div>
              {formState.errors.minimum && (
                <p className='text-sm text-destructive'>
                  {formState.errors.minimum.message}
                </p>
              )}
            </div>
            <Button
              disabled={!formState.isValid || pending || formState.isSubmitting}
              size='lg'
              className='w-full gap-2'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {t('modal-update-reorder.update-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
