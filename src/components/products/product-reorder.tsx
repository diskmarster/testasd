"use client"

import { Reorder } from "@/lib/database/schema/inventory"
import { cn, updateChipCount } from "@/lib/utils"
import { User } from "lucia"
import { Button } from "../ui/button"
import { useState, useTransition } from "react"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Label } from "../ui/label"
import { IfElse } from "../common/if-else"
import { Input } from "../ui/input"
import { useForm } from "react-hook-form"
import { createReorderValidation } from "@/app/[lng]/(site)/genbestil/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createReorderAction, updateReorderAction } from "@/app/[lng]/(site)/genbestil/actions"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { Icons } from "../ui/icons"

interface Props {
	productID: number
	reorder: Reorder | undefined
	user: User
}

export function ProductReorder({ productID, reorder }: Props) {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')
	const [isEditing, setIsEditing] = useState(false)
	const schema = createReorderValidation(t)

	const { register, reset, handleSubmit } = useForm<
		z.infer<typeof schema>
	>({
		resolver: zodResolver(schema),
		defaultValues: {
			productID: productID,
			minimum: reorder?.minimum,
			orderAmount: reorder?.orderAmount,
			maxOrderAmount: reorder?.maxOrderAmount,
		},
	})

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			let action;
			if (reorder) {
				action = updateReorderAction
			} else {
				action = createReorderAction
			}

			const res = await action(values)

			if (res && res.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: res.serverError
				})
				return
			}

			if (res && res.validationErrors) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('modal-create-reorder.error-occured')
				})
				return
			}

			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: "Minimumsbeholdning oprettet"
			})
			updateChipCount()
			setIsEditing(false)
		})
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="lg:w-1/2 border rounded-md relative">
			<div className={cn(
				'z-50 hidden bg-foreground/30 w-full h-full absolute rounded-md place-items-center',
				(!reorder && !isEditing) && 'grid')}>
				<div className="flex flex-col gap-2.5 items-center bg-background rounded-md shadow-md">
					<div className="border-b py-2 flex items-center w-full">
						<p className="px-2 text-sm font-medium">
							{t("details-page.reorder.no-reorder-title")}
						</p>
					</div>
					<div className="px-2 flex flex-col gap-2 pb-2 max-w-96">
						<p className="text-sm">{t("details-page.reorder.no-reorder-description")}</p>
						<Button
							type="button"
							className="w-fit ml-auto"
							size='sm'
							onClick={() => setIsEditing(true)}>
							{t("details-page.reorder.btn-no-reorder")}
						</Button>
					</div>
				</div>
			</div>
			<div className={cn('p-4 flex flex-col gap-4 h-full', (!reorder && !isEditing) && 'blur-sm')}>
				<div className="flex items-start justify-between">
					<div>
						<p className="font-medium">{t('details-page.reorder.title')}</p>
						<p className="text-muted-foreground text-sm text-pretty">{t('details-page.reorder.description')}</p>
					</div>

					<div className="flex">
						<IfElse
							condition={isEditing}
							falseComp={
								<Button
									variant='outline'
									size='sm'
									className="flex items-center gap-2"
									onClick={() => setIsEditing(true)}>
									{t("details-page.reorder.btn-edit")}
								</Button>
							}
							trueComp={
								<div className="flex items-center gap-2">
									<Button
										size='sm'
										variant='outline'
										className="flex items-center gap-2"
										onClick={() => {
											reset()
											setIsEditing(false)
										}}>
										{t("details-page.reorder.btn-cancel")}
									</Button>
									<Button size='sm' className="flex items-center gap-2">
										{pending && <Icons.spinner className="animate-spin size-4" />}
										{t("details-page.reorder.btn-confirm", { context: (!!reorder).toString() })}
									</Button>
								</div>
							}
						/>
					</div>
				</div>
				<div className="space-y-0.5 w-full">
					<Label htmlFor="minimum">{t('details-page.reorder.label-minimum')}</Label>
					<IfElse
						condition={isEditing}
						falseComp={<div className="h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm">{reorder?.minimum}</div>}
						trueComp={
							<Input
								id="minimum"
								{...register('minimum' as const)}
							/>
						}
					/>
				</div>
				<div className="space-y-0.5 w-full">
					<Label htmlFor="orderAmount">{t('details-page.reorder.label-orderAmount')}</Label>
					<p className='text-sm text-muted-foreground'>
						{t('details-page.reorder.orderAmount-description')}
					</p>
					<IfElse
						condition={isEditing}
						falseComp={<div className="h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm">{reorder?.orderAmount}</div>}
						trueComp={
							<Input
								id="orderAmount"
								{...register('orderAmount' as const)}
							/>
						}
					/>
				</div>
				<div className="space-y-0.5 w-full">
					<Label htmlFor="maxOrderAmount">{t('details-page.reorder.label-maxOrderAmount')}</Label>
					<p className='text-sm text-muted-foreground -mt-1.5'>
						{t('details-page.reorder.maxAmount-description')}
					</p>
					<IfElse
						condition={isEditing}
						falseComp={<div className="h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm">{reorder?.maxOrderAmount}</div>}
						trueComp={
							<Input
								id="maxOrderAmount"
								{...register('maxOrderAmount' as const)}
							/>
						}
					/>
				</div>
			</div>
		</form>
	)
}
