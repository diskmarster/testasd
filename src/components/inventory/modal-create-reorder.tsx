'use client'

import { createReorderAction } from '@/app/(site)/genbestil/actions'
import { createReorderValidation } from '@/app/(site)/genbestil/validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { LocationID } from '@/lib/database/schema/customer'
import { Product } from '@/lib/database/schema/inventory'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AutoComplete } from '../ui/autocomplete'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface Props {
  locationID: LocationID
  products: Product[]
}

export function ModalCreateReorder({ locationID, products }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [searchValue, setSearchValue] = useState<string>('')
  const [pending, startTransition] = useTransition()

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
    z.infer<typeof createReorderValidation>
  >({
    resolver: zodResolver(createReorderValidation),
    defaultValues: {
      locationID: locationID,
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

  function onSubmit(values: z.infer<typeof createReorderValidation>) {
    startTransition(async () => {
      const res = await createReorderAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      reset()
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `Minimums beholdning oprettet for ${products.find(prod => prod.id == formValues.productID)?.text1}`,
      })
    })
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.plus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>Opret minimums beholdning</CredenzaTitle>
          <CredenzaDescription>
            Bliv gjort opmærksom på når en vare kommer under en minimums grænse
            som du selv bestemmer
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
              <AutoComplete
                autoFocus={false}
                placeholder='Søg i produkter...'
                emptyMessage='Ingen produkter fundet'
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
              <Label>Minimums beholdning</Label>
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
              <Label>Buffer rate (%)</Label>
              <p className='text-sm text-muted-foreground -mt-1.5'>
                Buffer raten bruges til at udregne en anbefalet genbestillings
                antal.
              </p>
              <div className='flex flex-col'>
                <Input
                  type='number'
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
                    className='h-14 w-1/4 rounded-tl-none rounded-r-none border-t-0'
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
                    className='h-14 w-1/4 border-t-0 border-l-0 rounded-l-none rounded-tr-none'
                    onClick={() => setValue('buffer', 100)}>
                    100%
                  </Button>
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
              Opret
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
