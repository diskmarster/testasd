'use client'

import { toggleLocationAction } from '@/app/(site)/admin/organisation/actions'
import { changeLocationStatusValidation } from '@/app/(site)/admin/organisation/validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function ModalToggleLocation() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const { setValue, handleSubmit, formState, watch, reset } = useForm<
    z.infer<typeof changeLocationStatusValidation>
  >({
    resolver: zodResolver(changeLocationStatusValidation),
  })

  const formValues = watch()

  useCustomEventListener('ToggleLocationByID', (data: any) => {
    setOpen(true)
    setValue('locationIDs', data.locationIDs, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof changeLocationStatusValidation>) {
    startTransition(async () => {
      const res = await toggleLocationAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `${formValues.locationIDs.length} ${formValues.locationIDs.length == 1 ? 'lokation' : 'lokationer'} blev opdateret`,
      })
    })
  }

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className='md:max-w-sm'>
        <CredenzaHeader>
          <CredenzaTitle>Skift lokation status</CredenzaTitle>
          <CredenzaDescription>
            Denne handling er ikke permanent. Aktiverer du en lokation, kan
            denne tilgås igen. Deaktiverer du en lokation, kan denne ikke
            længere tilgås, før den er aktiveret igen
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 pb-4 md:pb-0'>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid gap-2'>
              <Label htmlFor='groupID'>Status</Label>
              <Select
                onValueChange={(value: 'active' | 'inactive') =>
                  setValue('status', value, {
                    shouldValidate: true,
                  })
                }>
                <SelectTrigger>
                  <SelectValue placeholder='Vælg en status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Aktiv</SelectItem>
                  <SelectItem value='inactive'>Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-2 md:flex-row md:justify-end'>
              <CredenzaClose asChild>
                <Button
                  type='button'
                  size='lg'
                  variant='secondary'
                  className='w-full'>
                  Luk
                </Button>
              </CredenzaClose>
              <Button
                disabled={
                  !formState.isValid || pending || formState.isSubmitting
                }
                variant='default'
                size='lg'
                className='w-full gap-2'>
                {pending && <Icons.spinner className='size-4 animate-spin' />}
                Opdater
              </Button>
            </div>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
