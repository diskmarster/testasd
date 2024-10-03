'use client'

import { addOrderedToReorderAction } from '@/app/(site)/genbestil/actions'
import { addOrderedToReorderValidation } from '@/app/(site)/genbestil/validation'
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

export function ModalAddOrderedReorder({ products }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [alreadyOrdered, setAlreadyOrdered] = useState<number>(0)

  const { register, setValue, reset, handleSubmit, formState, watch } = useForm<
    z.infer<typeof addOrderedToReorderValidation>
  >({
    resolver: zodResolver(addOrderedToReorderValidation),
  })

  useCustomEventListener('AddOrderedReorderByIDs', (data: any) => {
    setOpen(true)
    setValue('locationID', data.locationID)
    setValue('productID', data.productID)
    setValue('ordered', data.recommended)
    setAlreadyOrdered(data.ordered)
  })

  const formValues = watch()

  function increment() {
    // @ts-ignore
    const nextValue = parseFloat(formValues.ordered) + 1
    setValue('ordered', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function decrement() {
    const nextValue = Math.max(0, formValues.ordered - 1)
    setValue('ordered', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function onSubmit(values: z.infer<typeof addOrderedToReorderValidation>) {
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
      toast.success(siteConfig.successTitle, {
        description: `Bestilling registreret for ${products.find(prod => prod.id == formValues.productID)?.text1}`,
      })
    })
  }

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>Tilføj bestilt antal</CredenzaTitle>
          <CredenzaDescription>
            Det bestilte antal vil automatisk blive opdateret når der laves en
            tilgang på dette produkt
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
              <Label>Produkt</Label>
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
              <Label>Antal bestilt</Label>
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
                  step={0.01}
                  type='number'
                  {...register('ordered')}
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
              {formState.errors.ordered && (
                <p className='text-sm text-destructive'>
                  {formState.errors.ordered.message}
                </p>
              )}
            </div>
            <Button
              disabled={!formState.isValid || pending || formState.isSubmitting}
              size='lg'
              className='w-full gap-2'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              Tilføj
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
