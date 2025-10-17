'use client'

import { requestProductAction } from '@/app/[lng]/(smartphone)/m/actions'
import { useTranslation } from '@/app/i18n/client'
import { ButtonGroup } from '@/components/ui/button-group'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerTrigger,
} from '@/components/ui/drawer'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { useLanguage } from '@/context/language'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan } from '@/data/user.types'
import { Customer } from '@/lib/database/schema/customer'
import { Product } from '@/lib/database/schema/inventory'
import { cn, formatNumber, numberToCurrency } from '@/lib/utils'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { DrawerList } from './smartphone-drawer-list'
import { SmartphoneScanner } from './smartphone-scanner'

type InventoryProduct = Product & {
	unit: string
	group: string
	fileCount: number
	supplierName: string | null
	useBatch: boolean
	isReorder: boolean
}

interface Props {
	customer: Customer
	settings: Awaited<ReturnType<typeof customerService.getSettings>>
	inventories: Awaited<ReturnType<typeof inventoryService.getInventory>>
}

export function SmartphoneLookup({ customer, inventories }: Props) {
	const [findingProduct, startProductTransition] = useTransition()

	const [sku, setSku] = useState<string>('')
	const [debouncedSku] = useDebounce(sku, 500)

	const [availableInventories, setAvailableInventories] = useState<
		FormattedInventory[]
	>([])

	const [isScanning, setIsScanning] = useState(false)

	const [selectedProduct, setSelectedProduct] = useState<
		InventoryProduct | undefined
	>(undefined)
	const [allProducts] = useState<InventoryProduct[]>(
		Object.values(
			inventories.reduce(
				(acc, cur) => {
					const product = cur.product
					if (!acc[product.id]) {
						acc[product.id] = product
					}
					return acc
				},
				{} as Record<string, InventoryProduct>,
			),
		),
	)

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')

	const updateSelected = useCallback(
		(identifier: string) => {
			let selectedProduct: InventoryProduct | undefined
			let availableInventories: FormattedInventory[] = []

			startProductTransition(() => {
				const tempInvs = inventories.filter(
					inv =>
						inv.product.barcode.toLowerCase() === identifier.toLowerCase() ||
						inv.product.sku.toLowerCase() === identifier.toLowerCase(),
				)
				if (tempInvs.length === 0) {
					return
				}
				selectedProduct = tempInvs[0].product
				availableInventories = tempInvs
			})

			return { selectedProduct, availableInventories }
		},
		[inventories],
	)

	useEffect(() => {
		const { selectedProduct: selected, availableInventories } =
			updateSelected(debouncedSku)
		setSelectedProduct(selected)
		setAvailableInventories(availableInventories)
	}, [debouncedSku])

	function onSuccess(data: string) {
		setSku(data)
		setIsScanning(false)
	}

	return (
		<div className='grow flex flex-col gap-4'>
			<div className='space-y-4'>
				<SelectedProduct
					loading={findingProduct && debouncedSku != ''}
					showNotFound={debouncedSku != ''}
					product={selectedProduct}
					inventories={availableInventories}
					customer={customer}
				/>

				{!selectedProduct && (
					<>
						<div className='grid gap-1.5'>
							<Label>{t('updateInventory.identifierLabel')}</Label>
							<div className='grid w-full gap-6'>
								<ButtonGroup className='h-14 w-full'>
									<DrawerList
										searchable
										selected={sku}
										options={allProducts.map(p => ({
											label: `${p.text1} (${p.sku})`,
											sub: p.text2 != '' ? p.text2 : t('lookup.noValue'),
											value: p.sku,
										}))}
										onSelect={opt => setSku(opt.value)}>
										<Button
											type='button'
											size='icon'
											variant='secondary'
											className='h-full border'>
											<Icons.list className='size-4' />
										</Button>
									</DrawerList>
									<InputGroup className='h-full'>
										<InputGroupInput
											value={sku}
											className='text-base'
											onChange={e => setSku(e.target.value)}
											placeholder={t('updateInventory.identifierPlaceholder')}
										/>

										{sku != undefined && sku != '' && (
											<InputGroupAddon
												align='inline-end'
												onClick={() => {
													setSku('')
												}}>
												<Icons.cross />
											</InputGroupAddon>
										)}
									</InputGroup>
									<Button
										type='button'
										size='icon'
										variant='secondary'
										className='h-full border'
										onClick={() => {
											setIsScanning(!isScanning)
										}}>
										<Icons.scanBarcode className='size-4' />
									</Button>
								</ButtonGroup>
							</div>
						</div>
					</>
				)}
			</div>

			{selectedProduct && (
				<div className='mt-auto space-y-2'>
					<Button
						type='button'
						className='w-full h-14'
						variant='secondary'
						size='lg'
						onClick={() => setSku('')}>
						{t('lookup.resetButton')}
					</Button>
					{hasPermissionByPlan(customer.plan, 'basis') &&
						!selectedProduct?.isReorder && (
							<RequestProduct productID={selectedProduct.id} />
						)}
				</div>
			)}

			<Drawer open={isScanning} onOpenChange={open => setIsScanning(open)}>
				<DrawerContent>
					<div className='w-full mt-4 aspect-square'>
						<div className='border mx-4 rounded-lg overflow-hidden shadow-md h-full'>
							<SmartphoneScanner onDetected={onSuccess} />
						</div>
					</div>
					<DrawerFooter>
						<DrawerClose>
							<Button type='button' variant='outline'>
								{t('closeDrawer')}
							</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	)
}

