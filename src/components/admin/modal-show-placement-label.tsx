'use client'

import { useTranslation } from '@/app/i18n/client'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from '@/components/ui/credenza'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { useRef, useState } from 'react'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ButtonOpenPrint } from '../inventory/button-open-print'
import { useCustomEventListener } from 'react-custom-events'
import { LabelSize } from '../inventory/modal-show-product-label'

interface Props { }

export function ModalShowPlacementLabel({ }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'placeringer')
  const sizes = ['small', 'big']
  const [size, setSize] = useState<'small' | 'big'>(
    (localStorage.getItem('label-size') as LabelSize) ?? 'small'
  )
  const [open, setOpen] = useState(false)
  const [placementName, setPlacementName] = useState<string>('')

  function handleOpenChange(open: boolean) {
    setSize(
      localStorage.getItem('label-size') as LabelSize ?? 'small'
    )
    setOpen(open)
  }

  useCustomEventListener('PrintPlacementLabel', (data: { name: string }) => {
    setPlacementName(data.name)
    setOpen(true)
  })

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent className='min-w-96 max-w-fit'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-label.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-label.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className='space-y-4 pb-4 md:pb-0'>
          <div className='grid gap-2'>
            <Label htmlFor='size'>
              {t('modal-label.size')}
            </Label>
            <Select
              value={size}
              onValueChange={(value: LabelSize) => {
                localStorage.setItem('label-size', value)
                setSize(value)
              }
              }>
              <SelectTrigger>
                <SelectValue placeholder={t('modal-label.size')} />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size, index) => (
                  <SelectItem key={index} value={size} className='cursor-pointer'>
                    <div className='flex gap-1 items-center'>
                      <span className='capitalize'>{t('modal-label.size', { context: size })}</span>
                      <span className='text-muted-foreground'>- {t('modal-label.size-desc', { context: size })}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='border rounded-md'>
            {size == 'small' ? (
              <div
                ref={ref}
                className={cn(
                  'print:w-[51mm] print:h-[21mm]',
                )}>
                <div className='p-1.5 space-y-1 print:p-2 print:space-y-2'>
                  <div className='flex items-center justify-center'>
                    <p className='font-bold truncate max-w-56 print:text-base'>
                      {placementName}
                    </p>
                  </div>
                  <div className='flex flex-col items-center'>
                    <QRCodeSVG
                      value={placementName}
                      className='print:size-8 size-14'
                    />
                    <span className='text-[10px] font-medium'>{placementName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={ref}
                className={cn(
                  'print:w-auto print:h-auto print:border-none print:rounded-none',
                  'w-[15cm] h-[8cm]'
                )}>
                <div className='p-6 print:p-10 flex flex-col justify-between items-center h-full'>
                  <div className='flex flex-col gap-1'>
                    <p className='font-bold text-3xl print:leading-normal truncate print:text-5xl'>
                      {placementName}
                    </p>
                  </div>
                  <div className='flex items-end justify-center'>
                    <div className='flex flex-col items-center gap-0.5'>
                      <QRCodeSVG
                        value={placementName}
                        className='print:size-40 size-36'
                      />
                      <span className='text-xs'>{placementName}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <ButtonOpenPrint labelRef={ref} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
