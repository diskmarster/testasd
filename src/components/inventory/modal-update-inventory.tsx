'use client'

import { updateInventoryAction } from '@/app/(site)/oversigt/actions'
import { updateInventoryValidation } from '@/app/(site)/oversigt/validation'
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
import { Customer } from '@/lib/database/schema/customer'
import { Batch, Placement, Product } from '@/lib/database/schema/inventory'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
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
  products: Product[]
  placements: Placement[]
  batches: Batch[]
}

export function ModalUpdateInventory({
  customer,
  products,
  placements,
  batches,
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [newPlacement, setNewPlacement] = useState(false)
  const [newBatch, setNewBatch] = useState(false)

  const fallbackPlacementID =
    customer.plan == 'lite'
      ? placements.find(placement => placement.name == '-')?.id
      : undefined
  const fallbackBatchID =
    customer.plan != 'pro'
      ? batches.find(batch => batch.batch == '-')?.id
      : undefined

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
      placementID: fallbackPlacementID,
      batchID: fallbackBatchID,
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
    setError(undefined)
    setNewBatch(false)
    setNewPlacement(false)
    setOpen(open)
  }

  function onSubmit(values: z.infer<typeof updateInventoryValidation>) {
    startTransition(async () => {
      const res = await updateInventoryAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      reset()
      setOpen(false)
      setNewBatch(false)
      setNewPlacement(false)
      toast.success(siteConfig.successTitle, {
        description: `${isIncoming ? 'Tilgang' : 'Afgang'} blev oprettet`,
      })
    })
  }

  useCustomEventListener('UpdateInventoryByIDs', (data: any) => {
    setOpen(true)
    setValue('productID', data.productID)
    setValue('placementID', data.placementID)
    setValue('batchID', data.batchID)
  })

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.diff className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>Opdater beholdning</CredenzaTitle>
          <CredenzaDescription>
            Opdater beholdning ved at lave en tilgang eller afgang
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
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
                  setValue('productID', parseInt(value), {
                    shouldValidate: true,
                  })
                }}>
                <SelectTrigger className='h-[58px]'>
                  <SelectValue placeholder='Vælg vare' />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p, i) => (
                    <SelectItem
                      key={i}
                      value={p.id.toString()}
                      className='capitalize'>
                      <div className='flex flex-col gap items-start'>
                        <span className='font-semibold'>{p.text1}</span>
                        <span className='text-muted-foreground text-sm'>
                          {p.sku}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {customer.plan != 'lite' && (
              <div className='flex flex-col gap-4 md:flex-row'>
                <div className='grid gap-2 w-full'>
                  <div className='flex items-center justify-between h-4'>
                    <Label>Placering</Label>
                    <span
                      className={cn(
                        'text-sm md:text-xs cursor-pointer hover:underline text-muted-foreground select-none',
                        !isIncoming && 'hidden',
                      )}
                      onClick={() => {
                        resetField('placementID')
                        setNewPlacement(prev => !prev)
                      }}>
                      {newPlacement ? 'Brug eksisterende' : 'Opret ny'}
                    </span>
                  </div>
                  {newPlacement ? (
                    <Input
                      autoFocus
                      placeholder='Skriv ny placering'
                      {...register('placementID')}
                    />
                  ) : (
                    <Select
                      value={placementID ? placementID.toString() : undefined}
                      disabled={!hasProduct}
                      onValueChange={(value: string) => {
                        //resetField('batchID')
                        setValue('placementID', parseInt(value), {
                          shouldValidate: true,
                        })
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder='Vælg placering' />
                      </SelectTrigger>
                      <SelectContent>
                        {placements.map((p, i) => (
                          <SelectItem
                            key={i}
                            value={p.id.toString()}
                            className='capitalize'>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {customer.plan == 'pro' && (
                  <div className='grid gap-2 w-full'>
                    <div className='flex items-center justify-between h-4'>
                      <Label>Batchnr.</Label>
                      <span
                        className={cn(
                          'text-sm md:text-xs cursor-pointer hover:underline text-muted-foreground select-none',
                          !isIncoming && 'hidden',
                        )}
                        onClick={() => {
                          resetField('batchID')
                          setNewBatch(prev => !prev)
                        }}>
                        {newBatch ? 'Brug eksisterende' : 'Opret ny'}
                      </span>
                    </div>
                    {newBatch ? (
                      <Input
                        autoFocus
                        placeholder='Skriv ny batchnr.'
                        {...register('batchID')}
                      />
                    ) : (
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
                          {batches.map((p, i) => (
                            <SelectItem
                              key={i}
                              value={p.id.toString()}
                              className='capitalize'>
                              {p.batch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            )}
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
                onClick={() => {
                  setNewPlacement(false)
                  setNewBatch(false)
                  if (newPlacement || newBatch) {
                    resetField('placementID')
                    resetField('batchID')
                  }
                  setValue('type', 'afgang', { shouldValidate: true })
                }}>
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
