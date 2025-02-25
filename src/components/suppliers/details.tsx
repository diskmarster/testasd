"use client"

import { supplierContries, SupplierContry } from "@/data/suppliers.types"
import { Button } from "../ui/button"
import { useState, useTransition } from "react"
import { IfElse } from "../common/if-else"
import { Input } from "../ui/input"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Separator } from "../ui/separator"
import ReactCountryFlag from "react-country-flag"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { updateSupplierValidation } from "@/app/[lng]/(site)/administration/leverandorer/[id]/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Icons } from "../ui/icons"
import { updateSupplierAction } from "@/app/[lng]/(site)/administration/leverandorer/[id]/actions"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { Supplier } from "@/lib/database/schema/suppliers"
import { Skeleton } from "../ui/skeleton"

interface Props {
	supplier: Supplier
}

export function SupplierDetails({ supplier }: Props) {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, "leverandører")
	const [isEditing, setIsEditing] = useState(false)

	const { register, setValue, reset, formState, watch } = useForm<z.infer<typeof updateSupplierValidation>>({
		resolver: zodResolver(updateSupplierValidation),
		defaultValues: {
			id: supplier.id,
			data: {
				name: supplier.name,
				country: supplier.country,
				idOfClient: supplier.idOfClient,
				contactPerson: supplier.contactPerson,
				phone: supplier.phone,
				email: supplier.email
			}
		}
	})

	const formValues = watch()

	function onSubmit(values: z.infer<typeof updateSupplierValidation>) {
		startTransition(async () => {
			const res = await updateSupplierAction(values)

			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle, {
					description: t("details-page.details.toast-error")
				}))
				return
			}

			supplier.name = values.data.name
			supplier.country = values.data.country
			supplier.idOfClient = values.data.idOfClient || ""
			supplier.contactPerson = values.data.contactPerson || ""
			supplier.phone = values.data.phone || ""
			supplier.email = values.data.email

			toast.success(t(siteConfig.successTitle, {
				description: t("details-page.details.toast-success")
			}))
			setIsEditing(false)
		})
	}

	return (
		<div className="max-w-full lg:max-w-[50%] min-w-[36rem] space-y-4">
			<div className="flex items-center gap-4 justify-between">
				<h1 className="font-medium">{t("details-page.details.title")}</h1>
				<IfElse
					condition={isEditing}
					trueComp={
						<div className="flex gap-2">
							<Button size="sm" onClick={() => {
								reset()
								setIsEditing(false)
							}} variant='outline'>{t("details-page.details.btn-cancel")}</Button>
							<Button
								disabled={pending || !formState.isDirty}
								onClick={() => onSubmit(formValues)}
								size="sm"
								variant='default'
								className="flex items-center gap-2">
								{pending && (
									<Icons.spinner className="size-4 animate-spin" />
								)}
								{t("details-page.details.btn-confirm")}
							</Button>
						</div>
					}
					falseComp={
						<Button size="sm" onClick={() => setIsEditing(true)} variant='outline'>{t("details-page.details.btn-edit")}</Button>
					}
				/>
			</div>
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<div className="w-1/4">
						<span className="text-sm text-muted-foreground">{t("details-page.details.label-country")}</span>
						<IfElse
							condition={isEditing}
							falseComp={
								<div className="flex items-center gap-1.5 w-full h-9">
									<ReactCountryFlag
										className='!size-4 rounded-md'
										countryCode={supplier.country}
										svg
									/>
									{supplier.country}
								</div>

							}
							trueComp={
								<Select
									name="country"
									defaultValue={formValues.data.country}
									onValueChange={(val: SupplierContry) => setValue('data.country', val, { shouldValidate: true, shouldDirty: true })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{supplierContries.map((c, i) => (
											<SelectItem
												value={c} key={`${c}-${i}`}>
												<div className="flex items-center gap-1.5">
													<ReactCountryFlag
														className='!size-4 rounded-md'
														countryCode={c}
														svg
													/>
													{c}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							}
						/>
					</div>
					<div className="w-full">
						<span className="text-sm text-muted-foreground">{t("details-page.details.label-name")}</span>
						<IfElse
							condition={isEditing}
							falseComp={<p className="h-9 flex items-center">{supplier.name}</p>}
							trueComp={<Input {...register('data.name')} />}
						/>
					</div>
				</div>
				<div className="w-full space-y-1">
					<span className="text-sm text-muted-foreground">{t("details-page.details.label-id")}.</span>
					<IfElse
						condition={isEditing}
						falseComp={
							<p className={cn('h-9 flex items-center', !supplier.idOfClient && 'italic text-muted-foreground')}>{supplier.idOfClient || t("details-page.details.no-value")}</p>
						}
						trueComp={<Input {...register('data.idOfClient')} />}
					/>
				</div>
				<Separator className="!my-4" />
				<h2 className="font-medium">{t("details-page.details.contact-title")}</h2>
				<div className="w-full">
					<span className="text-sm text-muted-foreground">{t("details-page.details.label-contact")}</span>
					<IfElse
						condition={isEditing}
						falseComp={
							<p className={cn('h-9 flex items-center', !supplier.contactPerson && 'italic text-muted-foreground')}>{supplier.contactPerson || t("details-page.details.no-value")}</p>
						}
						trueComp={<Input {...register('data.contactPerson')} />}
					/>
				</div>
				<div className="flex gap-2">
					<div className="w-full">
						<span className="text-sm text-muted-foreground">{t("details-page.details.label-phone")}</span>
						<IfElse
							condition={isEditing}
							falseComp={
								<p className={cn('h-9 flex items-center', !supplier.phone && 'italic text-muted-foreground')}>{supplier.phone || t("details-page.details.no-value")}</p>
							}
							trueComp={<Input {...register('data.phone')} />}
						/>
					</div>
					<div className="w-full">
						<span className="text-sm text-muted-foreground">{t("details-page.details.label-email")}</span>
						<IfElse
							condition={isEditing}
							falseComp={
								<p className={cn('h-9 flex items-center', !supplier.email && 'italic text-muted-foreground')}>{supplier.email || t("details-page.details.no-value")}</p>
							}
							trueComp={<Input {...register('data.email')} />}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

export function SupplierDetailsSkeleton() {
	return (
		<div className="max-w-full lg:max-w-[50%] min-w-[36rem] space-y-4">
			<div className="flex items-center gap-4 justify-between">
				<Skeleton className="h-8 w-36" />
				<Skeleton className="h-8 w-20" />
			</div>
			<div className="flex gap-2 items-center">
				<div className="w-1/4 space-y-1">
					<Skeleton className="h-3 w-8" />
					<Skeleton className="h-9 w-11" />
				</div>
				<div className="w-full space-y-1">
					<Skeleton className="h-3 w-8" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>
			<div className="w-full space-y-1">
				<Skeleton className="h-3 w-8" />
				<Skeleton className="h-9 w-24" />
			</div>
			<Separator />
			<Skeleton className="h-6 w-24" />
			<div className="w-full space-y-1">
				<Skeleton className="h-3 w-8" />
				<Skeleton className="h-9 w-24" />
			</div>
			<div className="flex gap-2 items-center">
				<div className="w-1/2 space-y-1">
					<Skeleton className="h-3 w-8" />
					<Skeleton className="h-9 w-16" />
				</div>
				<div className="w-1/2 space-y-1">
					<Skeleton className="h-3 w-8" />
					<Skeleton className="h-9 w-16" />
				</div>
			</div>
		</div>
	)
}
