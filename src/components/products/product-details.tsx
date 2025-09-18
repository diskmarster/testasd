'use client'

import {
	fetchActiveGroupsAction,
	fetchActiveUnitsAction,
	fetchSuppliersAction,
} from '@/app/[lng]/(site)/varer/produkter/[id]/actions'
import { updateProductValidation } from '@/app/[lng]/(site)/varer/produkter/[id]/validation'
import { updateProductAction } from '@/app/[lng]/(site)/varer/produkter/actions'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { FormattedProduct } from '@/data/products.types'
import { hasPermissionByPlan, hasPermissionByRank } from '@/data/user.types'
import { useScroll } from '@/hooks/use-scroll'
import { Customer } from '@/lib/database/schema/customer'
import { CustomerIntegrationSettings } from '@/lib/database/schema/integrations'
import { Group, Inventory, Unit } from '@/lib/database/schema/inventory'
import { Supplier } from '@/lib/database/schema/suppliers'
import { cn, formatDate, numberToCurrency } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { TFunction } from 'i18next'
import { User } from 'lucia'
import { useEffect, useState, useTransition } from 'react'
import { emitCustomEvent } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { IfElse } from '../common/if-else'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog'
import { Badge } from '../ui/badge'
import { Button, buttonVariants } from '../ui/button'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { Skeleton } from '../ui/skeleton'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'

interface Props {
	product: FormattedProduct & { inventories: Inventory[] }
	user: User
	customer: Customer
	integrationSettings: CustomerIntegrationSettings | undefined
}

