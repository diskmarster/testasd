'use client'
import { createProductAction } from '@/app/(site)/produkter/opret/actions'
import { createProductValidation } from '@/app/(site)/produkter/opret/validation'
import { siteConfig } from '@/config/site'
import { Group, Unit } from '@/lib/database/schema/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

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

export function FormCreateProducts({
  units,
  groups,
}: {
  units: Unit[]
  groups: Group[]
}) {
  const { user } = useSession()

  const [pending, startTransition] = useTransition()
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string>()

  const { handleSubmit, register, formState, setValue, reset } = useForm<
    z.infer<typeof createProductValidation>
  >({
    resolver: zodResolver(createProductValidation),
    defaultValues: {
      customerID: user!.customerID,
      costPrice: 0,
      salesPrice: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof createProductValidation>) {
    console.log(values.customerID)
    startTransition(async () => {
      const response = await createProductAction(values)
      if (response && response.serverError) {
        setError(response.serverError)
        return
      }
      setShow(false)
      setError(undefined)
      reset()
      toast.success(siteConfig.successTitle, {
        description: 'Produktet er oprettet succesfuldt.',
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
        <button onClick={() => setShow(true)}>Open modal</button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Opret produkt</CredenzaTitle>
          <CredenzaDescription>
            Her kan du oprette et produkt.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form className='grid gap-4 mb-4' onSubmit={handleSubmit(onSubmit)}>
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
                  Varenr.
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
                  Stregkode
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
                  Varegruppe<span className='text-destructive'> * </span>
                </Label>
                <Select
                  onValueChange={(value: string) =>
                    setValue('groupID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Vælg en varegruppe' />
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
                  Enhed <span className='text-destructive'> * </span>
                </Label>
                <Select
                  onValueChange={(value: string) =>
                    setValue('unitID', parseInt(value), {
                      shouldValidate: true,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Vælg en enhed' />
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
                  Varetekst 1 <span className='text-destructive'> * </span>
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

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='costPrice'>
                  Kostpris
                  <span className='text-destructive'> * </span>
                </Label>
                <Input
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
                <Label htmlFor='salesPrice'>Salgspris</Label>
                <Input
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
              Opret
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
