'use client'

import { moveInventoryAction } from '@/app/[lng]/(site)/oversigt/actions'
import { moveInventoryValidation } from '@/app/[lng]/(site)/oversigt/validation'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { siteConfig } from '@/config/site'
import { LanguageContext } from '@/context/language'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import {
  Batch,
  Placement,
  PlacementID,
  ProductID,
} from '@/lib/database/schema/inventory'
import { cn, tryParseInt } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useEffect, useMemo, useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AutoComplete } from '../ui/autocomplete'
import { isBefore } from 'date-fns'

interface Props {
  customer: Customer
  placements: Placement[]
  batches: Batch[]
  inventory: FormattedInventory[]
  settings: Pick<CustomerSettings, 'useReference' | 'usePlacement'>
}

export function ModalMoveInventory({
  customer,
  placements,
  inventory,
  batches,
  settings,
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [searchProduct, setSearchProduct] = useState<string>('')
  const [searchFromPlacement, setSearchFromPlacement] = useState<string>('')
  const [searchFromBatch, setSearchFromBatch] = useState<string>('')
  const [searchToPlacement, setSearchToPlacement] = useState<string>('')
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'oversigt')
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = moveInventoryValidation(validationT)

	const uniqueProducts = useMemo(
		() =>
			inventory.filter((item, index, self) => {
				return (
					index ===
					self.findIndex(
						i =>
							i.product.id === item.product.id &&
							!i.product.isBarred &&
							!i.isDefaultPlacement,
					)
				)
			}),
		[],
	)

  const productOptions = uniqueProducts
    .filter(
      prod =>
        prod.product.text1
          .toLowerCase()
          .includes(searchProduct.toLowerCase()) ||
        prod.product.sku.toLowerCase().includes(searchProduct.toLowerCase()),
    )
    .map(prod => ({
      label: prod.product.text1,
      value: prod.product.id.toString(),
    }))

  const placementsForProduct = (productID: ProductID) =>
    inventory
      .filter((item, index, self) => {
        return (
          index ===
          self.findIndex(
            i =>
              i.product.id === productID &&
              i.placement.id === item.placement.id,
          )
        )
      })
      .filter(p =>
        p.placement.name
          .toLowerCase()
          .includes(searchFromPlacement.toLowerCase()),
      )
      .map(prod => ({
        label: prod.placement.name,
        value: prod.placement.id.toString(),
      }))

  const batchesForProduct = (productID: ProductID, placementID: PlacementID) =>
    inventory
      .filter(
        item =>
          item.product.id === productID && item.placement.id === placementID,
      )
      .filter(p =>
        p.batch.batch.toLowerCase().includes(searchFromBatch.toLowerCase()),
      )
      .map(p => ({
        label: p.batch.batch,
        value: p.batch.id.toString(),
      }))

  const fallbackBatchID = hasPermissionByPlan(customer.plan, 'pro')
    ? undefined
    : batches.find(batch => batch.batch == '-')?.id

  const {
    reset,
    handleSubmit,
    watch,
    setValue,
    formState,
    register,
    resetField,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      fromPlacementID: undefined,
      fromBatchID: fallbackBatchID,
      toPlacementID: undefined,
    },
  })

  const productID = watch('productID')
  const fromPlacementID = watch('fromPlacementID')
  const fromBatchID = watch('fromBatchID')
  const formValues = watch()

  const hasProduct = productID != undefined
  const hasFromPlacementID = fromPlacementID != undefined

  const useBatch = useMemo(
    () =>
      uniqueProducts.find(p => p.product.id == productID)?.product.useBatch ??
      false,
    [productID],
  )

  useEffect(() => {
    if (!useBatch) {
      setValue('fromBatchID', batches.find(b => b.batch == '-')?.id ?? -1, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [useBatch, productID])

  const fromInventoryItem = inventory.find(
    item =>
      item.product.id === formValues.productID &&
      item.placement.id === formValues.fromPlacementID &&
      item.batch.id === formValues.fromBatchID,
  )

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const res = await moveInventoryAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      reset()
      setOpen(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: t('inventory-moved'),
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
    setSearchProduct('')
    setSearchFromPlacement('')
    setSearchFromBatch('')
    setSearchToPlacement('')
    setOpen(open)
  }

  function fromPlacementIcon(productID: ProductID) {
    const comp = (option: {value: string, label: string}) => {
      const inv = inventory.find(b => b.product.id == productID && b.placement.id == tryParseInt(option.value))
      const isDefault = inv?.isDefaultPlacement ?? false
      const isBarred = inv?.placement?.isBarred ?? false

      return (
        <span className={cn(
          'hidden size-2 rounded-full border',
          isDefault && 'block bg-primary/50 border-primary',
          isBarred && 'block bg-destructive/50 border-destructive',
        )}/>
      )
    }
    comp.displayName = "fromPlacementIcon"
    return comp
  }

  function fromBatchIcon(option: {value: string, label: string}) {
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
  }

  useCustomEventListener('MoveInventoryByIDs', (data: any) => {
    setOpen(true)
    setSearchProduct(data.productName)
    setValue('productID', data.productID, { shouldValidate: true })
    setSearchProduct(data.productName)
    setValue('fromPlacementID', data.placementID, { shouldValidate: true })
    setSearchFromPlacement(data.placementName)
    setValue('fromBatchID', data.batchID, { shouldValidate: true })
    setSearchFromBatch(data.batchName)
  })

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline' tooltip={t('move-inventory')}>
          <Icons.replace className='size-[18px]' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>{t('move-inventory')}</CredenzaTitle>
          <CredenzaDescription>
            {t('move-inventory-description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 pb-4 md:pb-0'>
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
                  setSearchFromPlacement('')
                  setSearchFromBatch('')
                  setSearchToPlacement('')
                  reset({ productID: tryParseInt(value), amount: 0 })
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
            <div>
              <div className='flex flex-col gap-4 md:flex-row bg-muted border-dashed border p-4 rounded-md'>
                <div
                  className={cn(
                    'grid gap-2 w-full transition-all',
                    useBatch && 'w-[222px]',
                  )}>
                  <Label>{t('from-placement')}</Label>
                  <AutoComplete
                    className='bg-background'
                    disabled={!hasProduct}
                    autoFocus={false}
                    placeholder={t('placement-placeholder')}
                    emptyMessage={t('placement-empty-message')}
                    items={placementsForProduct(formValues.productID)}
                    onSelectedValueChange={value => {
                      resetField('fromBatchID')
                      setSearchFromBatch('')
                      setValue('fromPlacementID', parseInt(value), {
                        shouldValidate: true,
                      })
                    }}
                    onSearchValueChange={setSearchFromPlacement}
                    selectedValue={
                      fromPlacementID ? fromPlacementID.toString() : ''
                    }
                    searchValue={searchFromPlacement}
                    icon={fromPlacementIcon(productID)}
                  />
                </div>
                {hasPermissionByPlan(customer.plan, 'pro') && (
                  <div
                    className={cn(
                      'w-[0px] hidden transition-all',
                      useBatch && 'w-[222px] gap-2 grid',
                    )}>
                    <Label className={cn(!useBatch && 'text-muted-foreground')}>
                      {t('from-batch')}
                    </Label>
                    <AutoComplete
                      className='bg-background'
                      disabled={!useBatch || !hasProduct || !hasFromPlacementID}
                      autoFocus={false}
                      placeholder={t('batch-placeholder')}
                      emptyMessage={t('batch-empty-message')}
                      items={batchesForProduct(
                        formValues.productID,
                        formValues.fromPlacementID,
                      )}
                      onSelectedValueChange={value => {
                        setValue('fromBatchID', parseInt(value), {
                          shouldValidate: true,
                        })
                      }}
                      onSearchValueChange={setSearchFromBatch}
                      selectedValue={fromBatchID ? fromBatchID.toString() : ''}
                      searchValue={searchFromBatch}
                      icon={fromBatchIcon}
                    />
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
                  <Label>{t('to-placement')}</Label>
                  <AutoComplete
                    className='bg-background'
                    disabled={!hasProduct}
                    autoFocus={false}
                    placeholder={t('placement-placeholder')}
                    emptyMessage={t('placement-empty-message')}
                    items={placements
                      .filter(
                        p =>
                          p.id != formValues.fromPlacementID &&
                          p.name
                            .toLowerCase()
                            .includes(searchToPlacement.toLowerCase()),
                      )
                      .map(p => ({
                        label: p.name,
                        value: p.id.toString(),
                      }))}
                    onSelectedValueChange={value => {
                      setValue('toPlacementID', parseInt(value), {
                        shouldValidate: true,
                      })
                    }}
                    onSearchValueChange={setSearchToPlacement}
                    selectedValue={
                      formValues.toPlacementID
                        ? formValues.toPlacementID.toString()
                        : ''
                    }
                    searchValue={searchToPlacement}
                  />
                </div>
              </div>
            </div>
            <div className='pt-2 flex flex-col'>
              <div className='p-4 border border-b-0 rounded-t-md text-sm text-muted-foreground flex items-center gap-2 justify-center'>
                {fromInventoryItem ? (
                  <>
                    <p>{t('moveable-quantity')}</p>
                    <p>{fromInventoryItem.quantity}</p>
                  </>
                ) : (
                  <p>{t('moveable-quantity-must-be-picked')}</p>
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
                  step={0.01}
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
            <div className={cn('relative flex flex-col transition-all')}>
              <Input
                {...register('reference')}
                placeholder={t('use-account-case-placeholder')}
                className={cn(
                  'transition-all',
                  !settings.useReference.flyt
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
              {t('move-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
