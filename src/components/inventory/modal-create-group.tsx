'use client'

import { createGroupAction } from '@/app/(site)/admin/varegrupper/actions'
import { createGroupValidation } from '@/app/(site)/admin/varegrupper/validation'
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
import { siteConfig } from '@/config/site'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'



export function ModalCreateProductGroup() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()

  const { handleSubmit, register, formState, reset } = useForm<
    z.infer<typeof createGroupValidation>
  >({
    resolver: zodResolver(createGroupValidation),
    defaultValues: { },
  })

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const onSubmit = async (values: z.infer<typeof createGroupValidation>) => {
    startTransition(async () => {
      const res = await createGroupAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `${values.name} varegruppe oprettet`,
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
          <CredenzaTitle>Opret ny varegruppe</CredenzaTitle>
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
            <div className='grid gap-2'>
              <Label>Varegruppenavn</Label>
              <Input
                placeholder='Indtast navn for ny varegruppe'
                {...register('name')}
              />
              {formState.errors.name && (
                <p className='text-sm text-destructive'>
                  {formState.errors.name.message}
                </p>
              )}
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
