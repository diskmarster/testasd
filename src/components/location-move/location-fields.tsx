import { useFieldArray } from "react-hook-form"
import { MoveBetweenLocationForm } from "./location-move-client-wrapper"
import { Button } from "../ui/button"
import { FormattedInventory } from "@/data/inventory.types"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { useMemo, useState } from "react"
import { Batch, Placement } from "@/lib/database/schema/inventory"
import { Icons } from "../ui/icons"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import { NumberInput } from "../ui/number-input"
import { Error } from "@/app/[lng]/(site)/administration/lokations-flyt/actions"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { LocationWithPrimary } from "@/lib/database/schema/customer"

namespace LocationFields {
	export interface Props {
		form: MoveBetweenLocationForm
		errors: Error[]
		locations: LocationWithPrimary[]
		inventories: FormattedInventory[]
		usePlacements: boolean
		useBatches: boolean
	}
}

export function LocationFields({ form, inventories, errors, locations, usePlacements, useBatches }: LocationFields.Props) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'lokations-flyt', { keyPrefix: "form" })

	const [open, setOpen] = useState(false)

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "fields"
	})

	const products = useMemo(() => Array.from(
		inventories.reduce((acc, cur) => {
			const sku = cur.product.sku
			if (!acc.has(sku) && cur.quantity > 0) {
				acc.set(sku, cur.product)
			}
			return acc
		}, new Map<string, FormattedInventory['product']>()).values()
	), [])

	const seenPlacements = new Map<string, Set<string>>()
	const productPlacements = useMemo(() => inventories.reduce((acc, cur) => {
		const sku = cur.product.sku
		if (!acc.has(sku)) {
			acc.set(sku, [])
			seenPlacements.set(sku, new Set())
		}
		const placementNames = seenPlacements.get(sku)!
		if (!placementNames.has(cur.placement.name) && cur.quantity > 0) {
			acc.get(sku)!.push(cur.placement)
			placementNames.add(cur.placement.name)
		}
		return acc
	}, new Map<string, Placement[]>()), [])

	const productBatches = useMemo(() => inventories.reduce((acc, cur) => {
		const skuPlacementKey = `${cur.product.sku}-${cur.placement.id}`
		if (!acc.has(skuPlacementKey)) {
			acc.set(skuPlacementKey, [])
		}
		if (cur.quantity > 0) {
			acc.get(skuPlacementKey)!.push(cur.batch)
		}
		return acc
	}, new Map<string, Batch[]>()), [])

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-2">
				{fields.length > 0 ? (
					fields.map((f, fi) => {
						const error = errors.at(fi)
						return (
							<div key={`${fi}-${f.sku}`} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-end gap-2">
								<div className="grid gap-1.5">
									<Label className={cn(fi != 0 && "hidden")}>{t("sku-label")}</Label>
									<Input value={f.sku} disabled />
								</div>

								{usePlacements && (
									<div className="grid gap-1.5">
										<Label className={cn(fi != 0 && "hidden")}>{t("from-placement-label")}</Label>
										<Select
											value={form.getValues(`fields.${fi}.fromPlacementID`)?.toString(10)}
											onValueChange={(value) => {
												form.setValue(`fields.${fi}.fromPlacementID`, Number(value), { shouldDirty: true, shouldValidate: true })
											}}>
											<SelectTrigger className={cn((error && error.type == 'from-placement') && "border-destructive")}>
												<SelectValue placeholder={t("from-placement-placeholder")} />
											</SelectTrigger>
											<SelectContent>
												{productPlacements.get(form.getValues(`fields.${fi}.sku`))?.map((p, pi) => (
													<SelectItem key={`${pi}-${p.name}`} value={p.id.toString(10)}>{p.name} {p.isBarred && "spærret"}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}

								{useBatches && (
									<div className="grid gap-1.5">
										<Label className={cn(fi != 0 && "hidden")}>{t("from-batch-label")}</Label>
										<Select
											disabled={form.getValues(`fields.${fi}.fromPlacementID`) === -1}
											value={form.getValues(`fields.${fi}.fromBatchID`)?.toString(10)}
											onValueChange={(value) => {
												form.setValue(`fields.${fi}.fromBatchID`, Number(value), { shouldDirty: true, shouldValidate: true })
											}}>
											<SelectTrigger className={cn((error && error.type == 'from-batch') && "border-destructive")}>
												<SelectValue placeholder={t("from-batch-placeholder")} />
											</SelectTrigger>
											<SelectContent>
												{productBatches.get(`${form.getValues(`fields.${fi}.sku`)}-${form.getValues(`fields.${fi}.fromPlacementID`)}`)?.map((b, pi) => (
													<SelectItem key={`${pi}-${b.id}`} value={b.id.toString(10)}>{b.batch} {b.isBarred && "spærret"}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}

								<div className="grid gap-1.5">
									<Label className={cn(fi != 0 && "hidden")}>{t("to-location-label")}</Label>
									<Select
										defaultValue={f.toLocationID}
										onValueChange={(value) => {
											form.setValue(`fields.${fi}.toLocationID`, value, { shouldDirty: true, shouldValidate: true })
										}}>
										<SelectTrigger className={cn((error && error.type == 'to-location') && "border-destructive")}>
											<SelectValue placeholder={t("to-location-placeholder")} />
										</SelectTrigger>
										<SelectContent>
											{locations.filter(loc => loc.id != form.getValues('fromLocation')).map((l, li) => (
												<SelectItem key={`${li}-${l.name}`} value={l.id}>{l.name} {l.isBarred && "spærret"}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="grid gap-1.5">
									<Label className={cn(fi != 0 && "hidden")}>{t("quantity-label")}</Label>
									<NumberInput
										min={0}
										decimalScale={2}
										className={cn((error && error.type == 'quantity') && "border-destructive")}
										defaultValue={f.quantity}
										onValueChange={(value) => {
											form.setValue(`fields.${fi}.quantity`, value ?? 0, { shouldDirty: true, shouldValidate: true })
										}}
									/>
								</div>

								<Button size="icon" variant="outline" onClick={() => remove(fi)}>
									<Icons.cross className="size-4 text-destructive" />
								</Button>
							</div>
						)
					})
				) : (
					<span className="text-sm text-muted-foreground">{t("empty-form-message")}</span>
				)}
			</div>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-fit flex items-center gap-2"
					>
						<Icons.plus className="size-3.5" />
						{t("add-product-button")}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-0">
					<span className="text-xs px-3 my-2 flex items-center gap-2 text-yellow-600 dark:text-warning">
						<Icons.info className="size-3" />
						<span>{t("search-info")}</span>
					</span>
					<Command className="border-t rounded-t-none">
						<CommandInput placeholder={t("search-placeholder")} className="h-9" />
						<CommandList>
							<CommandEmpty>{t("search-empty-message")}</CommandEmpty>
							<CommandGroup>
								{products.filter(p => !form.getValues('fields').some(f => f.sku == p.sku)).map((p, i) => (
									<CommandItem
										keywords={[p.text1, p.group, p.sku, p.supplierName ?? ""]}
										key={`${p.id}-${i}`}
										value={p.id.toString(10)}
										onSelect={() => {
											const prevToLocationId = form.getValues(`fields.${fields.length - 1}.toLocationID`) ?? ""

											append({
												toLocationID: prevToLocationId ?? "",
												productID: p.id,
												sku: p.sku,
												fromPlacementID: undefined,
												fromBatchID: undefined,
												quantity: 0,
											})
											setOpen(false)
										}}>
										<div className="flex flex-col gap-0.5">
											<span>{p.text1}</span>
											<span className="text-muted-foreground">{p.sku}</span>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	)
}
