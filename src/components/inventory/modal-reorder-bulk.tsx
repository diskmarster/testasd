"use client"

import { useTranslation } from "@/app/i18n/client"
import { useLanguage } from "@/context/language"
import { useMemo, useState, useTransition } from "react"
import {
	DialogContentV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogV2
} from "../ui/dialog-v2"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import {
	FormState,
	useFieldArray,
	UseFieldArrayRemove,
	useForm,
	UseFormRegister,
	UseFormSetValue
} from "react-hook-form"
import { z } from "zod"
import { bulkAddOrderedToReorderValidation } from "@/app/[lng]/(site)/genbestil/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormattedReorder } from "@/data/inventory.types"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { clearTableSelection, cn, formatNumber, numberToCurrency, updateChipCount } from "@/lib/utils"
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "../ui/popover"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator
} from "../ui/command"
import { bulkAddOrderedToReorderAction } from "@/app/[lng]/(site)/genbestil/actions"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { ScrollArea } from "../ui/scroll-area"
import { useCustomEventListener } from "react-custom-events"
import { TooltipWrapper } from "../ui/tooltip-icon"
import { FormattedProduct } from "@/data/products.types"
import { Separator } from "../ui/separator"

interface Props {
	reorders: FormattedReorder[]
	productsWithNoReorders: FormattedProduct[]
}

