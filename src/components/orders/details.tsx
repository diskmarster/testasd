"use client"

import { useLanguage } from "@/context/language";
import { FormattedOrder, FormattedOrderLine } from "@/data/orders.types";
import { cn, formatDate, formatNumber, numberToCurrency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { ExcelRow, genReorderExcelWorkbook } from "@/lib/pdf/reorder-rapport";
import { useTranslation } from "@/app/i18n/client";
import { DialogContentV2, DialogDescriptionV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogTriggerV2, DialogV2 } from "../ui/dialog-v2";
import { useEffect, useState, useTransition } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { UserNoHash } from "@/lib/database/schema/auth";
import { fetchUsersAction, sendEmailAction } from "@/app/[lng]/(site)/genbestil/[id]/actions";
import { z } from "zod";
import { sendEmailValidation } from "@/app/[lng]/(site)/genbestil/[id]/validation";
import * as XLSX from 'xlsx'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface Props {
	order: FormattedOrder
}

export function Details({ order }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, "genbestil")
	const lines = order.lines.sort((lA, lB) => lB.supplierName.localeCompare(lA.supplierName))
	const totalCost = order.lines.reduce((acc, cur) => acc + cur.sum, 0)
	const GRID_CLASSES =
		"grid gap-2 grid-cols-[minmax(120px,1fr)_minmax(160px,1.5fr)_minmax(300px,4fr)_minmax(80px,1fr)_minmax(80px,1fr)_minmax(40px,0.5fr)_minmax(80px,1fr)] print:grid-cols-7"

	function printOrder() {
		const orderEl = document.getElementById("order")
		const newWindow = window.open('', '', 'width=1200,height=800')

		if (newWindow) {
			const styles = document.querySelector('link[rel="stylesheet"]')?.outerHTML

			newWindow.document.write(`
				<html>
					<head>
						<title>Label Print</title>
						${styles}
					</head>
					<body>
						${orderEl?.outerHTML}
					</body>
				</html>
			`)

			newWindow.document.close()
			newWindow.focus()
			newWindow.onload = _ => {
				newWindow.print()
				newWindow.close()
			}
		}
	}

	function downloadOrder() {
		const rows: ExcelRow[] = order.lines
			.map(l => ({
				supplierName: l.supplier?.name ?? '-',
				sku: l.sku,
				barcode: l.barcode,
				text1: l.text1,
				text2: l.text2,
				unitName: l.unitName,
				costPrice: l.costPrice,
				quantity: l.quantity,
				sum: l.sum,
			}))

		const workbook = genReorderExcelWorkbook(rows, t)
		XLSX.writeFile(workbook, `nemlager_genbestilling_${formatDate(new Date())}.xlsx`)
	}

	return (
		<div id="order" className="flex flex-col gap-8">
			<div className='flex w-full justify-between'>
				<MetaInfo order={order} />
				<div className="print:hidden space-x-2">
					<SendEmailModal order={order} />
					<Button
						size='icon'
						variant='outline'
						tooltip="Download bestilling"
						onClick={() => downloadOrder()}>
						<Icons.download className="size-4" />
					</Button>
					<Button
						size='icon'
						variant='outline'
						tooltip="Print bestilling"
						onClick={() => printOrder()}>
						<Icons.printer className="size-4" />
					</Button>
				</div>
			</div>
			<div className="border rounded-md overflow-x-scroll print:overflow-auto">
				<ViewHeaders gridClasses={GRID_CLASSES} />
				<div className="divide-y divide-border max-lg:w-max print:w-auto">
					{lines.map((l, i) => (
						<ViewItem key={i} gridClasses={GRID_CLASSES} line={l} />
					))}
				</div>
				<ViewFooter totalCost={totalCost} />
			</div>
		</div>
	)
}

function MetaInfo({ order }: { order: FormattedOrder }) {
	return (
		<div className='w-max print:w-full'>
			<h1 className='whitespace-balance text-xl font-semibold leading-tight tracking-tighter md:text-2xl'>
				Bestilling: #{order.id}
			</h1>
			<div className="flex gap-4 mt-2 text-sm">
				<div className="flex flex-col">
					<p className='text-muted-foreground'>Oprettet:</p>
					<p className='text-muted-foreground'>Bruger:</p>
				</div>
				<div className="flex flex-col">
					<p className='text-muted-foreground'>Oprettet: {formatDate(order.inserted)}</p>
					<p className='text-muted-foreground'>{order.userName}</p>
				</div>
			</div>
		</div>
	)
}

