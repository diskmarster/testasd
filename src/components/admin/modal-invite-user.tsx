'use client'

import { inviteNewUserAction } from '@/app/(site)/admin/organisation/actions'
import { inviteNewUserValidation } from '@/app/(site)/admin/organisation/validation'
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
import { Location } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { User } from 'lucia'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'

interface Props {
  locations: Location[]
  currentLocationID: string
  user: User
}

export function ModalInviteUser({ user, locations, currentLocationID }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const { handleSubmit, register, formState, reset, watch, setValue } = useForm<
    z.infer<typeof inviteNewUserValidation>
  >({
    resolver: zodResolver(inviteNewUserValidation),
    defaultValues: {
      locationIDs: [currentLocationID],
      role: 'bruger',
    },
  })

  const formValues = watch()

  function onOpenChange(open: boolean) {
    reset()
    setOpen(open)
  }

  const onSubmit = async (values: z.infer<typeof inviteNewUserValidation>) => {
    startTransition(async () => {
      const res = await inviteNewUserAction(values)
      if (res && res.serverError) {
        setError(res.serverError)
        return
      }
      setError(undefined)
      reset()
      setOpen(false)
      toast.success(siteConfig.successTitle, {
        description: `Invitering sendt til ${values.email}`,
      })
    })
  }
  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button size='icon' variant='outline'>
          <Icons.userPlus className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='md:max-w-md'>
        <CredenzaHeader>
          <CredenzaTitle>Inviter ny bruger</CredenzaTitle>
          <CredenzaDescription>
            Send et aktiveringslink til dine ansatte, og få dem hurtigt i gang
            med at bruge {siteConfig.name}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <form
            className='space-y-6 pb-4 md:pb-0'
            onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert variant='destructive'>
                <Icons.alert className='size-4 !top-3' />
                <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className='grid gap-2'>
              <Label>Brugerens email</Label>
              <Input
                placeholder='Indtast email for ny bruger'
                {...register('email')}
              />
              {formState.errors.email && (
                <p className='text-sm text-destructive'>
                  {formState.errors.email.message}
                </p>
              )}
            </div>
            <div className='flex flex-col gap-2'>
              <div className='grid gap-2'>
                <Label>Brugerrolle</Label>
                <div className='flex items-center'>
                  <Button
                    type='button'
                    size='lg'
                    onClick={() =>
                      setValue('role', 'bruger', { shouldValidate: true })
                    }
                    variant={
                      formValues.role == 'bruger' ? 'default' : 'outline'
                    }
                    className={cn(
                      'flex items-center gap-2 w-full px-2',
                      'rounded-r-none border-r-0',
                    )}>
                    Bruger
                  </Button>
                  <Button
                    type='button'
                    size='lg'
                    onClick={() =>
                      setValue('role', 'lokal_admin', { shouldValidate: true })
                    }
                    variant={
                      formValues.role == 'lokal_admin' ? 'default' : 'outline'
                    }
                    className={cn(
                      'flex items-center gap-2 w-full px-2',
                      'rounded-r-none rounded-l-none',
                      user.role == 'lokal_admin' && 'rounded-r-md border-r-1',
                    )}>
                    Lokal Admin
                  </Button>
                  {user.role != 'lokal_admin' && (
                    <Button
                      type='button'
                      size='lg'
                      onClick={() =>
                        setValue('role', 'firma_admin', {
                          shouldValidate: true,
                        })
                      }
                      variant={
                        formValues.role == 'firma_admin' ? 'default' : 'outline'
                      }
                      className={cn(
                        'flex items-center gap-2 w-full px-2',
                        'rounded-l-none border-l-0',
                      )}>
                      Firma Admin
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className='grid gap-2'>
              <div className='flex items-center justify-between'>
                <Label>Lokations adgang</Label>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {formValues.locationIDs.length}
                  {' af '}
                  {locations.length}{' '}
                  {formValues.locationIDs.length == 1
                    ? 'lokation'
                    : 'lokationer'}{' '}
                  valgt
                </span>
              </div>
              <ScrollArea
                className='border p-2 rounded-md'
                maxHeight='max-h-56'>
                <div className='space-y-2'>
                  {locations.map(loc => (
                    <div
                      key={loc.id}
                      className='border rounded-sm p-2 flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        {loc.name}
                      </span>
                      <Switch
                        checked={formValues.locationIDs.includes(loc.id)}
                        onCheckedChange={(checked: boolean) => {
                          let locations = formValues.locationIDs

                          if (checked) {
                            locations.push(loc.id)
                          } else {
                            locations = locations.filter(
                              locID => locID != loc.id,
                            )
                          }

                          setValue('locationIDs', locations, {
                            shouldValidate: true,
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {formState.errors.locationIDs && (
                <p className='text-sm text-destructive'>
                  {formState.errors.locationIDs.message}
                </p>
              )}
            </div>
            <Button
              className='w-full flex items-center gap-2'
              type='submit'
              disabled={pending || !formState.isValid}>
              {pending && <Icons.spinner className='animate-spin size-4' />}
              Send
            </Button>
          </form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
