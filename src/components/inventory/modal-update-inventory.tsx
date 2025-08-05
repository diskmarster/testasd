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
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import {
  Batch,
  Placement,
  ProductID,
} from '@/lib/database/schema/inventory'
import { cn, tryParseInt, updateChipCount } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AutoComplete } from '../ui/autocomplete'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { isBefore } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface Props {
  customer: Customer
  inventory: FormattedInventory[]
  placements: Placement[]
  batches: Batch[]
  lng: string
  settings: Pick<CustomerSettings, 'useReference' | 'usePlacement'>
}

export function ModalUpdateInventory({
  inventory,
  customer,
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
  const [searchProduct, setSearchProduct] = useState<string>('')
  const [searchBatch, setSearchBatch] = useState<string>('')
  const [searchPlacement, setSearchPlacement] = useState<string>('')
  const { t } = useTranslation(lng, 'oversigt')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = updateInventoryValidation(validationT)

  const products = useMemo(
    () =>
      inventory
        .filter((item, index, self) => {
          return (
            index ===
            self.findIndex(
              i => i.product.id === item.product.id && !i.product.isBarred,
            )
          )
        })
        .map(item => item.product),
    [],
  )

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

  const batchOptions = useMemo(
    () => batches
      .filter(batch =>
        batch.batch.toLowerCase().includes(searchBatch.toLowerCase()),
      )
      .map(batch => ({
        label: batch.batch,
        value: batch.id.toString(),
      })),
    []
  )

  const placementsForProduct = (productID: ProductID, hasDefaultPlacement: boolean) =>
    inventory
      .filter((item, index, self) => (
        index === self.findIndex(i => i.placement.id == item.placement.id) &&
        !hasDefaultPlacement || item.isDefaultPlacement && index === self.findIndex(i => (
          i.product.id == productID && i.isDefaultPlacement
        ))
      ))
      .filter(p =>
        p.placement.name.toLowerCase().includes(searchPlacement.toLowerCase()),
      )
      .sort((a, b) => {
        return a.placement.name.localeCompare(b.placement.name)
      })
      .map(prod => ({
        label: prod.placement.name,
        value: prod.placement.id.toString(),
      }))

  const fallbackPlacementID =
    settings.usePlacement && hasPermissionByPlan(customer.plan, 'basis')
      ? undefined
      : placements.find(placement => placement.name == '-')?.id
  const fallbackBatchID = hasPermissionByPlan(customer.plan, 'pro')
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

  const useBatch = useMemo(
    () => products.find(p => p.id == productID)?.useBatch ?? false,
    [productID],
  )
  const hasDefaultPlacement = useMemo(
    () =>
      inventory
        .filter(i => i.product.id == productID)
        .some(i => i.isDefaultPlacement),
    [productID],
  )
	const defaultPlacementID = useMemo(
		() => {
			if (hasDefaultPlacement) {
				const invWithDefault = inventory
					.filter(i => i.product.id == productID) 
					.find(i => i.isDefaultPlacement)

				return placements.find(p => p.id == invWithDefault?.placement.id)?.id
			}
			return undefined
		},
		[hasDefaultPlacement, productID]
	)
  const isExpired = useMemo(
    () => {
      if (!useBatch || typeof batchID != 'number') return false
      
      const batch = batches.find(b => b.id == batchID)
      if (!batch) {
        return false
      }

      return batch.expiry != null && isBefore(batch.expiry, Date.now())
    },
    [useBatch, batchID]
  )

  useEffect(() => {
    if (!useBatch) {
      setValue('batchID', batches.find(b => b.batch == '-')?.id ?? -1, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [useBatch, productID])

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
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: `${isIncoming ? t('incoming') : t('outgoing')} ${t('toasts.was-created')}`,
      })
      updateChipCount()
    })
  }

  function placementIcon(product: ProductID) {
    const comp = (option: {value: string, label: string}) => {
      const inv = inventory.find(b => (!hasDefaultPlacement || b.product.id == product) && b.placement.id == tryParseInt(option.value))
      const isDefault = hasDefaultPlacement && (inv?.isDefaultPlacement ?? false)
      const isBarred = inv?.placement?.isBarred ?? false

      return (
        <span className={cn(
          'hidden size-2 rounded-full border',
          isDefault && 'block bg-primary/50 border-primary',
          isBarred && 'block bg-destructive/50 border-destructive',
        )}/>
      )
    }
    comp.displayName = 'placementIcon'
    return comp
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
                onSelectedValueChange={value => {
                  setSearchPlacement('')
                  setSearchBatch('')
                  reset({
										productID: tryParseInt(value),
										type,
										amount: 0,
										placementID: hasDefaultPlacement ? defaultPlacementID : fallbackPlacementID,
										batchID: fallbackBatchID,
									})
                }}
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
            {hasPermissionByPlan(customer.plan, 'basis') && (
                <div className='flex flex-col gap-4 md:flex-row'>
                  {settings.usePlacement && (
                    <div
                      className={cn(
                        'grid gap-2 w-full transition-all',
                        useBatch && 'w-[222px]',
                      )}>
                      <div className='flex items-center justify-between h-4'>
                        <Label>{t('placement')}</Label>
                        <span
                          className={cn(
                            'text-sm md:text-xs cursor-pointer hover:underline text-muted-foreground select-none',
                            (!isIncoming || hasDefaultPlacement) && 'hidden',
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
                          items={placementsForProduct(productID, hasDefaultPlacement)}
                          onSelectedValueChange={value =>
                            setValue('placementID', parseInt(value), {
                              shouldValidate: true,
                            })
                          }
                          onSearchValueChange={setSearchPlacement}
                          selectedValue={
                            placementID ? placementID.toString() : ''
                          }
                          searchValue={searchPlacement}
                          icon={placementIcon(productID)}
                        />
                      )}
                    </div>
                  )}
                  {hasPermissionByPlan(customer.plan, 'pro') && (
                    <div
                      className={cn(
                        'gap-2 w-[0px] hidden transition-all',
                        settings.usePlacement && useBatch && 'w-[222px] grid',
                        !settings.usePlacement && useBatch && 'w-full grid',
                      )}>
                      <div className='flex items-center justify-between h-4'>
                        <div className='flex gap-1 items-center'>
                          <Label
                            className={cn(!useBatch && 'text-muted-foreground')}>
                            {t('batch')}
                          </Label>
                          {isExpired && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Icons.info className='size-3.5 text-yellow-600 dark:text-warning' />
                                </TooltipTrigger>
                                <TooltipContent className='bg-foreground text-background'>
                                  {t('oversigt:batch-indicator-tooltip', { context: 'expired' })}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm md:text-xs cursor-pointer hover:underline text-muted-foreground select-none',
                            !isIncoming && 'hidden',
                            !useBatch &&
                            'cursor-not-allowed hover:no-underline',
                          )}
                          onClick={() => {
                            if (useBatch) {
                              resetField('batchID')
                              setNewBatch(prev => !prev)
                            }
                          }}>
                          {newBatch ? t('use-existing') : t('create-new')}
                        </span>
                      </div>
                      {newBatch ? (
                        <Input
                          autoFocus
                          placeholder={t('new-batch-placeholder')}
                          disabled={!useBatch}
                          {...register('batchID')}
                        />
                      ) : (
                        <AutoComplete
                          disabled={!useBatch || !hasPlacement}
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
                          icon={(option) => {
                              const batch = batches.find(b => b.id == tryParseInt(option.value))
                              const hasExpiry = batch != undefined && batch.expiry != null 
                              const isExpired = batch != undefined && batch.expiry != null && isBefore(batch.expiry, Date.now())
                              return (
                                <span className={cn(
                                  'block size-2 rounded-full border-black/20 border',
                                  hasExpiry && (isExpired 
                                    ? 'bg-destructive/50 border-destructive' 
                                    : 'bg-success/50 border-success'
                                  )
                                )}/>
                              )
                            }}
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
            <div className={cn('relative flex flex-col transition-all')}>
              <Input
                {...register('reference')}
                placeholder={t('use-account-case-placeholder')}
                className={cn(
                  'transition-all',
                  !settings.useReference[type]
                    ? 'h-0 p-0 border-none'
                    : 'h-[40px]',
                )}
              />
            </div>
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
