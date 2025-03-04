"use client"

import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"
import { useState, useTransition } from "react"
import { useCustomEventListener } from "react-custom-events"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogV2 } from "../ui/dialog-v2"
import { deleteSupplierAction } from "@/app/[lng]/(site)/administration/leverandorer/actions"
import { siteConfig } from "@/config/site"

export function DeleteSupplierModal() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'leverandører')

	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [id, setID] = useState<number>()
	const [itemCount, setItemCount] = useState<number>(0)

	function onOpenChange(open: boolean) {
		setOpen(open)
		setID(undefined)
	}

	useCustomEventListener("DeleteSupplierByID", (data: { id: number, itemCount: number }) => {
		setID(data.id)
		setItemCount(data.itemCount)
		setOpen(true)
	})

	function deleteFile() {
		if (!id) return
		startTransition(async () => {
			const res = await deleteSupplierAction({ id: id })
			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle), { description: t("delete.toast-error") })
				return
			}
			onOpenChange(false)
			toast.success(t(siteConfig.successTitle), { description: t("delete.toast-success") })
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogContentV2 className="max-w-md">
				<DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.trash className="size-4 text-destructive" />
						<DialogTitleV2 className="text-sm">{t('delete.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className="px-3 space-y-4">
					<p className="text-sm text-muted-foreground">{t("delete.description")}</p>
					{itemCount > 0 && (
						<p className="text-sm text-destructive">{t("delete.item-over-zero", { count: itemCount })}</p>
					)}
				</div>
				<DialogFooterV2>
					<Button
						onClick={() => onOpenChange(false)}
						size='sm'
						variant='outline'>
						{t("delete.btn-close")}
					</Button>
					<Button
						size='sm'
						form="create-form"
						type="submit"
						className="flex items-center gap-2"
						onClick={() => deleteFile()}
						variant='destructive'>
						{pending && (
							<Icons.spinner className="size-3.5 animate-spin" />
						)}
						{t("delete.btn-delete")}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
