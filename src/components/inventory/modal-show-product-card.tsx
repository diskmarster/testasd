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
import { cn, numberToDKCurrency } from '@/lib/utils'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { useLanguage } from '@/context/language'
import { useTranslation } from '@/app/i18n/client'
import { hasPermissionByRank } from '@/data/user.types'
import { User } from 'lucia'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface Props {
  product: FormattedProduct
  user: User
}

export function ModalShowProductCard({ product, user }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'other')
  return (
    <Credenza>
      <CredenzaTrigger className='hover:underline flex items-center gap-2' asChild>
        <div className='cursor-pointer'>
          {product.sku}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn('hidden size-1.5 rounded-full bg-destructive cursor-pointer', product.isBarred && 'block')} />
              </TooltipTrigger>
              <TooltipContent className='bg-foreground text-background'>
                {t('modal-show-product-card.barred-tooltip')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CredenzaTrigger>
      <CredenzaContent className='max-w-lg'>
        <CredenzaHeader>
          <CredenzaTitle asChild>
            <div className='flex items-center gap-3'>
              <p className='md:w-11/12'>{product.text1}</p>
              {product.isBarred && <Badge variant='red'>{t('modal-show-product-card.barred')}</Badge>}
            </div>
          </CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody className='space-y-4 pb-4 md:pb-0'>
          <div className='space-y-2'>
            <div>
              <span className='text-sm text-muted-foreground'>{t('modal-show-product-card.text2')}</span>
              <p>{product.text2 != '' ? product.text2 : t('modal-show-product-card.no-text2')}</p>
            </div>
            <div>
              <span className='text-sm text-muted-foreground'>{t('modal-show-product-card.text3')}</span>
              <p>{product.text3 != '' ? product.text3 : t('modal-show-product-card.no-text3')}</p>
            </div>
            <Separator className='!my-4' />
            <div className='flex items-center gap-2'>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>
                  {t('modal-show-product-card.product-group')}
                </span>
                <p>{product.group}</p>
              </div>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>{t('modal-show-product-card.unit')}</span>
                <p>{product.unit}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>{t('modal-show-product-card.product-no')}</span>
                <p>{product.sku}</p>
              </div>
              <div className='w-1/2'>
                <span className='text-sm text-muted-foreground'>{t('modal-show-product-card.barcode')}</span>
                <p>{product.barcode}</p>
              </div>
            </div>
            {hasPermissionByRank(user.role, 'bruger') && user.priceAccess && (
              <div className='flex items-center gap-2'>
                <div className='w-1/2'>
                  <span className='text-sm text-muted-foreground'>{t('modal-show-product-card.cost-price')}</span>
                  <p>{numberToDKCurrency(product.costPrice)}</p>
                </div>
                <div className='w-1/2'>
                  <span className='text-sm text-muted-foreground'>{t('modal-show-product-card.sales-price')}</span>
                  <p>{numberToDKCurrency(product.salesPrice)}</p>
                </div>
              </div>
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}