export function ModalBulkReorder({ reorders, productsWithNoReorders }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, "genbestil")
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const schema = useMemo(() => bulkAddOrderedToReorderValidation(t), [t]);
	const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false)
	const [productComboboxOpen, setProductComboboxOpen] = useState(false)

	const { handleSubmit, reset, register, setValue, watch, formState, control } = useForm<z.infer<typeof schema>>({
		mode: 'onChange',
		resolver: zodResolver(schema),
		defaultValues: {
			items: [],
		}
	})

	const { fields, append, remove } = useFieldArray({ control, name: 'items', rules: { minLength: 1 } })

	const formValues = watch()

	const selectedProductIDs = useMemo(() => {
		return new Set(formValues.items.map(i => i.productID))
	}, [formValues.items])

	const selectedSuppliers = useMemo(() => {
		return new Set(formValues.items.map(i => i.supplierName))
	}, [formValues.items])


	const selectableSuppliers = useMemo(() => {
		return Array.from(
			new Set(
				reorders
					.filter(r => (
						!selectedSuppliers.has(r.product.supplierName)
						|| !selectedProductIDs.has(r.productID))
						&& r.product.supplierName != null)
			)
		)
	}, [reorders, selectedProductIDs, selectedSuppliers])

	const selectableReorders = useMemo(() => {
		return reorders.filter(r => !selectedProductIDs.has(r.productID))
	}, [reorders, selectedProductIDs])

	const selectableProducts = useMemo(() => {
		return productsWithNoReorders.filter(p => selectableReorders.some(r => r.productID != p.id) || !selectedProductIDs.has(p.id))
	}, [selectableReorders])

	function onOpenChange(open: boolean) {
		if (!open) {
			reset()
		}
		setOpen(open)
	}

	useCustomEventListener('BulkReorder', ({ reorders: newReorders }: { reorders: FormattedReorder[] }) => {
		reset({
			items: newReorders.map(r => ({
				text1: r.product.text1,
				sku: r.product.sku,
				productID: r.productID,
				ordered: r.orderAmount,
				alreadyOrdered: r.ordered,
				supplierName: r.product.supplierName,
				quantity: r.quantity,
				disposable: r.disposible,
				maxOrderAmount: r.maxOrderAmount,
				shouldReorder: r.shouldReorder,
				barcode: r.product.barcode,
				text2: r.product.text2,
				unitName: r.product.unit,
				costPrice: r.product.costPrice,
				minimum: r.minimum ?? "-",
				isRequested: r.isRequested,
			}))
		})

		onOpenChange(true)
	})

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const res = await bulkAddOrderedToReorderAction(values)
			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle), {
					description: t("bulk.toast-error")
				})
				return
			}
			toast.success(t(siteConfig.successTitle), {
				description: t("bulk.toast-success")
			})

			onOpenChange(false)
			updateChipCount()
			clearTableSelection()
		})
	}

	function appendSupplier(sup: string) {
		const reordersWithSupplier = reorders.filter(r => r.product.supplierName == sup && !selectedProductIDs.has(r.productID))
		reordersWithSupplier.forEach(r => append({
			sku: r.product.sku,
			ordered: r.orderAmount,
			alreadyOrdered: r.ordered,
			productID: r.productID,
			text1: r.product.text1,
			supplierName: r.product.supplierName,
			quantity: r.quantity,
			disposable: r.disposible,
			maxOrderAmount: r.maxOrderAmount,
			shouldReorder: Boolean(r.shouldReorder),
			barcode: r.product.barcode,
			text2: r.product.text2,
			unitName: r.product.unit,
			costPrice: r.product.costPrice,
			minimum: r.minimum ?? "-",
			isRequested: r.isRequested,
		}))
	}

	const totalPrice = formValues.items.reduce((acc, cur) => acc + (cur.ordered * cur.costPrice), 0)

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogContentV2 className="max-w-7xl">
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
					<p className="text-sm text-muted-foreground max-w-prose text-pretty">
						{t("bulk.description")}
					</p>
					<div className="flex flex-col gap-1">
						<p className="text-sm text-muted-foreground max-w-prose text-pretty">
							{t("bulk.red-products")}
						</p>
						{/*<p className="text-sm text-muted-foreground max-w-prose text-pretty">
						{t("bulk.yellow-products")}
					</p>*/}
					</div>
					<ScrollArea maxHeight="max-h-[550px]">
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
										formValues={formValues}
									/>
								))}
							</div>
							<div className="flex items-center gap-2">
								<Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
									<PopoverTrigger asChild>
										<Button
											role="combobox"
											aria-expanded={productComboboxOpen}
											size='sm'
											type="button"
											variant='outline'
											className="flex items-center gap-2">
											<Icons.plus className="size-3 text-primary" />
											{t("bulk.add-rows-btn")}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="p-0 min-w-96 max-w-96">
										<Command>
											<CommandInput placeholder={t("bulk.product-search")} className="h-9" />
											<CommandList>
												<CommandEmpty>{t("bulk.product-no-items")}</CommandEmpty>
												<CommandGroup>
													{selectableReorders.slice(0, 50).map((s, i) => (
														<CommandItem
															keywords={[s.product.text1, s.product.sku, s.product.supplierName ?? ""]}
															key={`${s.productID}-${i}`}
															value={s.product.text1}
															onSelect={() => {
																append({
																	sku: s.product.sku,
																	ordered: s.orderAmount,
																	alreadyOrdered: s.ordered,
																	productID: s.productID,
																	text1: s.product.text1,
																	supplierName: s.product.supplierName,
																	quantity: s.quantity,
																	disposable: s.disposible,
																	maxOrderAmount: s.maxOrderAmount,
																	shouldReorder: Boolean(s.shouldReorder),
																	barcode: s.product.barcode,
																	text2: s.product.text2,
																	unitName: s.product.unit,
																	costPrice: s.product.costPrice,
																	minimum: s.minimum ?? "-",
																	isRequested: s.isRequested,
																})
																setSupplierComboboxOpen(false)
															}}>
															<div className="flex flex-col gap-0.5">
																<span>{s.product.text1}</span>
																<div className="text-xs flex items-center gap-1 text-muted-foreground">
																	<span>{t("bulk.sku")}: {s.product.sku}</span>
																	{s.product.supplierName && (
																		<>
																			<span>-</span>
																			<span>{t("bulk.supplier")}: {s.product.supplierName}</span>
																		</>
																	)}
																</div>
															</div>
														</CommandItem>
													))}
												</CommandGroup>
												<CommandGroup>
													{selectableProducts.slice(0, 50).map((p, i) => (
														<CommandItem
															keywords={[p.text1, p.sku, p.supplierName ?? ""]}
															key={`${p.sku}-${i}`}
															value={p.text1}
															onSelect={() => {
																append({
																	sku: p.sku,
																	ordered: 0,
																	alreadyOrdered: 0,
																	productID: p.id,
																	quantity: 0,
																	disposable: 0,
																	maxOrderAmount: 0,
																	shouldReorder: false,
																	minimum: 0,
																	text1: p.text1,
																	supplierName: p.supplierName,
																	barcode: p.barcode,
																	text2: p.text2,
																	unitName: p.unit,
																	costPrice: p.costPrice,
																	isRequested: false,
																})
																setSupplierComboboxOpen(false)
															}}>
															<div className="flex flex-col gap-0.5">
																<span>{p.text1}</span>
																<div className="text-xs flex items-center gap-1 text-muted-foreground">
																	<span>{t("bulk.sku")}: {p.sku}</span>
																	{p.supplierName && (
																		<>
																			<span>-</span>
																			<span>{t("bulk.supplier")}: {p.supplierName}</span>
																		</>
																	)}
																</div>
															</div>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
								{selectableSuppliers.length > 0 && (
									<Popover open={supplierComboboxOpen} onOpenChange={setSupplierComboboxOpen}>
										<PopoverTrigger asChild>
											<Button
												role="combobox"
												aria-expanded={supplierComboboxOpen}
												size='sm'
												type="button"
												variant='outline'
												className="flex items-center gap-2">
												<Icons.plus className="size-3 text-primary" />
												{t("bulk.add-rows-supplier-btn")}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-0 min-w-52 max-w-52">
											<Command>
												<CommandInput placeholder={t("bulk.suppliers-search")} className="h-9" />
												<CommandList>
													<CommandEmpty>{t("bulk.suppliers-no-items")}</CommandEmpty>
													<CommandGroup>
														{Array.from(new Set(selectableSuppliers.map(s => s.product.supplierName)).values()).slice(0, 50).map((s, i) => (
															<CommandItem
																key={`${s}-${i}`}
																value={s!}
																onSelect={(currentValue) => {
																	appendSupplier(currentValue)
																	setSupplierComboboxOpen(false)
																}}
															>
																{s}
															</CommandItem>
														))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
								)}
							</div>
						</div>
					</ScrollArea>
				</form>
				<div className="px-3">
					<Separator />
				</div>
				<div className="px-3 ml-auto flex items-baseline gap-2">
					<p className="text-sm text-muted-foreground">Total</p>
					<p className="tabular-nums">{numberToCurrency(totalPrice, lng)}</p>
				</div>
				<DialogFooterV2>
					<Button
						onClick={() => onOpenChange(false)}
						size='sm'
						variant='outline'>
						{t("bulk.btn-close")}
					</Button>
					<Button
						disabled={pending || !formState.isValid}
						size='sm'
						form="create-form"
						type="submit"
						className="flex items-center gap-2">
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

type Field = {
	text1: string,
	sku: string,
	productID: number,
	ordered: number,
	alreadyOrdered: number
	supplierName: string | null,
	quantity: number,
	disposable: number,
	maxOrderAmount: number,
	shouldReorder: boolean,
	text2: string,
	barcode: string,
	unitName: string,
	costPrice: number,
	minimum: number,
	isRequested: boolean,
}

interface FieldProps {
	field: Field
	index: number
	remove: UseFieldArrayRemove
	register: UseFormRegister<{
		items: Field[];
	}>
	formState: FormState<{
		items: Field[];
	}>
	setValue: UseFormSetValue<{
		items: Field[];
	}>
	reorders: FormattedReorder[]
	selectableReorders: FormattedReorder[]
	formValues: {
		items: Field[];
	}
}

function ReorderField({
	field,
	index,
	remove,
	register,
	setValue,
	reorders,
	selectableReorders,
	formState,
	formValues
}: FieldProps) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, "genbestil")
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState<string>(field.text1 ?? '')
	const max = formValues.items[index].maxOrderAmount > 0 ? formValues.items[index].maxOrderAmount : undefined

	return (
		<div className="flex items-end gap-2">
			<div className="grid gap-1.5 w-[60%]">
				<Label className={cn('', index !== 0 && 'hidden')}>{t("bulk.product")}</Label>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className={cn(
								"justify-between font-normal truncate",
								formValues.items[index].shouldReorder && " bg-destructive/10",
								formValues.items[index].isRequested && " bg-warning/10",
							)}>
							<p className="max-w-[80%] truncate">
								{search
									? field.text1
									: t("bulk.product-placeholder")}
							</p>
							<Icons.chevronDownUp className="opacity-50 size-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="p-0 min-w-96 max-w-96">
						<Command>
							<CommandInput placeholder={t("bulk.product-search")} className="h-9" />
							<CommandList>
								<CommandEmpty>{t("bulk.product-no-items")}</CommandEmpty>
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
												setValue(`items.${index}.quantity`, p.quantity, { shouldValidate: true })
												setValue(`items.${index}.disposable`, p.disposible, { shouldValidate: true })
												setValue(`items.${index}.supplierName`, p.product.supplierName, { shouldValidate: true })
												setValue(`items.${index}.ordered`, p.orderAmount, { shouldValidate: true })
												setValue(`items.${index}.maxOrderAmount`, p.maxOrderAmount, { shouldValidate: true })
												setValue(`items.${index}.isRequested`, p.isRequested, { shouldValidate: true })
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
				<Label className={cn('', index !== 0 && 'hidden')}>{t("bulk.suppliers")}</Label>
				<Input
					value={formValues.items[index].supplierName ?? '-'}
					disabled
				/>
			</div>
			<div className="grid gap-1.5 w-[15%]">
				<Label className={cn('', index !== 0 && 'hidden')}>{t("bulk.minimum")}</Label>
				<Input
					className={cn("tabular-nums")}
					value={field.isRequested
						? "-"
						: formatNumber(field.minimum, lng)}
					disabled
				/>
			</div>
			<div className="grid gap-1.5 w-[15%]">
				<div className={cn('flex items-center gap-1', index !== 0 && 'hidden')}>
					<Label>{t("bulk.disposable")}</Label>
					<TooltipWrapper tooltip={t("bulk.tooltip-disposable")}>
						<Icons.help className="size-3.5 text-muted-foreground" />
					</TooltipWrapper>
				</div>
				<Input
					className="tabular-nums"
					value={formatNumber(
						field.quantity + (formValues.items[index].alreadyOrdered || 0),
						lng,
					)}
					disabled
				/>
			</div>
			<div className="grid gap-1.5 w-[15%]">
				<Label className={cn('', index !== 0 && 'hidden')}>{t("bulk.qty")}</Label>
				<Input
					max={max}
					tooltip={{
						condition: !!formState.errors.items?.[index]?.ordered,
						icon: <Icons.alert className="size-4 text-destructive" />,
						content: formState.errors.items?.[index]?.ordered?.message ?? "Forkert værdi"
					}}
					{...register(`items.${index}.ordered` as const)}
					className={cn(
						'tabular-nums',
						(formState.errors.items && formState.errors.items[index]?.ordered || formValues.items[index].ordered == 0) && 'focus-visible:ring-destructive border-destructive'
					)}
				/>
			</div>
			<div className="grid gap-1.5 w-[20%]">
				<Label className={cn('', index !== 0 && 'hidden')}>{t("bulk.sum")}</Label>
				<Input
					className="tabular-nums"
					value={numberToCurrency(formValues.items[index].ordered * field.costPrice)}
					disabled
				/>
			</div>
			<Button
				tabIndex={-1}
				size='icon'
				variant='outline'
				onClick={() => remove(index)}>
				<Icons.cross className="size-4 text-destructive" />
			</Button>
		</div>
	)
}
