"use client"

import { updatePrimaryLocationValidation } from "@/app/(site)/profil/validation"
import { useSession } from "@/context/session"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Credenza, CredenzaBody, CredenzaClose, CredenzaContent, CredenzaDescription, CredenzaFooter, CredenzaHeader, CredenzaTitle, CredenzaTrigger } from "../ui/credenza"
import { Button } from "../ui/button"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Icons } from "../ui/icons"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { updatePrimaryLocationAction } from "@/app/(site)/profil/actions"
import { siteConfig } from "@/config/site"
import { LocationID, LocationWithPrimary } from "@/lib/database/schema/customer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function LocationDialog({ locations }: { locations: LocationWithPrimary[] }) {
  const { session } = useSession()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false)

  const primaryLocation = locations.find(loc => loc.isPrimary)

  const { handleSubmit, formState, reset, getValues, setValue } = useForm<
    z.infer<typeof updatePrimaryLocationValidation>
  >({
    resolver: zodResolver(updatePrimaryLocationValidation),
    defaultValues: {
      locationID: primaryLocation?.id
    }
  })

  if (!session) return null
  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant='outline' className='hover:text-destructive'>
          Skift hovedlokation
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <form className='space-y-4'>
          <CredenzaHeader>
            <CredenzaTitle>Skift hovedlokation</CredenzaTitle>
            <CredenzaDescription>
              Skifter hovedlokation for din bruger
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className={cn('grid w-full items-start gap-4 md:max-w-lg')}>
              {formError && (
                <Alert variant='destructive'>
                  <Icons.alert className='size-4 !top-3' />
                  <AlertTitle>{siteConfig.errorTitle}</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className='grid gap-2'>
                <Label htmlFor='role'>Lokation</Label>
                <Select
                  defaultValue={getValues().locationID}
                  onValueChange={value => setValue('locationID', value as LocationID, { shouldValidate: true })}>
                  <SelectTrigger id='role'>
                    <SelectValue placeholder='Vælg lokation' className='capitalize' />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc, i) => (
                      <SelectItem key={i} value={loc.id} className='capitalize'>
                        <div
                          className="flex items-center gap-1">
                          <p>{loc.name}</p>
                          {loc.isPrimary && (
                            <Icons.star className="size-3 fill-warning text-warning" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.locationID && (
                  <p className='text-sm text-destructive '>
                    {formState.errors.locationID.message}
                  </p>
                )}
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button variant='link'>Luk</Button>
            </CredenzaClose>
            <Button
              disabled={!getValues().locationID || getValues().locationID == primaryLocation?.id}
              type='submit'
              className='flex items-center gap-2'
              onClick={handleSubmit(values => {
                startTransition(async () => {
                  reset()
                  const res = await updatePrimaryLocationAction({ ...values })
                  if (res && res.serverError) {
                    setFormError(res.serverError)
                    return
                  }
                  toast(siteConfig.successTitle, {
                    description: `Hovedlokation opdateret til ${locations.find(loc => loc.id == values.locationID)?.name ?? 'Unavngivet'}`,
                  })
                  setOpen(false)
                })
              })}>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              Opdater
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  )
}
