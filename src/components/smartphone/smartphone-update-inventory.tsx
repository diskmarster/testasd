'use client'

import { updateInventoryAction } from '@/app/[lng]/(site)/oversigt/actions'
import { updateInventoryValidation } from '@/app/[lng]/(smartphone)/m/validation'
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
import { Batch, Placement, Product } from '@/lib/database/schema/inventory'
import { formatDate } from '@/lib/utils'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { z } from 'zod'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Textarea } from '../ui/textarea'
import { DrawerList } from './smartphone-drawer-list'
import { SmartphoneScanner } from './smartphone-scanner'

type InventoryProduct = Product & {
	unit: string
	group: string
	fileCount: number
	supplierName: string | null
	useBatch: boolean
}

interface Props {
	updateType: 'tilgang' | 'afgang' | 'regulering' | 'flyt'
	settings: Awaited<ReturnType<typeof customerService.getSettings>>
	inventories: Awaited<ReturnType<typeof inventoryService.getInventory>>
}

export function SmartphoneUpdateInventory({
	settings,
	inventories,
	updateType,
}: Props) {
	const [findingProduct, startProductTransition] = useTransition()
	const [submittingRequest, startRequestTransition] = useTransition()

	const [sku, setSku] = useState<string>('')
	const [debouncedSku] = useDebounce(sku, 500)

	const [placement, setPlacement] = useState<string>(
		settings?.usePlacement ? '' : '-',
	)
	const [debouncedPlacement] = useDebounce(placement, 500)

	const [batch, setBatch] = useState<string>('')
	const [debouncedBatch] = useDebounce(batch, 500)

	const [reference, setReference] = useState<string>('')
	const [debouncedReference] = useDebounce(reference, 500)

	const [amount, setAmount] = useState<number>(0)

	const [isScanning, setIsScanning] = useState(false)
	const [scanTarget, setScanTarget] = useState<'sku' | 'placement' | 'batch'>(
		'sku',
	)

	const [selectedProduct, setSelectedProduct] = useState<
		InventoryProduct | undefined
	>(undefined)
	const [availablePlacements, setAvailablePlacements] = useState<Placement[]>(
		[],
	)
	const [availableBatch, setAvailableBatch] = useState<Batch[]>([])
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
	const updateSchema = updateInventoryValidation(t)

	const form = useForm<z.infer<typeof updateSchema>>({
		resolver: zodResolver(updateSchema),
		defaultValues: {
			type: updateType,
			amount: 0,
			productID: undefined,
			placementID: undefined,
			batchID: undefined,
			reference: '',
		},
	})

	const updateSelected = useCallback(
		(identifier: string) => {
			let selectedProduct: InventoryProduct | undefined
			let availableInventories: FormattedInventory[] = []
			let availablePlacements: Placement[] = []
			let availableBatch: Batch[] = []

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

				availablePlacements = Object.values(
					tempInvs.reduce(
						(acc, cur) => {
							const placement = cur.placement
							if (!acc[placement.id]) {
								acc[placement.id] = placement
							}
							return acc
						},
						{} as Record<string, Placement>,
					),
				)

				availableBatch = Object.values(
					tempInvs.reduce(
						(acc, cur) => {
							const batch = cur.batch
							if (!acc[batch.id]) {
								acc[batch.id] = batch
							}
							return acc
						},
						{} as Record<string, Batch>,
					),
				)
			})

			return {
				selectedProduct,
				availableInventories,
				availablePlacements,
				availableBatch,
			}
		},
		[inventories],
	)

	useEffect(() => {
		const {
			selectedProduct: selected,
			availablePlacements,
			availableBatch,
		} = updateSelected(debouncedSku)
		setSelectedProduct(selected)
		setAvailablePlacements(availablePlacements)
		setAvailableBatch(availableBatch)

		if (selected) {
			form.setValue('productID', selected.id, { shouldValidate: true })
			if (!selected.useBatch) {
				setBatch('-')
			}
		} else {
			form.reset()
			setPlacement('')
			setBatch('')
			setAmount(0)
			setReference('')
		}
	}, [debouncedSku])

	useEffect(() => {
		const knownPlacement = availablePlacements.find(
			p => p.name === debouncedPlacement,
		)
		if (knownPlacement) {
			form.setValue('placementID', knownPlacement.id)
		} else if (debouncedPlacement == '') {
			form.setValue('placementID', undefined as unknown as string)
		} else {
			form.setValue('placementID', debouncedPlacement)
		}
	}, [debouncedPlacement])

	useEffect(() => {
		const knownBatch = availableBatch.find(p => p.batch === debouncedBatch)
		if (knownBatch) {
			form.setValue('batchID', knownBatch.id)
		} else if (debouncedBatch == '') {
			form.setValue('batchID', undefined as unknown as string)
		} else {
			form.setValue('batchID', debouncedBatch)
		}
	}, [debouncedBatch])

	useEffect(() => {
		form.setValue('reference', debouncedReference, { shouldValidate: true })
	}, [debouncedReference])

	function onSuccess(data: string) {
		switch (scanTarget) {
			case 'sku':
				setSku(data)
				break
			case 'placement':
				setPlacement(data)
				break
			case 'batch':
				setBatch(data)
				break
		}
		setIsScanning(false)
	}

	function increment(n: number) {
		const nextValue = amount + n
		setAmount(parseFloat(nextValue.toFixed(4)))
		form.setValue('amount', nextValue, { shouldValidate: true })
	}

	function decrement(n: number) {
		let nextValue = 0
		if (updateType === 'regulering') {
			nextValue = amount - n
		} else {
			nextValue = Math.max(0, amount - n)
		}
		setAmount(parseFloat(nextValue.toFixed(4)))
		form.setValue('amount', nextValue, { shouldValidate: true })
	}

	function submit(values: z.infer<typeof updateSchema>) {
		startRequestTransition(async () => {
			const res = await updateInventoryAction(values)
			if (!res) {
				toast(t('updateInventory.errorToast'))
				return
			}

			if (res.serverError) {
				toast(res.serverError)
				return
			}

			toast(
				t('updateInventory.successToast', {
					context: updateType,
					item: selectedProduct?.text1,
				}),
			)
			form.reset()
			setSku('')
			setPlacement('')
			setBatch('')
			setAmount(0)
			setReference('')
		})
	}

	return (
		<form
			onSubmit={form.handleSubmit(submit)}
			className='grow flex flex-col gap-4'>
			<div className='space-y-4'>
				<SelectedProduct
					loading={findingProduct && debouncedSku != ''}
					showNotFound={debouncedSku != ''}
					product={selectedProduct}
				/>

				<div className='grid gap-1.5'>
					<Label>{t('updateInventory.identifierLabel')}</Label>
					<div className='grid w-full gap-6'>
						<ButtonGroup className='h-14 w-full'>
							<DrawerList
								searchable
								selected={sku}
								options={allProducts.map(p => ({
									label: `${p.text1} (${p.sku})`,
									sub: p.text2 != '' ? p.text2 : 'Ingen varetekst 2',
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
									setScanTarget('sku')
									setIsScanning(!isScanning)
								}}>
								<Icons.scanBarcode className='size-4' />
							</Button>
						</ButtonGroup>
					</div>
				</div>

				{selectedProduct && settings?.usePlacement && (
					<div className='grid gap-1.5'>
						<Label>{t('updateInventory.placementLabel')}</Label>
						<div className='grid w-full gap-6'>
							<ButtonGroup className='h-14 w-full'>
								<DrawerList
									selected={placement}
									options={availablePlacements.map(p => ({
										label: p.name,
										value: p.name,
									}))}
									onSelect={opt => setPlacement(opt.value)}>
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
										value={placement}
										className='text-base'
										onChange={e => setPlacement(e.target.value)}
										placeholder={t('updateInventory.placementPlaceholder')}
									/>
									{placement != undefined && placement != '' && (
										<InputGroupAddon
											align='inline-end'
											onClick={() => {
												setPlacement('')
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
										setScanTarget('placement')
										setIsScanning(!isScanning)
									}}>
									<Icons.scanBarcode className='size-4' />
								</Button>
							</ButtonGroup>
						</div>
					</div>
				)}

				{selectedProduct && selectedProduct.useBatch && (
					<div className='grid gap-1.5'>
						<Label>{t('updateInventory.batchLabel')}</Label>
						<div className='grid w-full gap-6'>
							<ButtonGroup className='h-14 w-full'>
								<DrawerList
									selected={batch}
									options={availableBatch.map(p => ({
										label: p.batch,
										sub: p.expiry
											? `${t('updateInventory.batchExpiry')} ${formatDate(p.expiry, false)}`
											: undefined,
										value: p.batch,
									}))}
									onSelect={opt => setBatch(opt.value)}>
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
										value={batch}
										className='text-base'
										onChange={e => setBatch(e.target.value)}
										placeholder={t('updateInventory.batchPlaceholder')}
									/>

									{batch != undefined && batch != '' && (
										<InputGroupAddon
											align='inline-end'
											onClick={() => {
												setPlacement('')
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
										setScanTarget('batch')
										setIsScanning(!isScanning)
									}}>
									<Icons.scanBarcode className='size-4' />
								</Button>
							</ButtonGroup>
						</div>
					</div>
				)}

				{selectedProduct && (
					<div className='grid gap-1.5'>
						<Label>{t('updateInventory.amountLabel')}</Label>
						<div className='grid w-full gap-6'>
							<ButtonGroup className='h-14 w-full'>
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
										inputMode='decimal'
										onChange={e => {
											setAmount(e.target.valueAsNumber)
											form.setValue('amount', e.target.valueAsNumber, { shouldValidate: true })
										}}
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
				)}

				{selectedProduct && settings?.useReference[updateType] && (
					<div>
						<Drawer>
							<DrawerTrigger className='flex items-center gap-1 text-sm'>
								{debouncedReference ? (
									<>
										<Icons.squarePen className='size-4' />
										{t('updateInventory.referenceLabel', { context: 'edit' })}
									</>
								) : (
									<>
										<Icons.plus className='size-4' />
										{t('updateInventory.referenceLabel', { context: 'add' })}
									</>
								)}
							</DrawerTrigger>
							<DrawerContent>
								<div className='w-full mt-4 aspect-square max-h-32'>
									<div className='border mx-4 rounded-lg flex shadow-md h-full'>
										<Textarea
											style={{ resize: 'none' }}
											value={reference}
											onChange={e => setReference(e.target.value)}
											maxLength={300}
											className='w-full h-full'
										/>
									</div>
								</div>
								<DrawerFooter>
									<DrawerClose>
										<Button type='button' variant='outline'>
											Luk
										</Button>
									</DrawerClose>
								</DrawerFooter>
							</DrawerContent>
						</Drawer>
						{debouncedReference && (
							<p className='text-muted-foreground text-sm mt-1'>
								{debouncedReference}
							</p>
						)}
					</div>
				)}
			</div>

			<Button
				type='submit'
				className='w-full h-14 mt-auto'
				size='lg'
				disabled={!form.formState.isValid || submittingRequest}>
				{submittingRequest && <Icons.spinner className='size-4 animate-spin' />}
				{t('updateInventory.submitButton', { context: updateType })}
			</Button>

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
		</form>
	)
}

function SelectedProduct({
	loading,
	showNotFound,
	product,
}: {
	loading: boolean
	showNotFound: boolean
	product: InventoryProduct | undefined
}) {
	if (loading)
		return (
			<div className='border shadow-sm py-2 px-3 rounded-lg flex items-center gap-2'>
				<Icons.spinner className='size-4 animate-spin' />
				<p className='text-sm'>Finder vare...</p>
			</div>
		)

	if (!product && !showNotFound) return null

	if (!product && showNotFound)
		return (
			<div className='border shadow-sm py-2 px-3 rounded-lg flex items-center gap-2'>
				<Icons.triangleAlert className='size-4 text-warning' />
				<p className='text-sm'>Vare ikke fundet.</p>
			</div>
		)

	return (
		<div className='border shadow-sm py-2 px-3 rounded-lg'>
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
						{product.isBarred && <Badge variant='destructive'>Spærret</Badge>}
					</div>
					<Separator />
					<div className='flex items-baseline justify-between'>
						<span className='text-sm font-medium'>Varegruppe</span>
						<span className='text-sm text-muted-foreground truncate'>
							{product.group}
						</span>
					</div>
					<div className='flex items-baseline justify-between'>
						<span className='text-sm font-medium'>Enhed</span>
						<span className='text-sm text-muted-foreground'>
							{product.unit}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
