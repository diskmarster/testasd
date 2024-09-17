'use client'

import { moveInventoryAction } from '@/app/(site)/oversigt/actions'
import { moveInventoryValidation } from '@/app/(site)/oversigt/validation'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { siteConfig } from '@/config/site'
import { FormattedInventory } from '@/data/inventory.types'
import { Customer } from '@/lib/database/schema/customer'
import {
  Batch,
  Placement,
  PlacementID,
  ProductID,
} from '@/lib/database/schema/inventory'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface Props {
  customer: Customer
  placements: Placement[]
  batches: Batch[]
  inventory: FormattedInventory[]
}

export function ModalMoveInventory({
  customer,
  placements,
  inventory,
  batches,
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const uniqueProducts = inventory.filter((item, index, self) => {
    return index === self.findIndex(i => i.product.id === item.product.id)
  })

  const placementsForProduct = (productID: ProductID) =>
    inventory.filter(item => item.product.id === productID)

  const batchesForProduct = (productID: ProductID, placementID: PlacementID) =>
    inventory.filter(
      item =>
        item.product.id === productID && item.placement.id === placementID,
    )

  //const fallbackPlacementID =
  //  customer.plan == 'plus'
  //    ? placements.find(placement => placement.name == '-')?.id
  //    : undefined
  const fallbackBatchID =
    customer.plan == 'plus'
      ? batches.find(batch => batch.batch == '-')?.id
      : undefined

  const {
    reset,
    handleSubmit,
    watch,
    setValue,
    formState,
    register,
    resetField,
  } = useForm<z.infer<typeof moveInventoryValidation>>({
    resolver: zodResolver(moveInventoryValidation),
    defaultValues: {
      amount: 0,
      fromPlacementID: undefined,
      fromBatchID: fallbackBatchID,
      toPlacementID: undefined,
    },
  })

  const formValues = watch()
  const hasProduct = formValues.productID != undefined

  const fromInventoryItem = inventory.find(
    item =>
      item.product.id === formValues.productID &&
      item.placement.id === formValues.fromPlacementID &&
      item.batch.id === formValues.fromBatchID,
  )

  function onSubmit(values: z.infer<typeof moveInventoryValidation>) {
    startTransition(async () => {
      const res = await moveInventoryAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      reset()
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `beholdning flyttet`,
      })
    })
  }

  function increment() {
    // @ts-ignore
    const nextValue = parseFloat(formValues.amount) + 1

    if (fromInventoryItem && nextValue > fromInventoryItem.quantity) return

    setValue('amount', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function decrement() {
    const nextValue = Math.max(0, formValues.amount - 1)
    setValue('amount', parseFloat(nextValue.toFixed(4)), {
      shouldValidate: true,
    })
  }

  function onOpenChange(open: boolean) {
    reset()
    setError(undefined)
    setOpen(open)
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.arrowLeftRight className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>Flyt beholdning</CredenzaTitle>
          <CredenzaDescription>
            Opdater beholdning ved at flytte en beholdning til en anden
            placering
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
            <div className='grid gap-2 flex-grow'>
              <Label>Produkt</Label>
              <Select
                value={
                  formValues.productID
                    ? formValues.productID.toString()
                    : undefined
                }
                onValueChange={(value: string) => {
                  resetField('fromPlacementID')
                  resetField('fromBatchID')
                  resetField('amount')
                  setValue('productID', parseInt(value), {
                    shouldValidate: true,
                  })
                }}>
                <SelectTrigger className='h-[58px]'>
                  <SelectValue placeholder='Vælg vare' />
                </SelectTrigger>
                <SelectContent>
                  {uniqueProducts.map((p, i) => (
                    <SelectItem
                      key={i}
                      value={p.product.id.toString()}
                      className='capitalize'>
                      <div className='flex flex-col gap items-start'>
                        <span className='font-semibold'>{p.product.text1}</span>
                        <span className='text-muted-foreground text-sm'>
                          {p.product.sku}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className='flex flex-col gap-4 md:flex-row bg-muted border-dashed border p-4 rounded-md'>
                <div className='grid gap-2 w-full'>
                  <Label>Fra placering</Label>
                  <Select
                    value={
                      formValues.fromPlacementID
                        ? formValues.fromPlacementID.toString()
                        : undefined
                    }
                    disabled={!hasProduct}
                    onValueChange={(value: string) => {
                      resetField('fromBatchID')
                      setValue('fromPlacementID', parseInt(value), {
                        shouldValidate: true,
                      })
                    }}>
                    <SelectTrigger className='bg-background'>
                      <SelectValue placeholder='Vælg placering' />
                    </SelectTrigger>
                    <SelectContent>
                      {placementsForProduct(formValues.productID).map(
                        (p, i) => (
                          <SelectItem
                            key={i}
                            value={p.placement.id.toString()}
                            className='capitalize'>
                            {p.placement.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {customer.plan == 'pro' && (
                  <div className='grid gap-2 w-full'>
                    <Label>Fra batch</Label>
                    <Select
                      value={
                        formValues.fromBatchID
                          ? formValues.fromBatchID.toString()
                          : undefined
                      }
                      disabled={!hasProduct}
                      onValueChange={(value: string) => {
                        //resetField('batchID')
                        setValue('fromBatchID', parseInt(value), {
                          shouldValidate: true,
                        })
                      }}>
                      <SelectTrigger className='bg-background'>
                        <SelectValue placeholder='Vælg batchnr.' />
                      </SelectTrigger>
                      <SelectContent>
                        {batchesForProduct(
                          formValues.productID,
                          formValues.fromPlacementID,
                        ).map((p, i) => (
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
                )}
              </div>

              <div className='flex items-center my-2 gap-1 flex-col'>
                <div className='rounded-full bg-primary opacity-60 dark:opacity-90 size-2' />
                <div className='rounded-full bg-primary opacity-30 dark:opacity-70 size-1.5' />
                <div className='rounded-full bg-primary opacity-20 dark:opacity-60 size-1' />
                <div className='rounded-full bg-primary opacity-30 dark:opacity-70 size-1.5' />
                <div className='rounded-full bg-primary opacity-60 dark:opacity-90 size-2' />
              </div>

              <div className='flex flex-col gap-4 md:flex-row bg-muted border border-dashed p-4 rounded-md'>
                <div className='grid gap-2 w-full'>
                  <Label>Til placering</Label>
                  <Select
                    value={
                      formValues.toPlacementID
                        ? formValues.toPlacementID.toString()
                        : undefined
                    }
                    disabled={!hasProduct}
                    onValueChange={(value: string) => {
                      setValue('toPlacementID', parseInt(value), {
                        shouldValidate: true,
                      })
                    }}>
                    <SelectTrigger className='bg-background'>
                      <SelectValue placeholder='Vælg placering' />
                    </SelectTrigger>
                    <SelectContent>
                      {placements
                        .filter(item => item.id != formValues.fromPlacementID)
                        .map((p, i) => (
                          <SelectItem
                            key={i}
                            value={p.id.toString()}
                            className='capitalize'>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className='pt-2 flex flex-col'>
              <div className='p-4 border border-b-0 rounded-t-md text-sm text-muted-foreground flex items-center gap-2 justify-center'>
                {fromInventoryItem ? (
                  <>
                    <p>Flytbar beholdning:</p>
                    <p>{fromInventoryItem.quantity}</p>
                  </>
                ) : (
                  <p>En beholdning skal vælges før du kan flytte vare</p>
                )}
              </div>
              <div className='flex'>
                <Button
                  size='icon'
                  type='button'
                  variant='outline'
                  className='h-14 w-28 border-r-0 rounded-r-none rounded-tl-none'
                  onClick={decrement}>
                  <Icons.minus className='size-6' />
                </Button>
                <Input
                  max={fromInventoryItem?.quantity}
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
                  className='h-14 w-28 border-l-0 rounded-l-none rounded-tr-none'
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
              Flyt
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
