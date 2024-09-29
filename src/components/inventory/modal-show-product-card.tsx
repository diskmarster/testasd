'use client'

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/ui/credenza'
import { FormattedProduct } from '@/data/products.types'
import { numberToDKCurrency } from '@/lib/utils'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

interface Props {
  product: FormattedProduct
}

export function ModalShowProductCard({ product }: Props) {
  return (
    <Credenza>
      <CredenzaTrigger className='hover:underline'>
        {product.sku}
      </CredenzaTrigger>
      <CredenzaContent className='max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle asChild>
            <div className='flex items-center gap-3'>
              <p>{product.text1}</p>
              {product.isBarred && <Badge variant='destructive'>Spærret</Badge>}
            </div>
          </CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody className='space-y-4'>
          <div className='space-y-2'>
            <div>
              <span className='text-sm text-muted-foreground'>Varetekst 2</span>
              <p>{product.text2 != '' ? product.text2 : 'Ingen varetekst 2'}</p>
            </div>
            <div>
              <span className='text-sm text-muted-foreground'>Varetekst 3</span>
              <p>{product.text3 != '' ? product.text3 : 'Ingen varetekst 3'}</p>
            </div>
            <Separator className='!my-4' />
            <div className='flex items-center gap-2'>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>
                  Varegruppe
                </span>
                <p>{product.group}</p>
              </div>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>Enhed</span>
                <p>{product.unit}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>Varenr.</span>
                <p>{product.sku}</p>
              </div>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>Stregkode</span>
                <p>{product.barcode}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>Kostpris</span>
                <p>{numberToDKCurrency(product.costPrice)}</p>
              </div>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>Salgspris</span>
                <p>{numberToDKCurrency(product.salesPrice)}</p>
              </div>
            </div>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