function SelectedProduct({
	loading,
	showNotFound,
	product,
	inventories,
	customer,
}: {
	loading: boolean
	showNotFound: boolean
	product: InventoryProduct | undefined
	inventories: FormattedInventory[]
	customer: Customer
}) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')

	if (loading)
		return (
			<div className='border shadow-sm py-2 px-3 rounded-lg flex items-center gap-2'>
				<Icons.spinner className='size-4 animate-spin' />
				<p className='text-sm'>{t('lookup.findingProduct')}</p>
			</div>
		)

	if (!product && !showNotFound) return null

	if (!product && showNotFound)
		return (
			<div className='border shadow-sm py-2 px-3 rounded-lg flex items-center gap-2'>
				<Icons.triangleAlert className='size-4 text-warning' />
				<p className='text-sm'>{t('lookup.noProductFound')}</p>
			</div>
		)

	const totalQty = inventories.reduce((acc, cur) => acc + cur.quantity, 0)

	return (
		<>
			<div
				className={cn(
					'border shadow-sm py-2 px-3 rounded-lg',
					product?.isBarred && 'border-destructive',
				)}>
				{product && (
					<div className='space-y-2'>
						<div className='flex items-start justify-between'>
							<div>
								<p className='font-medium line-clamp-1 text-sm'>
									{product.text1}
								</p>
								<p className='text-muted-foreground text-sm line-clamp-1'>
									{product.text2}
								</p>
							</div>
							{product.isBarred && (
								<Badge variant='destructive'>{t('lookup.isBarred')}</Badge>
							)}
						</div>
						<Separator />
						<div className='flex items-baseline justify-between'>
							<span className='text-sm font-medium'>{t('lookup.sku')}</span>
							<span className='text-sm text-muted-foreground truncate'>
								{product.sku}
							</span>
						</div>
						<div className='flex items-baseline justify-between'>
							<span className='text-sm font-medium'>{t('lookup.barcode')}</span>
							<span className='text-sm text-muted-foreground truncate'>
								{product.barcode}
							</span>
						</div>
						<div className='flex items-baseline justify-between'>
							<span className='text-sm font-medium'>{t('lookup.group')}</span>
							<span className='text-sm text-muted-foreground truncate'>
								{product.group}
							</span>
						</div>
						<div className='flex items-baseline justify-between'>
							<span className='text-sm font-medium'>{t('lookup.unit')}</span>
							<span className='text-sm text-muted-foreground'>
								{product.unit}
							</span>
						</div>
						<div className='flex items-baseline justify-between'>
							<span className='text-sm font-medium'>
								{t('lookup.costPrice')}
							</span>
							<span className='text-sm text-muted-foreground'>
								{numberToCurrency(product.costPrice)}
							</span>
						</div>
						<div className='flex items-baseline justify-between'>
							<span className='text-sm font-medium'>
								{t('lookup.salesPrice')}
							</span>
							<span className='text-sm text-muted-foreground'>
								{numberToCurrency(product.salesPrice)}
							</span>
						</div>
						{hasPermissionByPlan(customer.plan, 'basis') && (
							<div className='flex items-baseline justify-between'>
								<span className='text-sm font-medium'>
									{t('lookup.reorder')}
								</span>
								<span className='text-sm text-muted-foreground'>
									{t('lookup.reorder', {
										context: product.isReorder.toString(),
									})}
								</span>
							</div>
						)}
					</div>
				)}
			</div>

			<div className='border shadow-sm py-2 px-3 rounded-lg'>
				<div className='space-y-2'>
					<div>
						<p className='font-medium line-clamp-1 text-sm'>
							{t('lookup.inventories')}
						</p>
						<p className='text-muted-foreground text-sm line-clamp-1'>
							{t('lookup.atInventories', { count: inventories.length })}
						</p>
					</div>
					<Separator />
					<div className='flex items-baseline justify-between'>
						<span className='text-sm font-medium'>{t('lookup.total')}</span>
						<span className='text-sm tabular-nums text-muted-foreground'>
							{formatNumber(totalQty)}
						</span>
					</div>
					<Separator />
					<ScrollArea>
						{inventories.map(i => (
							<div
								key={`${i.product.id}-${i.placement.id}-${i.batch.id}`}
								className='flex items-baseline justify-between'>
								<span className='text-sm'>{i.placement.name}</span>
								<span
									className={cn(
										'text-sm tabular-nums text-muted-foreground',
										i.quantity < 0 && 'text-destructive',
									)}>
									{formatNumber(i.quantity)}
								</span>
							</div>
						))}
					</ScrollArea>
				</div>
			</div>
		</>
	)
}

