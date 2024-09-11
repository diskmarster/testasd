'use client'

import { updateInventoryValidation } from '@/app/(site)/oversigt/validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { FormattedInventory } from '@/data/inventory.types'
import { Customer } from '@/lib/database/schema/customer'
import { PlacementID, ProductID } from '@/lib/database/schema/inventory'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface Props {
  customer: Customer
  inventory: FormattedInventory[]
}

export function ModalInventoryIncoming({ customer, inventory }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const uniqueProducts = inventory.filter((item, index, self) => {
    return index === self.findIndex(i => i.product.id === item.product.id)
  })

  const uniquePlacements = (productID: ProductID) =>
    uniqueProducts.filter(item => item.product.id == productID)

  const uniqueBatches = (productID: ProductID, placementID: PlacementID) =>
    uniquePlacements(productID).filter(item => item.placement.id, placementID)

  const {
    register,
    setValue,
    formState,
    reset,
    getValues,
    watch,
    handleSubmit,
    resetField,
  } = useForm<z.infer<typeof updateInventoryValidation>>({
    resolver: zodResolver(updateInventoryValidation),
    defaultValues: {
      type: 'tilgang',
      amount: 0,
      productID: undefined,
      placementID: undefined,
      batchID: undefined,
    },
  })

  function increment() {
    // @ts-ignore
    const nextValue = parseFloat(getValues().amount) + 1
    setValue('amount', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function decrement() {
    const nextValue = Math.max(0, getValues().amount - 1)
    setValue('amount', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  const productID = watch('productID')
  const placementID = watch('placementID')
  const batchID = watch('batchID')
  const type = watch('type')

  const isIncoming = type === 'tilgang'
  const hasProduct = productID != undefined
  const hasPlacement = placementID != undefined

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  function onSubmit(values: z.infer<typeof updateInventoryValidation>) {
    console.log(values)
  }

  console.log(formState.errors)
  console.log(getValues())

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.plus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-md'>
        <CredenzaHeader>
          <CredenzaTitle>Opdater beholdning</CredenzaTitle>
          <CredenzaDescription>
            Opdater beholdning ved at lave en tilgang eller afgang
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4'
            onSubmit={handleSubmit(onSubmit, () => toast.error('fejl'))}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='grid gap-2 flex-grow'>
              <Label>Produkt</Label>
              <Select
                value={productID ? productID.toString() : undefined}
                onValueChange={(value: string) => {
                  // @ts-ignore
                  setValue('placementID', undefined)
                  // @ts-ignore
                  setValue('batchID', undefined)
                  setValue('productID', parseInt(value), {
                    shouldValidate: true,
                  })
                }}>
                <SelectTrigger>
                  <SelectValue placeholder='Vælg vare' />
                </SelectTrigger>
                <SelectContent>
                  {uniqueProducts.map((p, i) => (
                    <SelectItem
                      key={i}
                      value={p.product.id.toString()}
                      className='capitalize'>
                      {p.product.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-4 md:flex-row'>
              <div className='grid gap-2 w-full'>
                <Label>Placering</Label>
                <Select
                  value={placementID ? placementID.toString() : undefined}
                  disabled={!hasProduct}
                  onValueChange={(value: string) => {
                    resetField('batchID')
                    setValue('placementID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder='Vælg placering' />
                  </SelectTrigger>
                  <SelectContent>
                    {uniquePlacements(productID).map((p, i) => (
                      <SelectItem
                        key={i}
                        value={p.placement.id.toString()}
                        className='capitalize'>
                        {p.placement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2 w-full'>
                <Label>Batchnr.</Label>
                <Select
                  value={batchID ? batchID.toString() : undefined}
                  disabled={!hasPlacement}
                  onValueChange={(value: string) =>
                    setValue('batchID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Vælg batchnr.' />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueBatches(productID, placementID).map((p, i) => (
                      <SelectItem
                        key={i}
                        value={p.batch.id.toString()}
                        className='capitalize'>
                        {p.batch.batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex items-center pt-2'>
              <Button
                type='button'
                className='w-full rounded-r-none'
                variant={isIncoming ? 'default' : 'secondary'}
                onClick={() =>
                  setValue('type', 'tilgang', { shouldValidate: true })
                }>
                Tilgang
              </Button>
              <Button
                type='button'
                className='w-full rounded-l-none'
                variant={!isIncoming ? 'default' : 'secondary'}
                onClick={() =>
                  setValue('type', 'afgang', { shouldValidate: true })
                }>
                Afgang
              </Button>
            </div>
            <div className='pt-2 flex flex-col gap-2'>
              <div className='flex'>
                <Button
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-14 w-28 border-r-0 rounded-r-none'
                  onClick={decrement}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  type='number'
                  {...register('amount')}
                  className={cn(
                    'w-full h-14 rounded-none text-center text-2xl z-10',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <Button
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-14 w-28 border-l-0 rounded-l-none'
                  onClick={increment}>
                  <Icons.plus className='size-6' />
                </Button>
              </div>
              {formState.errors.amount && (
                <p className='text-sm text-destructive'>
                  {formState.errors.amount.message}
                </p>
              )}
            </div>
            <Button
              disabled={!formState.isValid || pending || formState.isSubmitting}
              size='lg'
              className='w-full gap-2'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              Opret {isIncoming ? 'tilgang' : 'afgang'}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
