'use client'
import { createProductAction } from '@/app/(site)/produkter/opret/actions'
import { createProductValidation } from '@/app/(site)/produkter/opret/validation'
import { siteConfig } from '@/config/site'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
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

const groupIdOptions = [
  { label: 'Handheld Scanners', value: 0 },
  { label: 'Printer', value: 1 },
  { label: 'Speed data', value: 2 },
  { label: 'Tablets', value: 3 },
]

const unitIdOptions = [
  { label: 'Rulle', value: 0 },
  { label: 'Pose', value: 1 },
  { label: 'Plade', value: 2 },
  { label: 'Pakke', value: 3 },
]

export function FormCreateProducts() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const { handleSubmit, register, formState, setValue } = useForm<
    z.infer<typeof createProductValidation>
  >({
    resolver: zodResolver(createProductValidation),
    defaultValues: {
      customerID: 2,
    },
  })

  async function onSubmit(values: z.infer<typeof createProductValidation>) {
    startTransition(async () => {
      const response = await createProductAction(values)
      if (response && response.serverError) {
        setError(response.serverError)
        return
      }
    })
  }

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <button>Open modal</button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Opret produkt</CredenzaTitle>
          <CredenzaDescription>
            Her kan du oprette et produkt.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='grid gap-6 max-w-lg'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='!top-3 size-4' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid md:grid-cols-2 gap-12'>
              <div className='grid gap-2'>
                <Label htmlFor='sku'>
                  Varenr.
                  <span className='dark:text-red-500 text-red-600'> * </span>
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
                  Stregkode
                  <span className='dark:text-red-500 text-red-600'> * </span>
                </Label>
                <Input id='barcode' type='text' {...register('barcode')} />
                {formState.errors.barcode && (
                  <p className='text-sm text-destructive'>
                    {formState.errors.barcode.message}
                  </p>
                )}
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-12'>
              <div className='grid gap-2'>
                <Label htmlFor='groupID'>Varegruppe</Label>
                <Select
                  onValueChange={(value: string) =>
                    setValue('groupID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Select an option' />
                  </SelectTrigger>
                  <SelectContent>
                    {groupIdOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                        className='capitalize'>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='unitID'>
                  Enhed{' '}
                  <span className='dark:text-red-500 text-red-600'> * </span>
                </Label>
                <Select
                  onValueChange={(value: string) =>
                    setValue('unitID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Select an option' />
                  </SelectTrigger>
                  <SelectContent>
                    {unitIdOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                        className='capitalize'>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid gap-5'>
              <div className='grid gap-2'>
                <Label htmlFor='text1'>
                  Varetekst 1{' '}
                  <span className='dark:text-red-500 text-red-600'> * </span>
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
                <Label htmlFor='text2'>Varetekst 2</Label>
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
                <Label htmlFor='text3'>Varetekst 3</Label>
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

            <div className='grid md:grid-cols-2 gap-12'>
              <div className='grid gap-2'>
                <Label htmlFor='costPrice'>Kostpris</Label>
                <Input
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
                <Label htmlFor='salesPrice'>Salgspris</Label>
                <Input
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

            <Button
              type='submit'
              disabled={pending || !formState.isValid}
              className='flex items-center gap-2'>
              Opret
            </Button>
          </form>
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <button>Close</button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