function RequestProduct({ productID }: { productID: number }) {
	const [pending, startTransition] = useTransition()
	const router = useRouter()

	const [open, setOpen] = useState(false)
	const [amount, setAmount] = useState<number>(0)

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')

	function increment(n: number) {
		const nextValue = amount + n
		setAmount(parseFloat(nextValue.toFixed(4)))
		setAmount(nextValue)
	}

	function decrement(n: number) {
		const nextValue = Math.max(0, amount - n)
		setAmount(parseFloat(nextValue.toFixed(4)))
		setAmount(nextValue)
	}

	function submit() {
		startTransition(async () => {
			const res = await requestProductAction({ productID, orderAmount: amount })
			if (!res) {
				toast(t('lookup.errorToast'))
				return
			}
			if (res.serverError) {
				toast(res.serverError)
				return
			}
			toast(t('lookup.successToast'))
			setAmount(0)
			setOpen(false)
			router.refresh()
		})
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger className='flex items-center gap-1 text-sm' asChild>
				<Button type='button' className='w-full h-14' size='lg'>
					{t('lookup.addToCartButton')}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<div className='mt-4 mx-4'>
					<div className='grid gap-1.5'>
						<Label>{t('updateInventory.amountLabel')}</Label>
						<ButtonGroup className='h-14'>
							<Button
								type='button'
								size='icon'
								variant='secondary'
								className='h-full border'
								onClick={() => decrement(10)}>
								<Icons.minus className='size-3' />
								<span className='tabular-nums'>10</span>
							</Button>

							<Button
								type='button'
								size='icon'
								variant='secondary'
								className='h-full border'
								onClick={() => decrement(1)}>
								<Icons.minus className='size-3' />
								<span className='tabular-nums'>1</span>
							</Button>

							<InputGroup className='h-full'>
								<InputGroupInput
									className='text-center text-base'
									style={{
										appearance: 'textfield',
									}}
									value={amount}
									type='number'
									onChange={e => setAmount(e.target.valueAsNumber)}
									placeholder={t('updateInventory.amountPlaceholder')}
								/>
							</InputGroup>

							<Button
								type='button'
								size='icon'
								variant='secondary'
								className='h-full border'
								onClick={() => increment(1)}>
								<Icons.plus className='size-3.5' />
								<span className='tabular-nums'>1</span>
							</Button>

							<Button
								type='button'
								size='icon'
								variant='secondary'
								className='h-full border space-x-0.5'
								onClick={() => increment(10)}>
								<Icons.plus className='size-3.5' />
								<span className='tabular-nums'>10</span>
							</Button>
						</ButtonGroup>
					</div>
				</div>
				<DrawerFooter>
					<Button
						disabled={amount === 0}
						className='h-14 flex items-center gap-2'
						onClick={submit}>
						{pending && <Icons.spinner className='animate-spin' />}
						{t('lookup.addToCartButton')}
					</Button>
					<DrawerClose>
						<Button type='button' variant='outline' className='w-full h-14'>
							{t('closeDrawer')}
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
