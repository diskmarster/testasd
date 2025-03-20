"use client"

import { useLanguage } from "@/context/language";
import { FormattedOrder } from "@/data/orders.types";
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
import { fetchUsersAction, sendOrderEmailAction } from "@/app/[lng]/(site)/genbestil/[id]/actions";
import { sendEmailValidation } from "@/app/[lng]/(site)/genbestil/[id]/validation";
import * as XLSX from 'xlsx'
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { siteConfig } from "@/config/site";
import { Customer } from "@/lib/database/schema/customer";
import { User } from "lucia";
import { OrderLine } from "@/lib/database/schema/reorders";
import { Skeleton } from "../ui/skeleton";

interface Props {
	order: FormattedOrder
	customer: Customer
	user: User
}

export function Details({ order, customer, user }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, "genbestil")
	const tr = (key: string) => t(`order-details.${key}`)
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
			newWindow.onload = () => {
				newWindow.print()
				newWindow.close()
			}
		}
	}

	function downloadOrder() {
		const rows: ExcelRow[] = order.lines
			.map(l => ({
				supplierName: l.supplierName ?? '-',
				sku: l.sku,
				barcode: l.barcode,
				text1: l.text1,
				text2: l.text2,
				unitName: l.unitName,
				costPrice: l.costPrice,
				quantity: l.quantity,
				sum: l.sum,
			}))

		const singleSupplier = (order.supplierCount == 1 && order.lines[0].supplierName != "-")
			? {
				name: order.lines[0].supplierName,
				email: order.lines[0].supplierEmail,
				phone: order.lines[0].supplierPhone,
				idOfClient: order.lines[0].supplierIdOfClient,
				contact: order.lines[0].supplierContactPerson,
			}
			: undefined
		const workbook = genReorderExcelWorkbook(order.id, order.inserted, user, customer, rows, t, singleSupplier)
		XLSX.writeFile(workbook, `nemlager_genbestilling_${formatDate(new Date())}.xlsx`)
	}

	return (
		<div id="order" className="flex flex-col gap-8">
			<div className='flex w-full justify-between'>
				<MetaInfo t={tr} order={order} />
				<div className="print:hidden space-x-2">
					<SendEmailModal t={tr} order={order} />
					<Button
						size='icon'
						variant='outline'
						tooltip={tr("action-download-tooltip")}
						onClick={() => downloadOrder()}>
						<Icons.download className="size-4" />
					</Button>
					<Button
						size='icon'
						variant='outline'
						tooltip={tr("action-print-tooltip")}
						onClick={() => printOrder()}>
						<Icons.printer className="size-4" />
					</Button>
				</div>
			</div>
			<div className="border rounded-md overflow-x-scroll print:overflow-auto">
				<ViewHeaders t={tr} gridClasses={GRID_CLASSES} />
				<div className="divide-y divide-border max-lg:w-max print:w-auto">
					{lines.map((l, i) => (
						<ViewItem key={i} gridClasses={GRID_CLASSES} line={l} />
					))}
				</div>
				<ViewFooter t={tr} totalCost={totalCost} />
			</div>
		</div>
	)
}

function MetaInfo({ order, t }: { order: FormattedOrder, t: (key: string) => string }) {
	return (
		<div className='w-max print:w-full'>
			<h1 className='whitespace-balance text-xl font-semibold leading-tight tracking-tighter md:text-2xl'>
				{t("title")}: #{order.id}
			</h1>
			<div className="flex gap-4 mt-2 text-sm">
				<div className="flex flex-col">
					<p className='text-muted-foreground'>{t("inserted")}</p>
					<p className='text-muted-foreground'>{t("user")}</p>
				</div>
				<div className="flex flex-col">
					<p className='text-muted-foreground'>{formatDate(order.inserted)}</p>
					<p className='text-muted-foreground'>{order.userName}</p>
				</div>
			</div>
		</div>
	)
}

function ViewHeaders({ gridClasses, t }: { gridClasses: string, t: (key: string) => string }) {
	return (
		<div className={cn(
			"py-2 px-3 text-xs font-semibold text-muted-foreground border-b bg-muted max-lg:w-max",
			gridClasses,
			"print:w-full"
		)}>
			<p>{t("sku")}</p>
			<p>{t("supplier")}</p>
			<p>{t("text1")}</p>
			<p className="text-right">{t("cost-price")}</p>
			<p className="text-right">{t("qty")}</p>
			<p>{t("unit")}</p>
			<p className="text-right">{t("sum")}</p>
		</div>
	)
}

