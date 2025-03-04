'use client'
import { siteConfig } from '@/config/site'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
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
import { createProductValidation } from '@/app/[lng]/(site)/varer/produkter/validation'
import { createProductAction } from '@/app/[lng]/(site)/varer/produkter/actions'

export function CreateProductsForm({
  units,
  groups,
}: {
  units: Unit[]
  groups: Group[]
}) {
  const lng = useLanguage()
  const { user } = useSession()
  const { t } = useTranslation(lng, 'produkter')
  const [pending, startTransition] = useTransition()
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string>()
  const { t: validationT } = useTranslation(lng, 'validation')
  const schema = createProductValidation(validationT)

  const { handleSubmit, register, formState, setValue, reset } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      customerID: user!.customerID,
      costPrice: 0,
      salesPrice: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const response = await createProductAction(values)
      if (response && response.serverError) {
        setError(response.serverError)
        return
      }
      setShow(false)
      setError(undefined)
      reset()
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: t('toast-success'),
      })
    })
  }
  function onOpenChange(open: boolean) {
    setShow(open)
    reset()
    setError(undefined)
  }

  return (
    <Credenza open={show} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline' tooltip={t('tooltips.create-product')}>
          <Icons.plus className='size-5' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg max-h-screen'>
        <CredenzaHeader>
          <CredenzaTitle>{t('product-modal-title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('product-modal-description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='grid gap-4 mb-4 md:mb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
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
                  {t('product-text1')}{' '}
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
              {t('create-button')}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
