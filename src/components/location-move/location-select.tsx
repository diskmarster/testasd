"use client"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Label } from "../ui/label"
import { MoveBetweenLocationForm } from "./location-move-client-wrapper"
import { Input } from "../ui/input"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { LocationWithPrimary } from "@/lib/database/schema/customer"

namespace LocationAndReference {
	export interface Props {
		locations: LocationWithPrimary[]
		form: MoveBetweenLocationForm
		fetchAndUpdateInventories: (fromLocation: string) => void
	}
}

export function LocationAndReference({ locations, form, fetchAndUpdateInventories }: LocationAndReference.Props) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'lokations-flyt', { keyPrefix: "form" })

	const fromLocation = form.getValues('fromLocation')

	function setFromLocation(value: string) {
		form.reset({
			fromLocation: value,
			fields: [],
		})
	}

	return (
		<section className="flex items-center gap-2">
			<div className="grid gap-1.5">
				<Label>{t("location-select-label")}</Label>
				<Select value={fromLocation} onValueChange={
					value => {
						setFromLocation(value)
						fetchAndUpdateInventories(value)
					}}>
					<SelectTrigger className="w-56">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{locations.map(l => (
							<SelectItem key={l.id} value={l.id} className="cursor-pointer">
								<div className="flex items-center gap-1.5">
									<span>{l.name}</span>
									{l.isBarred && (
										<div className='text-xs bg-muted text-muted-foreground py-0.5 px-1.5 rounded-sm'>
											{t("location-select-inactive")}
										</div>
									)}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-1.5">
				<Label>{t("reference-label")}</Label>
				<Input {...form.register('reference')} />
			</div>
		</section>
	)
}