function ViewItem({ line, gridClasses }: { line: OrderLine, gridClasses: string }) {
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

function ViewFooter({ totalCost, t }: { totalCost: number, t: (key: string) => string }) {
	const lng = useLanguage()
	return (
		<div className="border-t flex items-center justify-between py-4 px-3 text-sm font-medium sticky left-0">
			<p>{t("total")}</p>
			<p>{numberToCurrency(totalCost, lng)}</p>
		</div>
	)
}

function SendEmailModal({ order, t }: { order: FormattedOrder, t: (key: string) => string }) {
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [users, setUsers] = useState<UserNoHash[]>([])
	const isSingleSupplierOrder = order.supplierCount == 1
	const [selected, setSelected] = useState<string[]>([])
	const [error, setError] = useState<string>()
	const [input, setInput] = useState<string>()

	function toggleEmail(email: string) {
		if (selected.includes(email)) {
			setSelected(selected.filter(s => s != email))
		} else {
			setSelected(prev => [...prev, email])
		}
	}

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

	function onSubmit() {
		const data = { orderID: order.id, emails: input ? [...selected, input] : selected }
		const parsed = sendEmailValidation.safeParse(data)
		if (!parsed.success) {
			setError(t("invalid-input"))
			return
		}
		startTransition(async () => {
			const res = await sendOrderEmailAction(parsed.data)

			if (res && res.serverError) {
				setError(res.serverError)
				return
			}

			setSelected([])
			setOpen(false)
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={setOpen}>
			<DialogTriggerV2 asChild>
				<Button
					size='icon'
					variant='outline'
					tooltip={t("action-mail-tooltip")}>
					<Icons.mail className="size-4" />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className="max-w-sm">
				<DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.mail className="size-4 text-primary" />
						<DialogTitleV2>{t("mail-title")}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				{error && (
					<Alert variant='destructive'>
						<Icons.alert className='size-4 !top-3' />
						<AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<form
					onSubmit={() => onSubmit()}
					className="px-3 space-y-4"
					id="send-email">
					<DialogDescriptionV2>{t("mail-description")}</DialogDescriptionV2>
					{(isSingleSupplierOrder && order.lines[0].supplierEmail) && (
						<div className="space-y-1.5">
							<Label>Send til leverandør</Label>
							<div
								onClick={() => {
									toggleEmail(order.lines[0].supplierEmail)
								}}
								className={cn(
									"rounded-md border px-2.5 py-1 flex items-center justify-between",
									"cursor-pointer hover:bg-muted transition-all",
									selected.includes(order.lines[0].supplierEmail) && "border-primary border"
								)}>
								<div>
									<p className="text-xs font-medium">{order.lines[0].supplierName}</p>
									<p className="text-xs text-muted-foreground">{order.lines[0].supplierEmail}</p>
								</div>
								{selected.includes(order.lines[0].supplierEmail) && (
									<Icons.circleCheck className="size-4 text-primary" />
								)}
							</div>
						</div>
					)}
					<div className="space-y-1.5">
						<Label>{t("users")}</Label>
						<ScrollArea maxHeight="max-h-[142px]">
							<div className="space-y-2">
								{(pending && users.length == 0) && (
									<div className="flex items-center gap-2">
										<p className="text-xs">{t("fetching-users")}</p>
										<Icons.spinner className="size-3 animate-spin" />
									</div>
								)}
								{users.map(u => (
									<div
										key={u.id}
										onClick={() => {
											toggleEmail(u.email)
										}}
										className={cn(
											"rounded-md border px-2.5 py-1 flex items-center justify-between",
											"cursor-pointer hover:bg-muted transition-all",
											selected.includes(u.email) && "border-primary border"
										)}>
										<div>
											<p className="text-xs font-medium">{u.name}</p>
											<p className="text-xs text-muted-foreground">{u.email}</p>
										</div>
										{selected.includes(u.email) && (
											<Icons.circleCheck className="size-4 text-primary" />
										)}
									</div>
								))}
							</div>
						</ScrollArea>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="email">{t("email")}</Label>
						<Input
							id="email"
							type="email"
							placeholder={t("email-placeholder")}
							value={input}
							onChange={event => setInput(event.target.value)}
						/>
					</div>
				</form>
				<DialogFooterV2>
					<Button size={'sm'} variant={'outline'} onClick={() => setOpen(false)}>
						{t("modal-close")}
					</Button>
					<Button
						size='sm'
						disabled={pending}
						className="flex items-center gap-2"
						form="send-email"
						type="submit">
						{(pending && selected.length > 0) && (
							<Icons.spinner className="size-4 animate-spin" />
						)}
						{t("mail-send")}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}

export function DetailsSkeleton() {
	return (
		<div id="order" className="flex flex-col gap-8">
			<div className='flex w-full justify-between items-start'>
				<div>
					<Skeleton className="w-72 h-8" />
					<Skeleton className="h-5 w-48 mt-4" />
					<Skeleton className="h-5 w-48 mt-2" />
				</div>
				<div className="print:hidden space-x-2 flex items-center">
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
				</div>
			</div>
			<Skeleton className="w-full h-52" />
		</div>
	)
}
