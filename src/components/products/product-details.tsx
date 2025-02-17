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
import { useState } from "react"
import { User } from "lucia"
import { updateProductValidation } from "@/app/[lng]/(site)/varer/produkter/[id]/validation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { IfElse } from "../common/if-else"
import { Input } from "../ui/input"

interface Props {
	product: FormattedProduct & { inventories: Inventory[] }
	user: User
}

export function ProductDetails({ product, user }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'product')
	const [isEditing, setIsEditing] = useState(false)
	const schema = updateProductValidation(t)

	const { setValue, watch } = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			productID: product.id,
			data: { ...product }
		}
	})

	const formValues = watch()

	return (
		<div className="w-full lg:w-1/2 border rounded-md p-4">
			<div className="flex items-start gap-4 justify-between">
				<IfElse
					condition={isEditing}
					trueComp={
						<div className='flex items-start gap-3 flex-1'>
							<Input
								type="text"
								className="h-9"
								value={formValues.data.text1}
								onChange={event => setValue("data.text1", event.target.value, { shouldValidate: true })}
							/>
						</div>
					}
					falseComp={
						<div className='flex items-start gap-3 flex-1'>
							<p className='md:max-w-[90%]'>{product.text1}</p>
							{product.isBarred && <Badge variant='red'>{t('modal-show-product-card.barred')}</Badge>}
						</div>
					}
				/>
				<IfElse
					condition={isEditing}
					trueComp={
						<div className="space-x-2">
							<Button onClick={() => setIsEditing(false)} variant='outline'>Fortryd</Button>
							<Button onClick={() => alert("submitting")} variant='default'>Gem</Button>
						</div>
					}
					falseComp={
						<Button onClick={() => setIsEditing(true)} variant='outline'>Rediger</Button>
					}
				/>
			</div>

			<div className='space-y-2'>
				<div className="space-y-1">
					<span className='text-sm text-muted-foreground'>{t('modal-show-product-card.text2')}</span>
					<IfElse
						condition={isEditing}
						trueComp={
							<Input
								type="text"
								className="h-9 w-1/3"
								value={formValues.data.text2}
								onChange={event => setValue("data.text2", event.target.value, { shouldValidate: true })}
							/>
						}
						falseComp={
							<p className="h-9">{product.text2 != '' ? product.text2 : t('modal-show-product-card.no-text2')}</p>
						}
					/>
				</div>
				<div className="space-y-1">
					<span className='text-sm text-muted-foreground'>{t('modal-show-product-card.text3')}</span>
					<IfElse
						condition={isEditing}
						trueComp={
							<Input
								type="text"
								className="h-9 w-1/3"
								value={formValues.data.text3}
								onChange={event => setValue("data.text3", event.target.value, { shouldValidate: true })}
							/>
						}
						falseComp={
							<p className="h-9 text-">{product.text3 != '' ? product.text3 : t('modal-show-product-card.no-text3')}</p>
						}
					/>
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
