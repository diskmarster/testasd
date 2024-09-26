'use client'

import { createUnitAction } from '@/app/(site)/sys/enheder/actions'
import { createUnitValidation } from '@/app/(site)/sys/enheder/validation'
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
const unitSchema = z.object({
  name: z.string().nonempty('Enhedsnavn er påkrævet'),
})
type unitForm = z.infer<typeof unitSchema>
export function ModalCreateUnitForm() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<unitForm>({
    resolver: zodResolver(unitSchema),
  })
  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }
  const onSubmit = async (values: z.infer<typeof createUnitValidation>) => {
    startTransition(async () => {
      const res = await createUnitAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success('Enheden blev oprettet.', {
        description: `Ny enhed: ${values.name}`,
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
          <CredenzaTitle>Opret ny Enhed</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-4 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            <div className='grid gap-2'>
              <Label>Enhed navn:</Label>
              <Input
                placeholder='Indtast navn for ny enhed'
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
                'Opret enhed'
              )}
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
