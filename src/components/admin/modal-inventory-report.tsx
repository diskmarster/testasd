'use client'

import { fetchLocationsForCustomerActions } from '@/app/[lng]/(site)/sys/kunder/actions'
import { genInventoryReportAction } from '@/app/actions'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { CustomerID } from '@/lib/database/schema/customer'
import { genInventoryExcel, genInventoryPDF } from '@/lib/pdf/inventory-rapport'
import { formatDate } from '@/lib/utils'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
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
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function ModalInventoryReport() {
  const [pending, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'kunder')
  const { user } = useSession()
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>()
  const [open, setOpen] = useState(false)
  const [fileType, setFileType] = useState<'PDF' | 'EXCEL'>('PDF')

  function onOpenChange(open: boolean) {
    setOpen(open)
    setSelectedLocation(undefined)
  }

  function fetchLocations(customerID: CustomerID) {
    startTransition(async () => {
      const res = await fetchLocationsForCustomerActions({
        customerID: customerID,
      })
      setLocations(res?.data ?? [])
    })
  }

  function onSubmit() {
    if (!selectedLocation || !user) return
    startTransition(async () => {
      const res = await genInventoryReportAction({
        locationID: selectedLocation,
      })

      if (res && res.data) {
        const { customer, location, inventory } = res.data
        const today = new Date()

        if (fileType == 'PDF') {
          const pdf = genInventoryPDF(
            {
              docTitle: `Lagerværdi for ${customer?.company}`,
              companyName: customer.company,
              locationName: location.name,
              userName: user.name,
              dateOfReport: today,
            },
            inventory,
            lng,
          )

          pdf.save(
            `lagerværdi-rapport-${location.name}-${formatDate(today, false)}.pdf`,
          )
        } else if (fileType == 'EXCEL') {
          genInventoryExcel(inventory, lng)
        } else if (fileType != 'Excel' && fileType != 'PDF') {
          toast(siteConfig.errorTitle, {
            description: 'inventory-report-modal.file-type-not-supported',
          })
          setFileType('PDF')
        }
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
        <Button variant='outline'>Download</Button>
      </CredenzaTrigger>
      <CredenzaContent className='max-w-sm'>
        <CredenzaHeader>
          <CredenzaTitle>{t('inventory-report-modal.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('inventory-report-modal.desc')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className='flex flex-col gap-4'>
            <div className='grid gap-2'>
              <Label>{t('inventory-report-modal.location-label')}</Label>
              <Select
                value={selectedLocation}
                onValueChange={val => setSelectedLocation(val)}>
                <SelectTrigger>
                  {locations.length > 0 ? (
                    <SelectValue
                      placeholder={t('inventory-report-modal.choose-location')}
                      defaultValue={selectedLocation}
                    />
                  ) : (
                    <SelectValue
                      placeholder={t('inventory-report-modal.loading-location')}
                      defaultValue={selectedLocation}
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l, i) => (
                    <SelectItem key={i} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Label>{t('inventory-report-modal.file-format-label')}</Label>
            <div className='w-full flex'>
              <Button
                onClick={() => setFileType('PDF')}
                className='gap-2 rounded-r-none w-1/2'
                variant={fileType == 'PDF' ? 'default' : 'outline'}
                size='sm'>
                PDF
              </Button>
              <Button
                onClick={() => setFileType('EXCEL')}
                className='gap-2 rounded-l-none w-1/2'
                variant={fileType != 'PDF' ? 'default' : 'outline'}
                size='sm'>
                EXCEL
              </Button>
            </div>
            <Button
              onClick={() => onSubmit()}
              className='flex items-center gap-2'
              disabled={pending || locations.length == 0 || !selectedLocation}>
              {pending && <Icons.spinner className='size-4 animate-spin' />}
              {t('inventory-report-modal.download-button') + fileType}
            </Button>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
