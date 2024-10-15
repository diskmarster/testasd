'use client'

import { toggleUserStatusAction } from '@/app/[lng]/(site)/admin/organisation/actions'
import { changeUserStatusValidation } from '@/app/[lng]/(site)/admin/organisation/validation'
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
import { UserNoHash } from '@/lib/database/schema/auth'
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

interface Props {
  users: UserNoHash[]
}

export function ModalToggleUser({ users }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const { setValue, handleSubmit, formState, watch, reset } = useForm<
    z.infer<typeof changeUserStatusValidation>
  >({
    resolver: zodResolver(changeUserStatusValidation),
  })

  const formValues = watch()

  useCustomEventListener('ToggleUserByID', (data: any) => {
    setOpen(true)
    setValue('userIDs', data.userIDs, { shouldValidate: true })
  })

  function onSubmit(values: z.infer<typeof changeUserStatusValidation>) {
    startTransition(async () => {
      const res = await toggleUserStatusAction(values)

      if (res && res.serverError) {
        setError(res.serverError)
        return
      }

      setError(undefined)
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `${formValues.userIDs.length} ${formValues.userIDs.length == 1 ? 'bruger' : 'brugere'} blev opdateret`,
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
          <CredenzaTitle>Skift bruger status</CredenzaTitle>
          <CredenzaDescription>
            Denne handling er ikke permanent. Aktiverer du en bruger, kan denne
            logge ind på ${siteConfig.name} igen. Deaktiverer du en bruger vil
            brugeren blive logget af og kan ikke logge ind igen før aktiveret
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
