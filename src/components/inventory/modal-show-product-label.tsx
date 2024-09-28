'use client'

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { FormattedProduct } from '@/data/products.types'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { ButtonOpenPrint } from './button-open-print'

interface Props {
  product: FormattedProduct
}

export function ModalShowProductLabel({ product }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button size='iconSm' variant='ghost'>
          <Icons.printer className='size-4' />
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className='max-w-72'>
        <CredenzaHeader>
          <CredenzaTitle>Produkt label</CredenzaTitle>
          <CredenzaDescription>
            Print label til dine produkter
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className='space-y-4'>
          <div ref={ref} className={cn('border rounded-md')}>
            <div className='m-1.5 space-y-1'>
              <div className='flex flex-col gap-0.5'>
                <p className='font-bold text-sm truncate max-w-56 print:text-xs'>
                  {product.text1}
                </p>
                <p className='text-sm truncate max-w-56 print:text-xs'>
                  {product.text2}
                </p>
              </div>
              <div className='flex items-end justify-between'>
                <p className='print:text-xs text-sm'>Vnr: {product.sku}</p>
                <QRCodeSVG value={product.barcode} size={40} />
              </div>
            </div>
          </div>
          <ButtonOpenPrint labelRef={ref} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
