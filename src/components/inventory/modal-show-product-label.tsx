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

export type LabelSize = 'small' | 'medium' | 'big'

export function ModalShowProductLabel({ product }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'other')
  const sizes = ['small', 'medium', 'big']
  const [size, setSize] = useState<LabelSize>(
    localStorage.getItem('label-size') as LabelSize ?? 'small'
  )
  const [open, setOpen] = useState(false)

  function onOpenChange(open: boolean) {
    setOpen(open)
    setSize(
      localStorage.getItem('label-size') as LabelSize ?? 'small'
    )
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
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
              onValueChange={(value: LabelSize) => {
                localStorage.setItem('label-size', value)
                setSize(value)
              }
              }>
              <SelectTrigger>
                <SelectValue placeholder={t('modal-show-product-label.size')} />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size, index) => (
                  <SelectItem key={index} value={size} className='cursor-pointer'>
                    <div className='flex gap-1 items-center'>
                      <span className='capitalize'>{t('modal-show-product-label.size', { context: size })}</span>
                      <span className='text-muted-foreground'>- {t('modal-show-product-label.size-desc', { context: size })}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='border rounded-md'>
            {size == 'small' ? (
              product.text1.length > 25 || product.text2.length > 25 ? (
                <div
                  ref={ref}
                  className={cn(
                    'print:w-[51mm] print:h-[21mm] w-96',
                  )}>
                  <div className='p-1.5 space-y-1.5'>
                    <div className='print:text-xs line-clamp-2 leading-tight font-semibold'>{product.text1}</div>
                    <div className='flex justify-between'>
                      <div className='flex flex-col gap-1 justify-between'>
                        <div className='print:text-[9px] text-sm font-medium line-clamp-2 leading-tight'>{product.text2}</div>
                        <div className='print:text-[9px] text-sm font-medium justify-self-end'>
                          {t('modal-show-product-label.prod-no')} {product.sku}
                        </div>
                      </div>
                      <div className='flex flex-col items-center justify-between'>
                        <QRCodeSVG
                          value={product.barcode}
                          className='print:size-7 size-14'
                        />
                        <span className='print:text-[9px] text-sm font-semibold w-max justify-self-end'>{product.barcode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
                      <p className='truncate max-w-56 print:text-[10px] font-bold text-xs'>
                        {product.text2}
                      </p>
                    </div>
                    <div className='flex items-end justify-between'>
                      <p className='print:text-[10px] text-xs font-bold'>
                        {t('modal-show-product-label.prod-no')} {product.sku}
                      </p>
                      <div className='flex flex-col items-center'>
                        <QRCodeSVG
                          value={product.barcode}
                          className='print:size-8 size-14'
                        />
                        <span className='text-[10px] font-semibold'>{product.barcode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : size == 'medium' ? (
              product.text1.length > 25 || product.text2.length > 25 ? (
                <div
                  ref={ref}
                  className={cn(
                    'w-[332px] h-[51mm]',
                    'print:w-auto print:h-auto'
                  )}>
                  <div className='p-2.5 flex flex-col space-y-2 h-full items-stretch'>
                    <div className='print:text-xl text-base font-semibold'>{product.text1}</div>
                    <div className='flex justify-between h-full'>
                      <div className='flex flex-col justify-between'>
                        <div className='print:text-sm text-sm font-medium line-clamp-2'>{product.text2}</div>
                        <div className='print:text-sm text-sm font-medium justify-self-end'>
                          {t('modal-show-product-label.prod-no')} {product.sku}
                        </div>
                      </div>
                      <div className='flex flex-col items-center justify-end'>
                        <QRCodeSVG
                          value={product.barcode}
                          className='print:size-14 size-14'
                        />
                        <span className='print:text-xs text-xs font-medium w-max justify-self-end'>{product.barcode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={ref}
                  className={cn(
                    'print:w-auto print:h-auto print:border-none print:rounded-none',
                    'w-[332px] h-[51mm]'
                  )}>
                  <div className='p-2.5 flex flex-col justify-between h-full'>
                    <div className='flex flex-col gap-1'>
                      <p className='font-bold text-base print:leading-normal truncate print:text-xl'>
                        {product.text1}
                      </p>
                      <p className='text-sm print:text-sm truncate'>
                        {product.text2}
                      </p>
                    </div>
                    <div className='flex items-end justify-between'>
                      <p className='text-sm print:text-sm'>
                        {t('modal-show-product-label.prod-no')} {product.sku}
                      </p>
                      <div className='flex flex-col items-center gap-0.5'>
                        <QRCodeSVG
                          value={product.barcode}
                          className='print:size-14 size-14'
                        />
                        <span className='text-xs'>{product.barcode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              product.text1.length > 25 || product.text2.length > 25 ? (
                <div
                  ref={ref}
                  className={cn(
                    'w-[15cm] h-[8cm]',
                    'print:w-auto print:h-auto'
                  )}>
                  <div className='p-6 flex flex-col space-y-4 h-full items-stretch'>
                    <div className='print:text-5xl text-3xl font-semibold'>{product.text1}</div>
                    <div className='flex justify-between h-full'>
                      <div className='flex flex-col justify-between'>
                        <div className='print:text-3xl text-2xl font-medium line-clamp-2'>{product.text2}</div>
                        <div className='print:text-3xl text-2xl font-medium justify-self-end'>
                          {t('modal-show-product-label.prod-no')} {product.sku}
                        </div>
                      </div>
                      <div className='flex flex-col items-center justify-end'>
                        <QRCodeSVG
                          value={product.barcode}
                          className='print:size-32 size-38'
                        />
                        <span className='print:text-xs text-xs font-medium w-max justify-self-end'>{product.barcode}</span>
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
              )
            )}
          </div>
          <ButtonOpenPrint labelRef={ref} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
