'use client'

import { Placement, ProductID } from "@/lib/database/schema/inventory"
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogV2 } from "../ui/dialog-v2"
import { useState, useTransition } from "react"
import { emitCustomEvent, useCustomEventListener } from "react-custom-events"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import { upsertDefaultPlacement } from "@/app/[lng]/(site)/varer/produkter/[id]/actions"
import { toast } from "sonner"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"

interface Props {
	productID: ProductID
}

export function UpdateDefaultPlacementModal({
	productID
}: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter', {keyPrefix: 'details-page.inventory.default-placement-dialog'})
	const [open, setOpen] = useState(false)
	const [newPlacement, setNewPlacement] = useState<Placement>()
	const [pending, startTransition] = useTransition()

	useCustomEventListener('UpdateDefaultPlacement', (data: Placement) => {
		setNewPlacement(data)
		setOpen(true)
	})

	const onOpenChange = (open: boolean) => {
		setOpen(open)
		if (!open) {
			setNewPlacement(undefined)
		}
	}

	const submit = () => {
		if (newPlacement != undefined) {
			startTransition(async () => {
				const res = await upsertDefaultPlacement({
					productID,
					placementID: newPlacement.id,
					locationID: newPlacement.locationID,
				})

				if (res && res.serverError) {
					console.error(res.serverError)
					toast.error(t('toasts.default-placement-not-updated'))
				} else if (res && res.validationErrors) {
					console.error(res.validationErrors)
					toast.error(t('toasts.default-placement-not-updated'))
				} else if (res) {
					toast.success(t('toasts.default-placement-updated'))
					emitCustomEvent(`DefaultPlacementUpdated-${newPlacement.locationID}`, {placementID: newPlacement.id})
					setOpen(false)
				}
			})
		} else {
			toast.error("MISSING PLACEMENT DATA!!!")
		}
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogContentV2>
				<DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.pencil className="size-4" />
						<DialogTitleV2>{t('title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<section className="px-4 tracking-tight tabular-nums space-y-3">
					<p>{t('about-to-update')} <span className="tracking-tighter font-semibold">{newPlacement?.name}</span>. {t('update-will-move-inventories')} <span className="tracking-tighter font-semibold">{newPlacement?.name}</span>.</p>
					<p>{t('continue')}</p>
				</section>
				<DialogFooterV2>
					<Button
						onClick={() => setOpen(false)}
						size='sm'
						variant='outline'>
						{t('no')}
					</Button>
					<Button
						size='sm'
						className="flex items-center gap-2"
						onClick={submit}
						variant='default'>
						{pending && (
							<Icons.spinner className="size-3.5 animate-spin" />
						)}
						{t('yes')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
