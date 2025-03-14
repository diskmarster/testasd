"use client"

import { Button } from "../ui/button"
import {
	DialogContentV2,
	DialogDescriptionV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2
} from "../ui/dialog-v2"
import { Icons } from "../ui/icons"
import { getDateFnsLocale } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { formatRelative } from "date-fns"
import { useLanguage } from "@/context/language"
import Link from "next/link"
import { OrderWithCount } from "@/data/orders.types"
import { useTranslation } from "@/app/i18n/client"

export function ModalListOrders({ orders }: { orders: OrderWithCount[] }) {
	const lng = useLanguage()
	const {t} = useTranslation(lng, "genbestil")
	const tr = (key: string) => t(`list-orders.${key}`)
	return (
		<DialogV2>
			<DialogTriggerV2 asChild>
				<Button size="icon" variant="outline" tooltip={tr("tooltip")}>
					<Icons.list className="size-4" />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className="max-w-2xl">
				<DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.list className="size-4 text-primary" />
						<DialogTitleV2>{tr("title")}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className="space-y-4 px-3 pb-4">
					<DialogDescriptionV2 className="text-sm text-muted-foreground">{tr("description")}</DialogDescriptionV2>
					<p className="text-sm font-medium">{tr("amount-orders")} ({orders.length})</p>
					<div className="">
						<div className="grid grid-cols-4 font-medium text-xs text-muted-foreground px-2">
							<p>{tr("order-number")}</p>
							<p>{tr("lines-amount")}</p>
							<p>{tr("user")}</p>
							<p>{tr("inserted")}</p>
						</div>
						<Separator className="my-2" />
						<ScrollArea maxHeight="max-h-96">
							{orders.map(o => (
								<OrderComp key={o.id} order={o} />
							))}
						</ScrollArea>
					</div>
				</div>
			</DialogContentV2>
		</DialogV2>
	)
}

function OrderComp({ order }: { order: OrderWithCount }) {
	const lng = useLanguage()
	return (
		<article className="grid grid-cols-4 px-2 py-1 text-sm">
			<div>
				<Link href={`/${lng}/genbestil/${order.id}`} className="hover:underline">{order.id}</Link>
			</div>
			<p>{order.lineCount}</p>
			<p>{order.userName}</p>
			<p>{formatRelative(order.inserted, Date.now(), { locale: getDateFnsLocale(lng) })}</p>
		</article>
	)
}
