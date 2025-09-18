'use client'

import {
	BulkError,
	bulkOutgoingAction,
	fetchPlacementInventories,
} from '@/app/[lng]/(site)/oversigt/actions'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { FormattedInventory } from '@/data/inventory.types'
import { Placement, PlacementID } from '@/lib/database/schema/inventory'
import { cn, numberFormatter } from '@/lib/utils'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
	DialogContentV2,
	DialogDescriptionV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'

interface Props {
	placements: Placement[]
	useBatch: boolean
	useReference: boolean
}

export function ModalBulkOutgoing({
	placements,
	useBatch,
	useReference,
}: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'oversigt', { keyPrefix: 'bulk' })

	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [selectedPlacement, setSelectedPlacement] = useState<Placement>()
	const [isFetching, setIsFetching] = useState(false)
	const [inventories, setInventories] = useState<FormattedInventory[]>([])
	const [reference, setReference] = useState<string>()
	const [bulkErrors, setBulkErrors] = useState<BulkError[]>([])

	function onOpenChange(open: boolean) {
		setOpen(open)
		setSelectedPlacement(undefined)
		setInventories([])
		setBulkErrors([])
	}

	async function fetchInventories(placementID: PlacementID) {
		setIsFetching(true)
		setInventories([])
		const response = await fetchPlacementInventories({ placementID })
		if (!response) {
			toast.error(t(`common:${siteConfig.errorTitle}`), {
				description: t('err-unknown'),
			})
			setIsFetching(false)
			return
		}
		if (response.serverError || response.validationErrors) {
			toast.error(t(`common:${siteConfig.errorTitle}`), {
				description:
					response.serverError ??
					response.validationErrors?._errors?.flatMap(v => v),
			})
			setIsFetching(false)
			return
		}
		if (response.data) {
			const nonnegativeInventories = response.data.inventories.filter(
				inv => inv.quantity > 0,
			)
			setInventories(nonnegativeInventories)
			setIsFetching(false)
			return
		}

		// this is the forbidden forest Harry, go back
		toast.error(t(`common:${siteConfig.errorTitle}`), {
			description: t('err-unknown'),
		})
		setIsFetching(false)
	}

	useEffect(() => {
		if (selectedPlacement) {
			fetchInventories(selectedPlacement.id)
		}
	}, [selectedPlacement])

	function submit() {
		startTransition(async () => {
			const response = await bulkOutgoingAction({
				reference: reference,
				items: inventories.map(inv => ({
					sku: inv.product.sku,
					productID: inv.product.id,
					placementID: inv.placement.id,
					batchID: inv.batch.id,
					quanity: inv.quantity,
				})),
			})

			if (!response) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('err-unknown'),
				})
				return
			}

			if (response.serverError || response.validationErrors) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description:
						response.serverError ??
						response.validationErrors?._errors?.flatMap(v => v),
				})
				return
			}

			if (response.data && !response.data.ok) {
				const data = response.data
				const failedInventories = inventories.filter(inv =>
					data.errors!.some(e => e.productID == inv.product.id),
				)
				setInventories(failedInventories)
				setBulkErrors(data.errors!)
				return
			}

			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: t('toast-success'),
			})
			onOpenChange(false)
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button size='icon' variant='outline' tooltip={'Bulk afgang'}>
					<Icons.list className='size-4' />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className='max-w-2xl'>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.list className='size-4 text-primary' />
						<DialogTitleV2>{t('title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className='space-y-4 px-3'>
					<DialogDescriptionV2 className='text-sm text-muted-foreground'>
						{t('desc')}
					</DialogDescriptionV2>
					<div className='flex flex-col gap-4'>
						<div className='flex items-center gap-2'>
							<div className='grid gap-1.5 w-full max-w-[50%]'>
								<Label>{t('placement-label')}</Label>
								<Select
									onValueChange={val => {
										const placement = placements.find(p => p.id == Number(val))
										setSelectedPlacement(placement!)
									}}>
									<SelectTrigger className='[&>span]:normal-case'>
										<SelectValue placeholder={t('placement-placeholder')} />
									</SelectTrigger>
									<SelectContent>
										{placements.map(p => (
											<SelectItem key={p.id} value={p.id.toString(10)}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{useReference && (
								<div className='grid gap-1.5 w-full'>
									<Label>{t('reference-label')}</Label>
									<Input
										value={reference}
										onChange={e => setReference(e.target.value)}
										placeholder={t('reference-placeholder')}
									/>
								</div>
							)}
						</div>
						<div className='space-y-2'>
							<p className='text-sm text-muted-foreground'>{t('body-sub')}</p>
							{inventories.length > 0 ? (
								<div className='space-y-1 relative border rounded-md shadow-sm bg-background'>
									<div
										className={cn(
											'grid px-3 gap-2 text-xs text-muted-foreground sticky top-0 bg-background py-2 font-medium border-b',
											useBatch
												? 'grid-cols-[1fr_1.5fr_1fr_1fr_0.5fr]'
												: 'grid-cols-[1fr_1.5fr_1fr_0.5fr]',
										)}>
										<p>{t('sku-label')}</p>
										<p>{t('text1-label')}</p>
										<p>{t('placement-label')}</p>
										{useBatch && <p>{t('batch-label')}</p>}
										<p>{t('qty-label')}</p>
									</div>
									<ScrollArea maxHeight='max-h-96'>
										<div className='divide-y'>
											{inventories.map(inv => {
												const err = bulkErrors.find(
													err => err.productID == inv.product.id,
												)
												return (
													<div
														className={cn(
															'grid px-3 gap-2 text-sm py-1.5',
															useBatch
																? 'grid-cols-[1fr_1.5fr_1fr_1fr_0.5fr]'
																: 'grid-cols-[1fr_1.5fr_1fr_0.5fr]',
															err && 'text-destructive',
														)}
														key={`${inv.customerID}-${inv.product.id}-${inv.placement.id}-${inv.batch.id}`}>
														<p>{inv.product.sku}</p>
														<p className='truncate'>
															{inv.product.text1.substring(0, 24)}
														</p>
														<p>{inv.placement.name}</p>
														{useBatch && <p>{inv.batch.batch}</p>}
														<p>{numberFormatter(lng).format(inv.quantity)}</p>
													</div>
												)
											})}
										</div>
									</ScrollArea>
								</div>
							) : isFetching ? (
								<div className='flex items-center gap-2 text-sm'>
									<p>{t('fetching-inventories')}</p>
									<Icons.spinner className='animate-spin size-4' />
								</div>
							) : (
								<p className='text-sm'>
									{selectedPlacement
										? t('no-inventories')
										: t('choose-to-see-inventories')}
								</p>
							)}
						</div>
					</div>

					{bulkErrors.length > 0 && (
						<div className='border relative rounded-md grid gap-1 px-3 py-2 bg-card shadow-sm'>
							<Button
								className='absolute top-1 right-2 hover:bg-card'
								size='icon'
								variant='ghost'
								onClick={() => setBulkErrors([])}>
								<Icons.cross className='size-4' />
							</Button>
							<span className='text-sm font-medium'>{t('errors-title')}</span>
							<div className='flex flex-col gap-0.5'>
								{bulkErrors.map((err, i) => (
									<div key={i} className='text-sm'>
										<span className='text-muted-foreground'>{err.message}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
				<DialogFooterV2>
					<Button
						disabled={pending}
						variant='outline'
						onClick={() => onOpenChange(false)}>
						{t('btn-close')}
					</Button>
					<Button
						disabled={pending}
						onClick={submit}
						className='flex items-center gap-2'>
						{pending && <Icons.spinner className='animate-spin size-4' />}
						{t('btn-confirm')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
