"use client"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { useEffect, useState, useTransition } from "react"
import { CustomerID } from "@/lib/database/schema/customer"
import { fetchLocationsForCustomerActions } from "@/app/[lng]/(site)/sys/kunder/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Label } from "../ui/label"
import { AutoComplete } from "../ui/autocomplete"
import { fetchCustomersAction, inviteOrCreateAction } from "@/app/[lng]/(site)/sys/brugere/actions"
import { isUserLimitReached } from "@/service/customer.utils"
import { CustomerWithUserCount } from "@/data/customer.types"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { inviteOrCreateUserValidation } from "@/app/[lng]/(site)/sys/brugere/validation"
import { z } from "zod"
import { UserRole, userRoles } from "@/data/user.types"
import { Checkbox } from "../ui/checkbox"
import { cn } from "@/lib/utils"
import { TagSelect } from "../ui/tag-select"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

interface Props { }

export function ModalInviteCreateUser({ }: Props) {
  const [pending, startTransition] = useTransition()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'sys-bruger')
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithUserCount[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerID>()
  const [searchCustomer, setSearchCustomer] = useState<string>('')
  const [searchRoles, setSearchRoles] = useState('')
  const [locations, setLocations] = useState<{ id: string, name: string }[]>([])
  const [selectedLocations, setSelectedLocations] = useState<{ label: string, value: string }[]>([])
  const [searchLocations, setSearchLocations] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()

  const { formState, setValue, register, handleSubmit, watch, reset } = useForm<z.infer<typeof inviteOrCreateUserValidation>>({
    resolver: zodResolver(inviteOrCreateUserValidation),
    defaultValues: {
      locationsID: [],
      isInvite: true
    }
  })

  const formValues = watch()

  const rolesOptions = userRoles
    .filter(
      role =>
        role != 'system_administrator' &&
        role.toLowerCase().includes(searchRoles.toLowerCase()),
    )
    .map(role => ({
      label: role.replace('_', ' '),
      value: role,
    }))

  const filteredCustomers = customers.filter(c =>
    c.company.toLowerCase().includes(searchCustomer.toLowerCase())
    || c.plan.toLowerCase().includes(searchCustomer.toLowerCase())
    || c.email.toLowerCase().includes(searchCustomer.toLowerCase())
  )

  const filteredLocations = locations
    .filter(
      l =>
        !selectedLocations.some(
          selected => selected.label === l.name && selected.value === l.id
        )
    )
    .map(l => ({ label: l.name, value: l.id }))

  function fetchCustomers() {
    startTransition(async () => {
      const res = await fetchCustomersAction()
      if (res && res.data) {
        setCustomers(res.data)
      }
    })
  }

  function fetchLocations(customerID: CustomerID) {
    startTransition(async () => {
      const res = await fetchLocationsForCustomerActions({ customerID: customerID })
      setLocations(res?.data ?? [])
    })
  }

  function onOpenChange(open: boolean) {
    setSelectedCustomer(undefined)
    setSearchCustomer("")
    setLocations([])
    setSelectedLocations([])
    setSearchLocations("")
    setSearchRoles("")
    reset()
    setOpen(open)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchLocations(selectedCustomer)
    }
  }, [selectedCustomer])

  if (!isDesktop) return null

  const isButtonDisabled =
    !formState.isValid ||
    formState.isSubmitting ||
    (pending && (!selectedCustomer || locations.length === 0));

  function onSubmit(values: z.infer<typeof inviteOrCreateUserValidation>) {
    setErrorMessage(undefined)
    startTransition(async () => {
      const res = await inviteOrCreateAction(values)

      if (res && res.serverError) {
        setErrorMessage(res.serverError)
        return
      }

      onOpenChange(false)
      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: t("modal-create-user.success-toast")
      })
    })
  }

  <Button
    disabled={isButtonDisabled}
    className="w-full flex items-center gap-2">
    {pending && (
      <Icons.spinner className="size-4 animate-spin" />
    )}
    {t("modal-create-user.send-button", { context: formValues.isInvite })}
  </Button>

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size='icon'
          variant='outline'
          className="">
          <Icons.userPlus className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("modal-create-user.title")}</DialogTitle>
          <DialogDescription>{t("modal-create-user.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant='destructive'>
              <Icons.alert className='size-4 !top-3' />
              <AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label>{t("modal-create-user.customer-label")}</Label>
            <AutoComplete
              placeholder={t("modal-create-user.customer-placeholder")}
              emptyMessage={t("modal-create-user.customer-empty")}
              isLoading={customers.length == 0 && pending}
              searchValue={searchCustomer}
              onSearchValueChange={setSearchCustomer}
              selectedValue={selectedCustomer ? selectedCustomer.toString() : ""}
              onSelectedValueChange={val => {
                const id = customers.find(c => c.id.toString() == val)?.id!
                setValue('customerID', id, { shouldValidate: true })
                setSelectedCustomer(id)
                setSelectedLocations([])
              }}
              items={filteredCustomers.map(c => ({
                label: c.company,
                value: c.id.toString()
              }))}
            />
            {selectedCustomer
              && isUserLimitReached(
                customers.find(c => c.id == selectedCustomer)?.plan!,
                customers.find(c => c.id == selectedCustomer)?.extraUsers!,
                customers.find(c => c.id == selectedCustomer)?.userCount!,
              ) && (
                <p className="text-sm text-destructive">{t("modal-create-user.customer-limit-reached")}</p>
              )}
          </div>
          <div className="grid gap-2">
            <Label>{t("modal-create-user.locations-label")}</Label>
            <TagSelect
              items={filteredLocations}
              searchValue={searchLocations}
              setSearchValue={setSearchLocations}
              selectedItems={selectedLocations}
              setSelectedItems={setSelectedLocations}
              placeholder={t("modal-create-user.locations-placeholder")}
              isLoading={(pending && !!selectedCustomer && locations.length == 0)}
              isDisabled={!selectedCustomer}
              onChange={(selected) => {
                const ids = selected.map(s => s.value)
                setValue('locationsID', ids, { shouldValidate: true })
              }}
            />
          </div>
          <div className="grid grid-cols-2">
            <Button
              size="sm"
              className={cn('rounded-r-none text-sm')}
              variant={formValues.isInvite ? 'default' : 'secondary'}
              onClick={() => {
                setValue('isInvite', true, { shouldValidate: true })
                setValue('name', undefined, { shouldValidate: true })
                setValue('password', undefined, { shouldValidate: true })
              }}
            >
              {t("modal-create-user.invite-label")}
            </Button>
            <Button
              size="sm"
              className={cn('rounded-l-none text-sm')}
              variant={!formValues.isInvite ? 'default' : 'secondary'}
              onClick={() => setValue('isInvite', false, { shouldValidate: true })}
            >
              {t("modal-create-user.register-label")}
            </Button>
          </div>
          <Separator />
          <div className={cn('grid gap-4 grid-cols-1', !formValues.isInvite && 'grid-cols-2')}>
            {!formValues.isInvite && (
              <div className="grid gap-2">
                <Label>{t("modal-create-user.name-label")}</Label>
                <Input
                  value={formValues.name}
                  placeholder={t("modal-create-user.name-placeholder")}
                  onChange={e => setValue('name', e.target.value, { shouldValidate: true })}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>{t("modal-create-user.email-label")}</Label>
              <Input
                value={formValues.email}
                placeholder={t("modal-create-user.email-placeholder")}
                onChange={e => setValue('email', e.target.value, { shouldValidate: true })}
              />
            </div>
          </div>
          {!formValues.isInvite && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("modal-create-user.password-label")}</Label>
                <Input
                  value={formValues.password}
                  placeholder={t("modal-create-user.password-placeholder")}
                  onChange={e => setValue('password', e.target.value, { shouldValidate: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("modal-create-user.pin-label")}</Label>
                <Input
                  value={formValues.pin}
                  placeholder={t("modal-create-user.pin-placeholder")}
                  onChange={e => setValue('pin', e.target.value, { shouldValidate: true })}
                />
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div className='grid gap-2'>
              <Label>{t('modal-create-user.role-label')}</Label>
              <AutoComplete
                disabled={pending}
                autoFocus={false}
                placeholder={t('modal-create-user.role-placeholder')}
                emptyMessage={t('modal-create-user.role-empty')}
                items={rolesOptions}
                onSelectedValueChange={value => {
                  const role = value as UserRole

                  switch (role) {
                    case 'administrator':
                    case 'moderator':
                    case 'bruger':
                      setValue('webAccess', true, {
                        shouldValidate: true,
                      })
                      setValue('appAccess', true, {
                        shouldValidate: true,
                      })
                      setValue('priceAccess', true, {
                        shouldValidate: true,
                      })
                      break
                    case 'afgang':
                      setValue('webAccess', false, {
                        shouldValidate: true,
                      })
                      setValue('appAccess', true, {
                        shouldValidate: true,
                      })
                      setValue('priceAccess', false, {
                        shouldValidate: true,
                      })
                      break
                    case 'læseadgang':
                      setValue('webAccess', true, {
                        shouldValidate: true,
                      })
                      setValue('appAccess', false, {
                        shouldValidate: true,
                      })
                      setValue('priceAccess', false, {
                        shouldValidate: true,
                      })
                      break
                  }

                  setValue('role', role, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                onSearchValueChange={setSearchRoles}
                selectedValue={
                  formValues.role
                    ? formValues.role.toString()
                    : ''
                }
                searchValue={searchRoles}
              />
            </div>
            {formValues.role == 'bruger' && (
              <div className="border px-3 py-2 space-y-2 rounded-md">
                <p className="text-sm font-medium">{t("modal-create-user.role-access-label")}</p>
                <div className='flex flex-col gap-2'>
                  <div className='space-y-1.5'>
                    <div className='flex items-center gap-2'>
                      <Checkbox
                        className="size-5"
                        disabled={pending}
                        checked={formValues.webAccess}
                        onCheckedChange={(checked: boolean) => {
                          setValue('webAccess', checked, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }}
                      />
                      <span
                        className={cn(
                          'text-muted-foreground text-sm cursor-pointer select-none',
                          pending && 'cursor-not-allowed',
                        )}
                        onClick={() => {
                          if (!pending) {
                            setValue(
                              'webAccess',
                              !formValues.webAccess,
                              {
                                shouldValidate: true,
                              },
                            )
                          }
                        }}>
                        {t('modal-create-user.role-web-access')}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Checkbox
                        className="size-5"
                        disabled={pending}
                        checked={formValues.appAccess}
                        onCheckedChange={(checked: boolean) => {
                          setValue('appAccess', checked, {
                            shouldValidate: true,
                          })
                        }}
                      />
                      <span
                        className={cn(
                          'text-muted-foreground text-sm cursor-pointer select-none',
                          pending && 'cursor-not-allowed',
                        )}
                        onClick={() => {
                          if (!pending) {
                            setValue(
                              'appAccess',
                              !formValues.appAccess,
                              {
                                shouldValidate: true,
                              },
                            )
                          }
                        }}>
                        {t('modal-create-user.role-app-access')}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Checkbox
                        className="size-5"
                        disabled={pending}
                        checked={formValues.priceAccess}
                        onCheckedChange={(checked: boolean) => {
                          setValue('priceAccess', checked, {
                            shouldValidate: true,
                          })
                        }}
                      />
                      <span
                        className={cn(
                          'text-muted-foreground text-sm cursor-pointer select-none',
                          pending && 'cursor-not-allowed',
                        )}
                        onClick={() => {
                          if (!pending) {
                            setValue(
                              'priceAccess',
                              !formValues.priceAccess,
                              {
                                shouldValidate: true,
                              },
                            )
                          }
                        }}>
                        {t('modal-create-user.role-price-access')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!formValues.isInvite && (
              <div className='flex items-center gap-2'>
                <Checkbox
                  className="size-5"
                  disabled={pending}
                  checked={formValues.mail}
                  onCheckedChange={(checked: boolean) => {
                    if (!pending) {
                      setValue('mail', checked, {
                        shouldValidate: true,
                      })
                    }
                  }}
                />
                <span
                  className={cn(
                    'text-muted-foreground text-sm cursor-pointer select-none',
                    pending && 'cursor-not-allowed',
                  )}
                  onClick={() => {
                    if (!pending) {
                      setValue('mail', !formValues.mail,
                        {
                          shouldValidate: true,
                        },
                      )
                    }
                  }}>
                  {t('modal-create-user.mail-checkbox')}
                </span>
              </div>
            )}
            <Button
              disabled={isButtonDisabled}
              className="w-full flex items-center gap-2">
              {(pending && selectedCustomer && formValues.locationsID.length > 0) && (
                <Icons.spinner className="size-4 animate-spin" />
              )}
              {t("modal-create-user.send-button", { context: formValues.isInvite })}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
