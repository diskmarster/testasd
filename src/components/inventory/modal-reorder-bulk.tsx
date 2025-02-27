"use client"

import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"
import { useMemo, useState, useTransition } from "react"
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogTriggerV2, DialogV2 } from "../ui/dialog-v2"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import { FormState, useFieldArray, UseFieldArrayRemove, useForm, UseFormRegister, UseFormSetValue } from "react-hook-form"
import { z } from "zod"
import { bulkAddOrderedToReorderValidation } from "@/app/[lng]/(site)/genbestil/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormattedReorder } from "@/data/inventory.types"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { bulkAddOrderedToReorderAction } from "@/app/[lng]/(site)/genbestil/actions"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"

interface Props {
	reorders: FormattedReorder[]
}

export function ModalBulkReorder({ reorders }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, "genbestil")
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const schema = useMemo(() => bulkAddOrderedToReorderValidation(t), [t]);

	const redReorders = useMemo(() => {
		return reorders.filter(r => r.quantity < r.minimum && r.ordered < r.recommended)
	}, [reorders])

	const { handleSubmit, reset, register, setValue, watch, formState, control } = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			items: redReorders.map(r => ({
				text1: r.product.text1,
				sku: r.product.sku,
				productID: r.productID,
				ordered: r.recommended,
				alreadyOrdered: r.ordered
			}))
		}
	})

	const { fields, append, remove } = useFieldArray({ control, name: 'items', rules: { minLength: 1 } })

	const formValues = watch()

	const selectedProductIDs = useMemo(() => {
		return new Set(formValues.items.map(item => item.productID))
	}, [formValues.items])

	const selectableReorders = useMemo(() => {
		return reorders.filter(r => !selectedProductIDs.has(r.productID))
	}, [reorders, selectedProductIDs])

	function onOpenChange(open: boolean) {
		reset({
			items: redReorders.map(r => ({
				text1: r.product.text1,
				sku: r.product.sku,
				productID: r.productID,
				ordered: r.recommended,
				alreadyOrdered: r.ordered
			}))
		})
		setOpen(open)
	}

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const res = await bulkAddOrderedToReorderAction(values)
			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle), {
					description: "Genbestillinger blev ikke registreret"
				})
				return
			}
			toast.success(t(siteConfig.successTitle), {
				description: "Genbestillinger blev registreret"
			})
			onOpenChange(false)
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button variant='outline' size='icon' tooltip="Registrer flere genbestillinger">
					<Icons.listPlus className="size-4" />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className="max-w-xl">
				<DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.listPlus className="size-4 text-primary" />
						<DialogTitleV2>{t('bulk.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="px-3 space-y-4"
					id="create-form">
					<p className="text-sm text-muted-foreground">
						{t("bulk.description")}
					</p>
					<div className="space-y-2">
						<div className="space-y-2">
							{fields.length == 0 && (
								<p className="text-sm text-muted-foreground">
									{t("bulk.add-rows-continue")}
								</p>
							)}
							{fields.map((field, index) => (
								<ReorderField
									key={field.id}
									field={field}
									index={index}
									remove={remove}
									register={register}
									formState={formState}
									setValue={setValue}
									reorders={reorders}
									selectableReorders={selectableReorders}
								/>
							))}
						</div>
						{reorders.length != formValues.items.length && (
							<Button
								size='sm'
								variant='outline'
								onClick={() => append({ sku: "", ordered: 0, alreadyOrdered: 0, productID: 0, text1: "" })}
								className="flex items-center gap-2">
								<Icons.plus className="size-3 text-primary" />
								{t("bulk.add-rows-btn")}
							</Button>
						)}
					</div>
				</form>
				<DialogFooterV2>
					<Button onClick={() => onOpenChange(false)} size='sm' variant='outline'>{t("bulk.btn-close")}</Button>
					<Button disabled={pending || !formState.isValid} size='sm' form="create-form" type="submit" className="flex items-center gap-2">
						{pending && (
							<Icons.spinner className="size-3.5 animate-spin" />
						)}
						{t("bulk.btn-confirm")}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}

interface FieldProps {
	field: { text1: string, sku: string, productID: number, ordered: number, alreadyOrdered: number }
	index: number
	remove: UseFieldArrayRemove
	register: UseFormRegister<{
		items: {
			text1: string
			sku: string;
			productID: number;
			ordered: number;
			alreadyOrdered: number;
		}[];
	}>
	formState: FormState<{
		items: {
			text1: string
			sku: string;
			productID: number;
			ordered: number;
			alreadyOrdered: number;
		}[];
	}>
	setValue: UseFormSetValue<{
		items: {
			text1: string;
			sku: string;
			productID: number;
			ordered: number;
			alreadyOrdered: number;
		}[];
	}>
	reorders: FormattedReorder[]
	selectableReorders: FormattedReorder[]
}

function ReorderField({ field, index, remove, register, setValue, reorders, selectableReorders, formState }: FieldProps) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, "genbestil")
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState<string>(field.text1 ?? '')
	return (
		<div className="flex items-end gap-2">
			<div className="grid gap-1.5 w-[60%]">
				<Label className={cn('', index !== 0 && 'hidden')}>{t("bulk.sku")}</Label>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="justify-between font-normal truncate">
							<p className="max-w-[80%] truncate">
								{search
									? reorders.find((p) => p.product.text1 === search)?.product.text1
									: t("bulk.sku-placeholder")}
							</p>
							<Icons.chevronDownUp className="opacity-50 size-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="p-0 min-w-96 max-w-96">
						<Command>
							<CommandInput placeholder={t("bulk.sku-search")} className="h-9" />
							<CommandList>
								<CommandEmpty>{t("bulk.sku-no-items")}</CommandEmpty>
								<CommandGroup>
									{selectableReorders.slice(0, 50).map((p, i) => (
										<CommandItem
											key={`${p.productID}-${i}`}
											value={p.product.text1}
											onSelect={(currentValue) => {
												setValue(`items.${index}.productID`, p.productID, { shouldValidate: true })
												setValue(`items.${index}.sku`, p.product.sku, { shouldValidate: true })
												setValue(`items.${index}.text1`, p.product.text1, { shouldValidate: true })
												setValue(`items.${index}.alreadyOrdered`, p.ordered, { shouldValidate: true })
												setSearch(currentValue === search ? "" : currentValue)
												setOpen(false)
											}}
										>
											{p.product.text1}
											<Icons.check
												className={cn(
													"ml-auto size-4",
													search === p.product.text1 ? "opacity-100" : "opacity-0"
												)}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
			<div className="grid gap-1.5 w-[30%]">
				<Label className={cn('', index !== 0 && 'hidden')}>{t("bulk.qty")}</Label>
				<Input
					{...register(`items.${index}.ordered` as const)}
					className={cn(
						'',
						formState.errors.items && formState.errors.items[index]?.ordered && 'focus-visible:ring-destructive border-destructive'
					)}
				/>
			</div>
			<Button
				size='icon'
				variant='outline'
				onClick={() => remove(index)}>
				<Icons.cross className="size-4 text-destructive" />
			</Button>
		</div>
	)
}