function ViewHeaders({ gridClasses }: { gridClasses: string }) {
	return (
		<div className={cn(
			"py-2 px-3 text-xs font-semibold text-muted-foreground border-b bg-muted max-lg:w-max",
			gridClasses,
			"print:w-full"
		)}>
			<p>Varenr.</p>
			<p>Leverandør</p>
			<p>Varetekst 1</p>
			<p className="text-right">Kostpris</p>
			<p className="text-right">Antal</p>
			<p>Enhed</p>
			<p className="text-right">Total</p>
		</div>
	)
}

function ViewItem({ line, gridClasses }: { line: FormattedOrderLine, gridClasses: string }) {
	const lng = useLanguage()
	return (
		<div className={cn(
			"text-sm px-3 py-2",
			gridClasses,
		)}>
			<p>{line.sku}</p>
			<p className="text-ellipsis truncate overflow-hidden">{line.supplierName}</p>
			<p className="text-ellipsis truncate overflow-hidden">{line.text1}</p>
			<p className="text-right tabular-nums">{numberToCurrency(line.costPrice, lng)}</p>
			<p className="text-right tabular-nums">{formatNumber(line.quantity, lng)}</p>
			<p>{line.unitName}</p>
			<p className="text-right tabular-nums">{numberToCurrency(line.sum, lng)}</p>
		</div>
	)
}

function ViewFooter({ totalCost }: { totalCost: number }) {
	const lng = useLanguage()
	return (
		<div className="border-t flex items-center justify-between py-4 px-3 text-sm font-medium sticky left-0">
			<p>Total</p>
			<p>{numberToCurrency(totalCost, lng)}</p>
		</div>
	)
}

function SendEmailModal({ order }: { order: FormattedOrder }) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'genbestil')
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [users, setUsers] = useState<UserNoHash[]>([])

	useEffect(() => {
		if (!pending && users.length == 0) {
			startTransition(async () => {
				const res = await fetchUsersAction()
				if (res && res.data) {
					setUsers(res.data)
				}
			})
		}
	}, [])

	const { watch, setValue, register, handleSubmit } = useForm<z.infer<typeof sendEmailValidation>>({
		resolver: zodResolver(sendEmailValidation),
		defaultValues: {
			orderID: order.id,
			lines: order.lines
				.map(l => ({
					supplier: l.supplier?.name ?? '-',
					sku: l.sku,
					barcode: l.barcode,
					text1: l.text1,
					text2: l.text2,
					unitName: l.unitName,
					costPrice: l.costPrice,
					quantity: l.quantity,
					sum: l.quantity * l.costPrice,
				}))
				.sort((ra, rb) => rb.supplier.localeCompare(ra.supplier))
		}
	})

	const fv = watch()

	function onSubmit(values: z.infer<typeof sendEmailValidation>) {
		startTransition(async () => {
			const res = await sendEmailAction(values)
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={setOpen}>
			<DialogTriggerV2 asChild>
				<Button
					size='icon'
					variant='outline'
					tooltip="Send bestilling som mail">
					<Icons.mail className="size-4" />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className="max-w-sm">
				<DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.mail className="size-4 text-primary" />
						<DialogTitleV2>Send bestilling som mail</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="px-3 space-y-4"
					id="send-email">
					<DialogDescriptionV2>Vælg fra en list af brugere eller skriv en e-mail</DialogDescriptionV2>
					<div className="space-y-1.5">
						<Label>Brugere</Label>
						<ScrollArea maxHeight="max-h-56">
							<div className="space-y-2">
								{users.map(u => (
									<div
										key={u.id}
										onClick={() => setValue('email', u.email, { shouldValidate: true })}
										className={cn(
											"rounded-md border px-3 py-1.5 flex items-center justify-between",
											"cursor-pointer hover:bg-muted transition-all",
											fv.email == u.email && "border-primary border"
										)}>
										<div>
											<p className="text-sm font-medium">{u.name}</p>
											<p className="text-xs text-muted-foreground">{u.email}</p>
										</div>
										{fv.email == u.email && (
											<Icons.circleCheck className="size-4 text-primary" />
										)}
									</div>
								))}
							</div>
						</ScrollArea>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="email">E-mail</Label>
						<Input
							id="email"
							type="email"
							placeholder="Vælg eller skriv en e-mail"
							{...register('email')}
						/>
					</div>
				</form>
				<DialogFooterV2>
					<Button
						size='sm'
						disabled={pending}
						className="flex items-center gap-2"
						form="send-email"
						type="submit">
						{pending && (
							<Icons.spinner className="size-4 animate-spin" />
						)}
						Send bestilling
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
