'use client'

import { useTranslation } from '@/app/i18n/client'
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { useLanguage } from '@/context/language'
import { FormattedProduct } from '@/data/products.types'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { ButtonOpenPrint } from './button-open-print'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface Props {
  product: FormattedProduct
}

export function ModalShowProductLabel({ product }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'other')
  const sizes = [{ label: 'lille', desc: 'egnet til 51x26mm' }, { label: 'stor', desc: 'egnet til 100x192mm' }]
  const [size, setSize] = useState<'lille' | 'stor'>('lille')

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button size='iconSm' variant='ghost'>
          <Icons.printer className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='min-w-96 max-w-fit'>
        <CredenzaHeader>
          <CredenzaTitle>{t('modal-show-product-label.title')}</CredenzaTitle>
          <CredenzaDescription>
            {t('modal-show-product-label.description')}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className='space-y-4 pb-4 md:pb-0'>
          <div className='grid gap-2'>
            <Label htmlFor='size'>
              {t('modal-show-product-label.size')}
            </Label>
            <Select
              value={size}
              onValueChange={(value: 'lille' | 'stor') =>
                setSize(value)
              }>
              <SelectTrigger>
                <SelectValue placeholder={t('modal-show-product-label.size')} />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size, index) => (
                  <SelectItem key={index} value={size.label} className='cursor-pointer'>
                    <div className='flex gap-1 items-center'>
                      <span className='capitalize'>{t('modal-show-product-label.size', { context: size.label })}</span>
                      <span className='text-muted-foreground'>- {t('modal-show-product-label.size-desc', { context: size.label })}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='border rounded-md'>
            {size == 'lille' ? (
              <div
                ref={ref}
                className={cn(
                  'print:w-[51mm] print:h-[21mm]',
                )}>
                <div className='p-1.5 space-y-1'>
                  <div className='flex flex-col'>
                    <p className='font-bold truncate max-w-56 print:text-xs'>
                      {product.text1}
                    </p>
                    <p className='truncate max-w-56 print:text-[10px] text-xs'>
                      {product.text2}
                    </p>
                  </div>
                  <div className='flex items-end justify-between'>
                    <p className='print:text-[10px] text-xs'>
                      {t('modal-show-product-label.prod-no')} {product.sku}
                    </p>
                    <div className='flex flex-col items-center'>
                      <QRCodeSVG
                        value={product.barcode}
                        className='print:size-8 size-14'
                      />
                      <span className='text-[10px]'>{product.barcode}</span>
                    </div>
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
                <div className='p-6 print:p-10 flex flex-col justify-between h-full'>
                  <div className='flex flex-col gap-1'>
                    <p className='font-bold text-3xl print:leading-normal truncate print:text-5xl'>
                      {product.text1}
                    </p>
                    <p className='text-2xl print:text-4xl truncate'>
                      {product.text2}
                    </p>
                  </div>
                  <div className='flex items-end justify-between'>
                    <p className='text-2xl print:text-4xl'>
                      {t('modal-show-product-label.prod-no')} {product.sku}
                    </p>
                    <div className='flex flex-col items-center gap-0.5'>
                      <QRCodeSVG
                        value={product.barcode}
                        className='print:size-32 size-28'
                      />
                      <span className='text-xs'>{product.barcode}</span>
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
