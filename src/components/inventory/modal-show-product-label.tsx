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
      <CredenzaContent className='max-w-sm'>
        <CredenzaHeader>
          <CredenzaTitle>Produkt label</CredenzaTitle>
          <CredenzaDescription>
            Print label til dine produkter
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className='space-y-4 pb-4 md:pb-0'>
          <div
            ref={ref}
            className={cn(
              'border rounded-md',
              'print:w-[51mm] print:h-[21mm]',
            )}>
            <div className='m-1.5 space-y-1.5'>
              <div className='flex flex-col gap-0.5'>
                <p className='font-bold truncate max-w-56 print:text-xs'>
                  {product.text1}
                </p>
                <p className='truncate max-w-56 print:text-xs'>
                  {product.text2}
                </p>
              </div>
              <div className='flex items-end justify-between'>
                <p className='print:text-xs'>Vnr: {product.sku}</p>
                <QRCodeSVG
                  value={product.barcode}
                  className='print:size-10 size-16'
                />
              </div>
            </div>
          </div>
          <ButtonOpenPrint labelRef={ref} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
