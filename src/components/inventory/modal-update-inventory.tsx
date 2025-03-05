'use client'

import { updateInventoryAction } from '@/app/[lng]/(site)/oversigt/actions'
import { updateInventoryValidation } from '@/app/[lng]/(site)/oversigt/validation'
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
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { Batch, Placement, Product } from '@/lib/database/schema/inventory'
import { cn, updateChipCount } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AutoComplete } from '../ui/autocomplete'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { hasPermissionByPlan } from '@/data/user.types'

interface Props {
  customer: Customer
  products: Product[]
  placements: Placement[]
  batches: Batch[]
  lng: string
  settings: Pick<CustomerSettings, "useReference" | "usePlacement" | "useBatch">
}

export function ModalUpdateInventory({
  customer,
  products,
  placements,
  batches,
  lng,
  settings,
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [newPlacement, setNewPlacement] = useState(false)
  const [newBatch, setNewBatch] = useState(false)
  const [useReference, setUseReference] = useState(false)
  const [searchProduct, setSearchProduct] = useState<string>('')
  const [searchBatch, setSearchBatch] = useState<string>('')
  const [searchPlacement, setSearchPlacement] = useState<string>('')
  const { t } = useTranslation(lng, 'oversigt')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateInventoryValidation(validationT)

  const productOptions = products
    .filter(
      prod =>
        prod.text1.toLowerCase().includes(searchProduct.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchProduct.toLowerCase()),
    )
    .map(prod => ({
      label: prod.text1,
      value: prod.id.toString(),
    }))

  const placementOptions = placements
    .filter(placement =>
      placement.name.toLowerCase().includes(searchPlacement.toLowerCase()),
    )
    .map(placement => ({
      label: placement.name,
      value: placement.id.toString(),
    }))

  const batchOptions = batches
    .filter(batch =>
      batch.batch.toLowerCase().includes(searchBatch.toLowerCase()),
    )
    .map(batch => ({
      label: batch.batch,
      value: batch.id.toString(),
    }))

  const fallbackPlacementID =
    settings.usePlacement 
      && hasPermissionByPlan(customer.plan, 'basis')
      ? undefined
      : placements.find(placement => placement.name == '-')?.id
  const fallbackBatchID =
    settings.useBatch 
      && hasPermissionByPlan(customer.plan, 'pro')
        ? undefined
        : batches.find(batch => batch.batch == '-')?.id

  const {
    register,
    setValue,
    formState,
    reset,
    getValues,
    watch,
    handleSubmit,
    resetField,
    setFocus,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
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
    setSearchProduct('')
    setSearchPlacement('')
    setSearchBatch('')
    setOpen(open)
  }

  function onUseReferenceChange(val: boolean) {
    setUseReference(val)
    if (val == true) {
      setFocus('reference')
    }
  }

  function onSubmit(values: z.infer<typeof schema>) {
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
      setUseReference(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${isIncoming ? t('incoming') : t('outgoing')} ${t('toasts.was-created')}`,
      })
      updateChipCount()
    })
  }

  useCustomEventListener('UpdateInventoryByIDs', (data: any) => {
    setOpen(true)
    setSearchProduct(data.productName)
    setSearchPlacement(data.placementName)
    setSearchBatch(data.batchName)
    setValue('productID', data.productID, { shouldValidate: true })
    setValue('placementID', data.placementID, { shouldValidate: true })
    setValue('batchID', data.batchID, { shouldValidate: true })
  })

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline' tooltip={t('update-inventory')}>
          <Icons.plusMinus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>{t('update-inventory')}</CredenzaTitle>
          <CredenzaDescription>
            {t('update-inventory-description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='grid gap-2'>
              <Label>{t('product')}</Label>
              <AutoComplete
                autoFocus={false}
                placeholder={t('product-placeholder')}
                emptyMessage={t('product-empty-message')}
                items={productOptions}
                onSelectedValueChange={value =>
                  setValue('productID', parseInt(value))
                }
                onSearchValueChange={setSearchProduct}
                selectedValue={productID ? productID.toString() : ''}
                searchValue={searchProduct}
              />
              {formState.errors.productID && (
                <p className='text-sm text-destructive'>
                  {formState.errors.productID.message}
                </p>
              )}
            </div>
            {hasPermissionByPlan(customer.plan, 'lite') && (settings.usePlacement || settings.useBatch) && (
              <div className='flex flex-col gap-4 md:flex-row'>
                {settings.usePlacement && (
                  <div className='grid gap-2 w-full'>
                    <div className='flex items-center justify-between h-4'>
                      <Label>{t('placement')}</Label>
                      <span
                        className={cn(
                          'text-sm md:text-xs cursor-pointer hover:underline text-muted-foreground select-none',
                          !isIncoming && 'hidden',
                        )}
                        onClick={() => {
                          resetField('placementID')
                          setNewPlacement(prev => !prev)
                        }}>
                        {newPlacement ? t('use-existing') : t('create-new')}
                      </span>
                    </div>
                    {newPlacement ? (
                      <Input
                        autoFocus
                        placeholder={t('new-placement-placeholder')}
                        {...register('placementID')}
                      />
                    ) : (
                        <AutoComplete
                          disabled={!hasProduct}
                          autoFocus={false}
                          placeholder={t('placement-placeholder')}
                          emptyMessage={t('placement-empty-message')}
                          items={placementOptions}
                          onSelectedValueChange={value =>
                            setValue('placementID', parseInt(value), {
                              shouldValidate: true,
                            })
                          }
                          onSearchValueChange={setSearchPlacement}
                          selectedValue={placementID ? placementID.toString() : ''}
                          searchValue={searchPlacement}
                        />
                      )}
                  </div>
                )}
                {settings.useBatch 
                  && hasPermissionByPlan(customer.plan, 'pro') && (
                  <div className='grid gap-2 w-full'>
                    <div className='flex items-center justify-between h-4'>
                      <Label>{t('batch')}</Label>
                      <span
                        className={cn(
                          'text-sm md:text-xs cursor-pointer hover:underline text-muted-foreground select-none',
                          !isIncoming && 'hidden',
                        )}
                        onClick={() => {
                          resetField('batchID')
                          setNewBatch(prev => !prev)
                        }}>
                        {newBatch ? t('use-existing') : t('create-new')}
                      </span>
                    </div>
                    {newBatch ? (
                      <Input
                        autoFocus
                        placeholder={t('new-batch-placeholder')}
                        {...register('batchID')}
                      />
                    ) : (
                      <AutoComplete
                        disabled={!hasPlacement}
                        autoFocus={false}
                        placeholder={t('batch-placeholder')}
                        emptyMessage={t('batch-empty-message')}
                        items={batchOptions}
                        onSelectedValueChange={value =>
                          setValue('batchID', parseInt(value), {
                            shouldValidate: true,
                          })
                        }
                        onSearchValueChange={setSearchBatch}
                        selectedValue={batchID ? batchID.toString() : ''}
                        searchValue={searchBatch}
                      />
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
                {t('incoming')}
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
                {t('outgoing')}
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
                  step={0.01}
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
            {settings.useReference && (
              <div
                className={cn(
                  'relative flex flex-col transition-all',
                  useReference && 'gap-2',
                )}>
                <div className={cn('w-full flex z-10 transition-all')}>
                  <Label
                    className='md:text-xs cursor-pointer hover:underline select-none transition-all'
                    onClick={() => onUseReferenceChange(!useReference)}>
                    {t('use-account-case')}
                  </Label>
                </div>
                <Input
                  {...register('reference')}
                  placeholder={t('use-account-case-placeholder')}
                  className={cn(
                    'transition-all',
                    !useReference ? 'h-0 p-0 border-none' : 'h-[40px]',
                  )}
                />
              </div>
            )}
            <Button
              disabled={!formState.isValid || pending || formState.isSubmitting}
              size='lg'
              className='w-full gap-2'>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {t('create-button')} {isIncoming ? t('incoming') : t('outgoing')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