export function ProductDetails({
	product,
	user,
	customer,
	integrationSettings,
}: Props) {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')
	const [isEditing, setIsEditing] = useState(false)
	const schema = updateProductValidation(t)
	const today = new Date()
	const [units, setUnits] = useState<Unit[]>([
		{
			id: product.unitID,
			name: product.unit,
			inserted: today,
			updated: today,
			isBarred: false,
		},
	])
	const [groups, setGroups] = useState<Group[]>([
		{
			id: product.groupID,
			name: product.group,
			inserted: today,
			updated: today,
			isBarred: false,
			customerID: user.customerID,
		},
	])
	const [suppliers, setSuppliers] = useState<Supplier[]>([
		{
			id: product.supplierID ?? -1,
			name: product.supplierName ?? '',
			idOfClient: '',
			contactPerson: '',
			country: 'DK',
			email: '',
			phone: '',
			inserted: today,
			updated: today,
			customerID: 0,
			userID: 0,
			userName: '',
		},
	])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { y: scrollY } = useScroll()

	const [dialogOpen, setDialogOpen] = useState(false)
	const [dialogOnAccept, setDialogOnAccept] = useState(() => () => {})
	const [dialogOnDismiss, setDialogOnDismiss] = useState(() => () => {})

	const { setValue, watch, reset, register, formState } = useForm<
		z.infer<typeof schema>
	>({
		resolver: zodResolver(schema),
		defaultValues: {
			productID: product.id,
			data: { ...product },
		},
	})

	const formValues = watch()

	function onDialogOpenChange(open: boolean) {
		setDialogOpen(open)
		if (!open) {
			setDialogOnAccept(() => () => {})
			setDialogOnDismiss(() => () => {})
		}
	}

	function onSubmit(values: z.infer<typeof schema>) {
		if (formState.dirtyFields.data?.useBatch == true && !values.data.useBatch) {
			setDialogOpen(true)
			setDialogOnAccept(() => () => submitValues(values))
			setDialogOnDismiss(() => () => {
				setValue('data.useBatch', true, {
					shouldDirty: true,
					shouldValidate: true,
				})
				setDialogOpen(false)
			})
		} else {
			submitValues(values)
		}
	}

	function submitValues(values: z.infer<typeof schema>) {
		setIsSubmitting(true)
		startTransition(async () => {
			const res = await updateProductAction({
				productID: product.id,
				data: values.data,
				dirtyFields: formState.dirtyFields.data,
			})

			if (res && res.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: res.serverError,
				})
				setIsSubmitting(false)
				return
			}

			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: t('toasts.product-updated'),
			})

			product.text1 = values.data.text1
			product.text2 = values.data.text2
			product.text3 = values.data.text3
			product.note = values.data.note
			product.groupID = values.data.groupID
			product.group =
				groups.find(g => g.id == values.data.groupID)?.name ?? product.group
			product.unitID = values.data.unitID
			product.unit =
				units.find(u => u.id == values.data.unitID)?.name ?? product.unit
			product.sku = values.data.sku
			product.barcode = values.data.barcode
			product.costPrice = values.data.costPrice
			product.salesPrice = values.data.salesPrice
			product.supplierID = values.data.supplierID
			product.supplierName =
				suppliers.find(s => s.id == values.data.supplierID)?.name ?? 'Ingen'
			product.useBatch = values.data.useBatch

			reset(values)
			emitCustomEvent('FetchNewHistory', { id: values.productID })

			setDialogOpen(false)
			setIsSubmitting(false)
			setIsEditing(false)
		})
	}

	function fetchUnits() {
		startTransition(async () => {
			const res = await fetchActiveUnitsAction()

			if (res && res.data) {
				setUnits(res.data)
			}
		})
	}

	function fetchGroups() {
		startTransition(async () => {
			const res = await fetchActiveGroupsAction()

			if (res && res.data) {
				setGroups(res.data)
			}
		})
	}

	function fetchSuppliers() {
		startTransition(async () => {
			const res = await fetchSuppliersAction()

			if (res && res.data) {
				setSuppliers(res.data)
			}
		})
	}

	useEffect(() => {
		if (isEditing && units.length === 1) {
			fetchUnits()
		}
		if (isEditing && groups.length === 1) {
			fetchGroups()
		}
		if (isEditing && suppliers.length === 1) {
			fetchSuppliers()
		}
	}, [isEditing])

	return (
		<div className='w-full space-y-4'>
			{isEditing && (
				<DisableBatchDialog
					open={dialogOpen}
					onOpenChange={onDialogOpenChange}
					onDismiss={dialogOnDismiss}
					onAccept={dialogOnAccept}
					t={t}
				/>
			)}
			<div
				className={cn(
					'rounded bg-background flex items-center transition-all justify-between sticky top-[70px] py-4 -mt-4',
					scrollY > 20 &&
						'mx-2 shadow-[0px_8px_5px_-3px_rgba(0,0,0,0.15)] border p-4 z-10',
				)}>
				<div className='space-y-0.5'>
					<div className='flex items-start gap-3 flex-1'>
						<h1 className='text-xl font-medium'>{product.text1}</h1>
						{product.isBarred && (
							<Badge variant='red'>
								{t('details-page.details.label-barred')}
							</Badge>
						)}
					</div>
					<p className='text-muted-foreground'>
						{t('details-page.details.last-updated')}
						{formatDate(product.updated)}
					</p>
				</div>
				{hasPermissionByRank(user.role, 'bruger') && (
					<IfElse
						condition={isEditing}
						trueComp={
							<div className='flex gap-2'>
								<Button
									onClick={() => {
										reset()
										setIsEditing(false)
									}}
									variant='outline'>
									{t('details-page.details.button-cancel')}
								</Button>
								<Button
									disabled={pending || !formState.isDirty}
									onClick={() => onSubmit(formValues)}
									variant='default'
									className='flex items-center gap-2'>
									{isSubmitting && (
										<Icons.spinner className='size-4 animate-spin' />
									)}
									{t('details-page.details.button-update')}
								</Button>
							</div>
						}
						falseComp={
							<Button onClick={() => setIsEditing(true)} variant='outline'>
								{t('details-page.details.button-edit')}
							</Button>
						}
					/>
				)}
			</div>
			<div className='grid grid-cols-2 gap-4 w-full border rounded-md p-4'>
				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label htmlFor='text1'>{t('details-page.details.label-text1')}</Label>
					<IfElse
						condition={isEditing && !integrationSettings?.useSyncProducts}
						falseComp={
							<div className='min-h-[60px] h-full px-3 py-2 flex items-start border rounded-md bg-muted/50 text-sm'>
								{product.text1}
							</div>
						}
						trueComp={
							<Textarea
								className='resize-none'
								id='text1'
								name='text1'
								maxLength={255}
								rows={3}
								value={formValues.data.text1}
								onChange={event =>
									setValue('data.text1', event.target.value, {
										shouldValidate: true,
										shouldDirty: true,
									})
								}
							/>
						}
					/>
				</div>
				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label htmlFor='text2'>{t('details-page.details.label-text2')}</Label>
					<IfElse
						condition={isEditing && !integrationSettings?.useSyncProducts}
						falseComp={
							<div className='min-h-[60px] px-3 py-2 flex items-start border rounded-md bg-muted/50 text-sm'>
								{product.text2}
							</div>
						}
						trueComp={
							<Textarea
								className='resize-none'
								id='text2'
								name='text2'
								maxLength={255}
								rows={3}
								value={formValues.data.text2}
								onChange={event =>
									setValue('data.text2', event.target.value, {
										shouldValidate: true,
										shouldDirty: true,
									})
								}
							/>
						}
					/>
				</div>

				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label htmlFor='text3'>{t('details-page.details.label-text3')}</Label>
					<IfElse
						condition={isEditing && !integrationSettings?.useSyncProducts}
						falseComp={
							<div className='py-2 px-3 border rounded-md bg-muted/50 min-h-[120px] whitespace-pre-wrap text-sm'>
								{product.text3 != ''
									? product.text3
									: t('details-page.details.no-value')}
							</div>
						}
						trueComp={
							<Textarea
								className='resize-none'
								id='text3'
								name='text3'
								maxLength={1000}
								rows={5}
								value={formValues.data.text3}
								onChange={event =>
									setValue('data.text3', event.target.value, {
										shouldValidate: true,
										shouldDirty: true,
									})
								}
							/>
						}
					/>
				</div>
				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label htmlFor='note'>{t('details-page.details.label-note')}</Label>
					<IfElse
						condition={isEditing && !integrationSettings?.useSyncProducts}
						falseComp={
							<div className='py-2 px-3 border rounded-md bg-muted/50 min-h-[120px] whitespace-pre-wrap text-sm'>
								{product.note != ''
									? product.note
									: t('details-page.details.no-value')}
							</div>
						}
						trueComp={
							<Textarea
								className='resize-none'
								id='note'
								name='note'
								maxLength={1000}
								rows={5}
								value={formValues.data.note}
								onChange={event =>
									setValue('data.note', event.target.value, {
										shouldValidate: true,
										shouldDirty: true,
									})
								}
							/>
						}
					/>
				</div>

				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label htmlFor='group'>{t('details-page.details.label-group')}</Label>
					<IfElse
						condition={isEditing && !integrationSettings?.useSyncProducts}
						falseComp={
							<div className='h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm'>
								{product.group}
							</div>
						}
						trueComp={
							<Select
								disabled={pending}
								value={formValues.data.groupID.toString()}
								onValueChange={(value: string) =>
									setValue('data.groupID', parseInt(value), {
										shouldValidate: true,
										shouldDirty: true,
									})
								}>
								<SelectTrigger>
									<SelectValue placeholder={t('product-group-placeholder')} />
								</SelectTrigger>
								<SelectContent>
									{groups.map(group => (
										<SelectItem key={group.id} value={group.id.toString()}>
											{group.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						}
					/>
				</div>
				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label htmlFor='unit'>{t('details-page.details.label-unit')}</Label>
					<IfElse
						condition={isEditing && !integrationSettings?.useSyncProducts}
						falseComp={
							<div className='h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm'>
								{product.unit}
							</div>
						}
						trueComp={
							<Select
								disabled={pending}
								value={formValues.data.unitID.toString()}
								onValueChange={(value: string) =>
									setValue('data.unitID', parseInt(value), {
										shouldValidate: true,
										shouldDirty: true,
									})
								}>
								<SelectTrigger>
									<SelectValue
										defaultValue={product.unitID}
										placeholder={t('unit-placeholder')}
									/>
								</SelectTrigger>
								<SelectContent>
									{units.map(unit => (
										<SelectItem key={unit.id} value={unit.id.toString()}>
											{unit.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						}
					/>
				</div>

				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label htmlFor='sku'>{t('details-page.details.label-sku')}</Label>
					<div
						className={cn(
							'h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm',
							isEditing && 'cursor-not-allowed',
						)}>
						{product.sku}
					</div>
				</div>
				<div className='space-y-0.5 w-full'>
					<Label htmlFor='barcode'>
						{t('details-page.details.label-barcode')}
					</Label>
					<IfElse
						condition={isEditing && !integrationSettings?.useSyncProducts}
						falseComp={
							<div className='h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm'>
								{product.barcode}
							</div>
						}
						trueComp={
							<Input
								id='barcode'
								name='barcode'
								className='h-9'
								type='text'
								value={formValues.data.barcode}
								onChange={event =>
									setValue('data.barcode', event.target.value, {
										shouldValidate: true,
										shouldDirty: true,
									})
								}
							/>
						}
					/>
				</div>

				{hasPermissionByRank(user.role, 'bruger') && user.priceAccess && (
					<>
						<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
							<Label htmlFor='costPrice'>
								{t('details-page.details.label-costPrice')}
							</Label>
							<IfElse
								condition={isEditing && !integrationSettings?.useSyncProducts}
								falseComp={
									<div className='h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm'>
										{numberToCurrency(product.costPrice, lng)}
									</div>
								}
								trueComp={
									<Input
										id='costPrice'
										type='text'
										step={0.01}
										min={0}
										className='h-9'
										{...register('data.costPrice')}
									/>
								}
							/>
						</div>
						<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
							<Label htmlFor='salesPrice'>
								{t('details-page.details.label-salesPrice')}
							</Label>
							<IfElse
								condition={isEditing && !integrationSettings?.useSyncProducts}
								falseComp={
									<div className='h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm'>
										{numberToCurrency(product.salesPrice, lng)}
									</div>
								}
								trueComp={
									<Input
										id='salesPrice'
										className='h-9'
										step={0.01}
										min={0}
										type='text'
										{...register('data.salesPrice')}
									/>
								}
							/>
						</div>
					</>
				)}

				<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
					<Label>{t('details-page.details.label-supplier')}</Label>
					<IfElse
						condition={isEditing}
						falseComp={
							<div className='h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm'>
								{product.supplierName ?? 'Ingen'}
							</div>
						}
						trueComp={
							<Select
								disabled={pending}
								value={
									formValues.data.supplierID
										? formValues.data.supplierID.toString()
										: '-1'
								}
								onValueChange={(value: string) => {
									setValue('data.supplierID', parseInt(value), {
										shouldValidate: true,
										shouldDirty: true,
									})
								}}>
								<SelectTrigger>
									<SelectValue
										defaultValue={product.supplierID ?? undefined}
										placeholder={t('unit-placeholder')}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='-1'>Ingen</SelectItem>
									{suppliers.map(unit => (
										<SelectItem key={unit.id} value={unit.id.toString()}>
											{unit.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						}
					/>
				</div>
				{hasPermissionByPlan(customer.plan, 'pro') && (
					<div className='grid grid-rows-[20px_1fr] space-y-0.5 w-full'>
						<Label htmlFor='use-batch'>
							{t('details-page.details.label-use-batch')}
						</Label>
						<div className='h-9 grid w-full items-center'>
							<Switch
								id='use-batch'
								disabled={!isEditing}
								checked={formValues.data.useBatch}
								onCheckedChange={v =>
									setValue('data.useBatch', v, {
										shouldValidate: true,
										shouldDirty: true,
									})
								}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

function DisableBatchDialog({
	open,
	onOpenChange,
	onAccept,
	onDismiss,
	t,
}: {
	open: boolean
	onOpenChange: (v: boolean) => void
	onAccept: () => void
	onDismiss: () => void
	t: TFunction<'produkter'>
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('details-page.details.disable-batch-dialog.title')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t('details-page.details.disable-batch-dialog.description')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onDismiss}>
						{t('details-page.details.disable-batch-dialog.cancel')}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onAccept}
						className={buttonVariants({ variant: 'destructive' })}>
						{t('details-page.details.disable-batch-dialog.action')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export function DetailsSkeleton() {
	return (
		<div className='w-full lg:w-1/2 border rounded-md p-4 space-y-4'>
			<div className='flex items-center justify-between'>
				<Skeleton className='h-9 w-1/3' />
				<Skeleton className='h-9 w-[85px]' />
			</div>
			<div className='space-y-4'>
				<div className='space-y-2'>
					<Skeleton className='h-4 w-1/4' />
					<Skeleton className='h-9 w-1/3' />
				</div>
				<div className='space-y-2'>
					<Skeleton className='h-4 w-1/4' />
					<Skeleton className='h-[4rem] w-full' />
				</div>
			</div>
			<div className='flex gap-4'>
				<div className='flex flex-col gap-2 w-full'>
					<Skeleton className='h-4 w-1/4' />
					<Skeleton className='h-9 w-full' />
				</div>
				<div className='flex flex-col gap-2 w-full'>
					<Skeleton className='h-4 w-1/4' />
					<Skeleton className='h-9 w-full' />
				</div>
			</div>
			<div className='flex gap-4'>
				<div className='flex flex-col gap-2 w-full'>
					<Skeleton className='h-4 w-1/4' />
					<Skeleton className='h-9 w-full' />
				</div>
				<div className='flex flex-col gap-2 w-full'>
					<Skeleton className='h-4 w-1/4' />
					<Skeleton className='h-9 w-full' />
				</div>
			</div>
		</div>
	)
}
