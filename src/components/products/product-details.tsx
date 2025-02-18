"use client"

import { FormattedProduct } from "@/data/products.types"
import { Group, Inventory, Unit } from "@/lib/database/schema/inventory"
import { Badge } from "../ui/badge"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { hasPermissionByRank } from "@/data/user.types"
import { numberToDKCurrency } from "@/lib/utils"
import { useEffect, useState, useTransition } from "react"
import { User } from "lucia"
import { updateProductValidation } from "@/app/[lng]/(site)/varer/produkter/[id]/validation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { IfElse } from "../common/if-else"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { fetchActiveGroupsAction, fetchActiveUnitsAction } from "@/app/[lng]/(site)/varer/produkter/[id]/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { updateProductAction } from "@/app/[lng]/(site)/varer/produkter/actions"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { Icons } from "../ui/icons"
import { Skeleton } from "../ui/skeleton"

interface Props {
	product: FormattedProduct & { inventories: Inventory[] }
	user: User
}

export function ProductDetails({ product, user }: Props) {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')
	const [isEditing, setIsEditing] = useState(false)
	const schema = updateProductValidation(t)
	const [units, setUnits] = useState<Unit[]>([])
	const [groups, setGroups] = useState<Group[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)

	const { setValue, watch, reset, register, formState } = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			productID: product.id,
			data: { ...product }
		}
	})

	const formValues = watch()

	async function onSubmit(values: z.infer<typeof schema>) {
		setIsSubmitting(true)
		startTransition(async () => {
			const res = await updateProductAction({
				productID: product.id,
				data: values.data,
			})

			if (res && res.serverError) {
				toast.success(t(`common:${siteConfig.successTitle}`), {
					description: res.serverError
				})
				setIsSubmitting(false)
				return
			}

			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: t('toasts.product-updated'),
			})
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

	useEffect(() => {
		if (isEditing && units.length === 0) {
			fetchUnits()
		}
		if (isEditing && groups.length === 0) {
			fetchGroups()
		}
	}, [isEditing])

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
								onChange={event => setValue("data.text1", event.target.value, { shouldValidate: true, shouldDirty: true })}
							/>
						</div>
					}
					falseComp={
						<div className='flex items-start gap-3 flex-1'>
							<p className='md:max-w-[90%]'>{product.text1}</p>
							{product.isBarred && <Badge variant='red'>{t('details-page.details.label-barred')}</Badge>}
						</div>
					}
				/>
				<IfElse
					condition={isEditing}
					trueComp={
						<div className="flex gap-2">
							<Button onClick={() => {
								reset()
								setIsEditing(false)
							}}
								variant='outline'>{t("details-page.details.button-cancel")}</Button>
							<Button
								disabled={pending || !formState.isDirty}
								onClick={() => onSubmit(formValues)}
								variant='default'
								className="flex items-center gap-2">
								{isSubmitting && (
									<Icons.spinner className="size-4 animate-spin" />
								)}
								{t("details-page.details.button-update")}
							</Button>
						</div>
					}
					falseComp={
						<Button onClick={() => setIsEditing(true)} variant='outline'>{t("details-page.details.button-edit")}</Button>
					}
				/>
			</div>

			<div className='space-y-2'>
				<div className="space-y-1">
					<span className='text-sm text-muted-foreground'>{t('details-page.details.label-text2')}</span>
					<IfElse
						condition={isEditing}
						trueComp={
							<Input
								type="text"
								className="h-9 w-1/3"
								value={formValues.data.text2}
								onChange={event => setValue("data.text2", event.target.value, { shouldValidate: true, shouldDirty: true })}
							/>
						}
						falseComp={
							<p className="h-9 flex items-center">{product.text2 != '' ? product.text2 : t('details-page.details.no-value')}</p>
						}
					/>
				</div>
				<div className="space-y-1">
					<span className='text-sm text-muted-foreground'>{t('details-page.details.label-text3')}</span>
					<IfElse
						condition={isEditing}
						trueComp={
							<Textarea
								maxLength={1000}
								className="h-[5rem] line-clamp-5"
								value={formValues.data.text3}
								onChange={event => setValue("data.text3", event.target.value, { shouldValidate: true, shouldDirty: true })}
							></Textarea>
						}
						falseComp={
							<p className="line-clamp-5 h-[5rem] pt-1.5">{product.text3 != '' ? product.text3 : t('details-page.details.no-value')}</p>
						}
					/>
				</div>
				<Separator className='!my-4' />
				<div className='flex items-center gap-4'>
					<div className='w-1/2'>
						<span className='text-sm text-muted-foreground'>
							{t('details-page.details.label-group')}
						</span>
						<IfElse
							condition={isEditing}
							trueComp={
								<Select
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
							falseComp={
								<p className="h-9 flex items-center">{product.group}</p>
							}
						/>
					</div>
					<div className='w-1/2'>
						<span className='text-sm text-muted-foreground'>{t('details-page.details.label-unit')}</span>
						<IfElse
							condition={isEditing}
							trueComp={
								<Select
									value={formValues.data.unitID.toString()}
									onValueChange={(value: string) =>
										setValue('data.unitID', parseInt(value), {
											shouldValidate: true,
											shouldDirty: true,
										})
									}>
									<SelectTrigger>
										<SelectValue placeholder={t('unit-placeholder')} />
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
							falseComp={
								<p className="h-9 flex items-center">{product.unit}</p>
							}
						/>
					</div>
				</div>
				<div className='flex items-center gap-4'>
					<div className='w-1/2'>
						<span className='text-sm text-muted-foreground'>{t('details-page.details.label-sku')}</span>
						<IfElse
							condition={isEditing}
							trueComp={
								<Input
									type="text"
									className="h-9"
									value={formValues.data.sku}
									onChange={event => setValue("data.sku", event.target.value, { shouldValidate: true, shouldDirty: true })}
								/>
							}
							falseComp={
								<p className="h-9 flex items-center">{product.sku}</p>
							}
						/>
					</div>
					<div className='w-1/2'>
						<span className='text-sm text-muted-foreground'>{t('details-page.details.label-barcode')}</span>
						<IfElse
							condition={isEditing}
							trueComp={
								<Input
									type="text"
									className="h-9"
									value={formValues.data.barcode}
									onChange={event => setValue("data.barcode", event.target.value, { shouldValidate: true, shouldDirty: true })}
								/>
							}
							falseComp={
								<p className="h-9 flex items-center">{product.barcode}</p>
							}
						/>
					</div>
				</div>
				{hasPermissionByRank(user.role, 'bruger') && user.priceAccess && (
					<div className='flex items-center gap-4'>
						<div className='w-1/2'>
							<span className='text-sm text-muted-foreground'>{t('details-page.details.label-costPrice')}</span>
							<IfElse
								condition={isEditing}
								trueComp={
									<Input
										step={0.01}
										min={0}
										required
										id='costPrice'
										type='number'
										className="h-9"
										{...register('data.costPrice')}
									/>
								}
								falseComp={
									<p className="h-9 flex items-center">{numberToDKCurrency(product.costPrice)}</p>
								}
							/>
						</div>
						<div className='w-1/2'>
							<span className='text-sm text-muted-foreground'>{t('details-page.details.label-salesPrice')}</span>
							<IfElse
								condition={isEditing}
								trueComp={
									<Input
										step={0.01}
										min={0}
										required
										id='costPrice'
										type='number'
										className="h-9"
										{...register('data.salesPrice')}
									/>
								}
								falseComp={
									<p className="h-9 flex items-center">{numberToDKCurrency(product.salesPrice)}</p>
								}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}


export function DetailsSkeleton() {
	return (
		<div className="w-full lg:w-1/2 border rounded-md p-4 space-y-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-9 w-1/3" />
				<Skeleton className="h-9 w-[85px]" />
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-9 w-1/3" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-[4rem] w-full" />
				</div>
			</div>
			<div className="flex gap-4">
				<div className="flex flex-col gap-2 w-full">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="flex flex-col gap-2 w-full">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-9 w-full" />
				</div>
			</div>
			<div className="flex gap-4">
				<div className="flex flex-col gap-2 w-full">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="flex flex-col gap-2 w-full">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-9 w-full" />
				</div>
			</div>
		</div>
	)
}
