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
      <CredenzaContent className='w-auto'>
        <CredenzaHeader>
          <CredenzaTitle>Produkt label</CredenzaTitle>
          <CredenzaDescription>
            A responsive modal component for shadcn/ui.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className='space-y-4'>
          <div
            ref={ref}
            style={{ aspectRatio: '51 / 25' }}
            className={cn(
              'border rounded-md mx-auto',
              // label styles
              'flex flex-col justify-between p-4',
            )}>
            <div className='flex flex-col gap-1'>
              <p className='font-semibold'>{product.text1}</p>
              <p className='text-sm'>{product.text2}</p>
            </div>
            <div className='flex items-end justify-between'>
              <p>Vnr: {product.sku}</p>
              <QRCodeSVG value={product.barcode} size={56} />
            </div>
          </div>
          <ButtonOpenPrint labelRef={ref} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
