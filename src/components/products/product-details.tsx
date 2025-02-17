"use client"

import { FormattedProduct } from "@/data/products.types"
import { Inventory } from "@/lib/database/schema/inventory"
import { Badge } from "../ui/badge"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { hasPermissionByRank } from "@/data/user.types"
import { numberToDKCurrency } from "@/lib/utils"
import { useSession } from "@/context/session"

interface Props {
	product: FormattedProduct & { inventories: Inventory[] }
}

export function ProductDetails({ product }: Props) {
	const { user } = useSession()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'product')

	return (
		<div className="w-full lg:w-1/2 border rounded-md p-4">
			<div className="flex items-start justify-between">
				<div className='flex items-start gap-3 flex-1'>
					<p className='md:max-w-[90%]'>{product.text1}</p>
					{product.isBarred && <Badge variant='red'>{t('modal-show-product-card.barred')}</Badge>}
				</div>
				<div>
					<Button variant='outline'>Rediger</Button>
				</div>
			</div>

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
		</div>
	)
}
