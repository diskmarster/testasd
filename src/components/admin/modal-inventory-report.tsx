"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "../ui/button"
import { Credenza, CredenzaBody, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger } from "../ui/credenza"
import { LocationWithCounts } from "@/data/location.types"
import { CustomerID } from "@/lib/database/schema/customer"
import { fetchLocationsForCustomerActions } from "@/app/[lng]/(site)/sys/kunder/actions"
import { useSession } from "@/context/session"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"
import { Icons } from "../ui/icons"
import { genInventoryReportAction } from "@/app/actions"
import { genInventoryPDF } from "@/lib/pdf/inventory-rapport"
import { formatDate } from "@/lib/utils"

export function ModalInventoryReport() {
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'kunder')
  const { user } = useSession()
  const [locations, setLocations] = useState<LocationWithCounts[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>()
  const [open, setOpen] = useState(false)

  function onOpenChange(open: boolean) {
    setOpen(open)
    setSelectedLocation(undefined)
  }

  function fetchLocations(customerID: CustomerID) {
    startTransition(async () => {
      const res = await fetchLocationsForCustomerActions({ customerID: customerID })
      setLocations(res?.data ?? [])
    })
  }

  function onSubmit() {
    if (!selectedLocation || !user) return
    startTransition(async () => {
      const res = await genInventoryReportAction({ locationID: selectedLocation })

      if (res && res.data) {
        const { customer, location, inventory } = res.data
        const today = new Date()

        const pdf = genInventoryPDF(
          {
            docTitle: `Lagerværdi for ${customer?.company}`,
            companyName: customer.company,
            locationName: location.name,
            userName: user.name,
            dateOfReport: today,
          },
          inventory,
        )

        pdf.save(`lagerværdi-rapport-${location.name}-${formatDate(today, false)}.pdf`)
      }
    })
  }

  useEffect(() => {
    if (locations.length == 0 && user) {
      fetchLocations(user.customerID)
    }
  }, [])

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaTrigger asChild>
        <Button>Lagerværdi</Button>
      </CredenzaTrigger>
      <CredenzaContent className="max-w-sm">

        <CredenzaHeader>
          <CredenzaTitle>Lagerværdi rapport</CredenzaTitle>
          <CredenzaDescription>Download en rapport med lagerværdi for en lokation.</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>{t('import-history-modal.location-label')}</Label>
              <Select value={selectedLocation} onValueChange={val => setSelectedLocation(val)}>
                <SelectTrigger>
                  {locations.length > 0 ? (
                    <SelectValue placeholder="Vælg lokation" defaultValue={selectedLocation} />
                  ) : (
                    <SelectValue placeholder="Henter lokationer..." defaultValue={selectedLocation} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l, i) => (
                    <SelectItem key={i} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => onSubmit()} className="flex items-center gap-2" disabled={pending || locations.length == 0 || !selectedLocation}>
              {pending && (
                <Icons.spinner className="size-4 animate-spin" />
              )}
              Download rapport for lagerværdi
            </Button>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
