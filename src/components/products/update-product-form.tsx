'use client'
import { updateProductAction } from '@/app/[lng]/(site)/admin/produkter/actions'
import { createProductValidation } from '@/app/[lng]/(site)/admin/produkter/validation'
import { siteConfig } from '@/config/site'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

import { useTranslation } from '@/app/i18n/client'
import { LanguageContext } from '@/context/language'
import { useSession } from '@/context/session'
import { FormattedProduct } from '@/data/products.types'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '../ui/credenza'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function UpdateProductsForm({
  units,
  groups,
  productToEdit,
  isOpen,
  setOpen,
}: {
  units: Unit[]
  groups: Group[]
  productToEdit?: FormattedProduct
  isOpen: boolean
  setOpen: (open: boolean) => void
}) {
  const { user } = useSession()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'produkter')

  const { handleSubmit, register, formState, setValue, reset, watch } = useForm<
    z.infer<typeof createProductValidation>
  >({
    resolver: zodResolver(createProductValidation),
    defaultValues: {
      customerID: user!.customerID,
      costPrice: 0,
      salesPrice: 0,
      ...productToEdit,
    },
  })

  const formValues = watch()

  async function onSubmit(values: z.infer<typeof createProductValidation>) {
    startTransition(async () => {
      if (!productToEdit) {
        setError('No product to edit')
        return
      }

      const response = await updateProductAction({
        productID: productToEdit.id,
        data: values,
      })

      if (response && response.serverError) {
        setError(response.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: 'Produktet er opdateret succesfuldt.',
      })
    })
  }

  useEffect(() => {
    if (productToEdit) {
      Object.entries(productToEdit).forEach(([key, value]) => {
        setValue(key as keyof z.infer<typeof createProductValidation>, value)
      })
    }
  }, [productToEdit, setValue])

  function onOpenChange(open: boolean) {
    setOpen(open)
    reset()
    setError(undefined)
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-lg max-h-screen'>
        <CredenzaHeader>
          <CredenzaTitle>
            {t('update-product-modal.update-product-modal-title')}
          </CredenzaTitle>
          <CredenzaDescription>
            {t('update-product-modal.update-product-modal-description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='grid gap-4 mb-4 md:mb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='sku'>
                  {t('product-No.')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input id='sku' type='text' {...register('sku')} />
                {formState.errors.sku && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.sku.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='barcode'>
                  {t('barcode')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input id='barcode' type='text' {...register('barcode')} />
                {formState.errors.barcode && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.barcode.message}
                  </p>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='groupID'>
                  {t('product-group')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Select
                  value={formValues.groupID.toString()}
                  onValueChange={(value: string) =>
                    setValue('groupID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder={t('product-group-placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='unitID'>
                  {t('unit')} <span className='text-destructive'> * </span>
                </Label>
                <Select
                  value={formValues.unitID.toString()}
                  onValueChange={(value: string) =>
                    setValue('unitID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder={t('unit-placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid gap-5'>
              <div className='grid gap-2'>
                <Label htmlFor='text1'>
                  {t('product-text1')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input
                  id='text1'
                  type='text'
                  {...register('text1')}
                  className=''
                />
                {formState.errors.text1 && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.text1.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='text2'>{t('product-text2')}</Label>
                <Input
                  id='text2'
                  type='text'
                  {...register('text2')}
                  className=''
                />
                {formState.errors.text2 && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.text2.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='text3'>{t('product-text3')}</Label>
                <Input
                  id='text3'
                  type='text'
                  {...register('text3')}
                  className=''
                />
                {formState.errors.text3 && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.text3.message}
                  </p>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='costPrice'>
                  {t('cost-price')}
                  <span className='text-destructive'> * </span>
                </Label>
                <Input
                  step={0.01}
                  min={0}
                  required
                  id='costPrice'
                  type='number'
                  {...register('costPrice')}
                />
                {formState.errors.costPrice && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.costPrice.message}
                  </p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='salesPrice'>{t('sales-price')}</Label>
                <Input
                  step={0.01}
                  min={0}
                  id='salesPrice'
                  type='number'
                  {...register('salesPrice')}
                />
                {formState.errors.salesPrice && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.salesPrice.message}
                  </p>
                )}
              </div>
            </div>
            <Button type='submit' disabled={pending || !formState.isValid}>
              {t('update-product-modal.update-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
