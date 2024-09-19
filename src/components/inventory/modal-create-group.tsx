'use client'

import { createProductGroupAction } from '@/app/(site)/varegrupper/actions'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const productGroupSchema = z.object({
  name: z.string().nonempty('Produktgruppenavn er påkrævet'),
})

type ProductGroupForm = z.infer<typeof productGroupSchema>

export function ModalCreateProductGroup() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductGroupForm>({
    resolver: zodResolver(productGroupSchema),
  })

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const onSubmit = async (data: ProductGroupForm) => {
    startTransition(async () => {
      const res = await createProductGroupAction({
        name: data.name,
      })

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success('Varegruppen blev oprettet.', {
        description: `Ny produktgruppe: ${data.name}`,
      })
    })
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.plus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle>Opret ny produktgruppe</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            <div className='grid gap-2'>
              <Label>Produktgruppenavn</Label>
              <Input
                placeholder='Indtast navn for ny produktgruppe'
                {...register('name')}
              />
              {errors.name && (
                <p className='text-sm text-destructive'>
                  {errors.name.message}
                </p>
              )}
            </div>
            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting}
              className='w-full'>
              {isSubmitting || pending ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : (
                'Opret produktgruppe'
              )}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
