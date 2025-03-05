"use client"

import { ProductHistory as ProductHistoryType } from "@/lib/database/schema/inventory"
import { Icons } from "../ui/icons"
import { cn, formatDate } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"
import { useEffect, useState, useTransition } from "react"
import { Button } from "../ui/button"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Skeleton } from "../ui/skeleton"
import { useCustomEventListener } from "react-custom-events"
import { fetchProductHistory } from "@/app/[lng]/(site)/varer/produkter/[id]/actions"


type Change = { key: keyof ProductHistoryType; from: any; to: any }

interface Props {
	history: ProductHistoryType[]
}

interface ProductHistoryWithDiff extends ProductHistoryType {
	changes: {
		key: string
		from: any
		to: any
	}[]
}

export function ProductHistory({ history }: Props) {
	const [pending, startTransition] = useTransition()
	const [limit, setLimit] = useState(5)
	const lng = useLanguage()
	const { t } = useTranslation(lng, "produkter")

	function fetchHistory(id: number) {
		startTransition(async () => {
			const res = await fetchProductHistory({ id: id })
			if (res && res.data) {
				history = res.data
			}
		})
	}

	useCustomEventListener('FetchNewHistory', (data: { id: number }) => {
		fetchHistory(data.id)
	})

	function typeToAction(type: ProductHistoryType['type']): string {
		return t("details-page.history.action", { context: type })
	}

	function typeToIcon(type: ProductHistoryType['type']) {
		const classes = "text-muted-foreground size-5"
		switch (type) {
			case "oprettelse":
				return <Icons.packagePlus className={cn(classes, "")} />
			case "opdatering":
				return <Icons.packageCheck className={cn(classes, "")} />
			case "sp\u00E6rring":
				return <Icons.packageCross className={cn(classes, "")} />
			default:
				return <Icons.package className={cn(classes, "")} />
		}
	}

	const logsWithDiff: ProductHistoryWithDiff[] = history
		.sort((a, b) => Number(a.inserted) - Number(b.inserted))
		.map((log, index) => {
			const skippedKeys: (keyof ProductHistoryType)[] = [
				'id', 'inserted', 'type', 'userID', 'userName', 'userRole', 'customerID', 'isImport', 'productID', 'supplierID'
			]

			const changes: Change[] = (Object.keys(log) as (keyof ProductHistoryType)[])
				.filter((key) => !skippedKeys.includes(key))
				.map((key) => ({
					key,
					from: index > 0 ? history[index - 1][key] : "",
					to: log[key]
				}))
				.filter(({ from, to }) => index === 0 || from !== to)

			return { ...log, changes }
		})
		.reverse()

	return (
		<div className="w-full border rounded-md p-4 space-y-4">
			<div className='flex items-center gap-1.5'>
				<p>{t("details-page.history.title")}</p>
				<span className='text-muted-foreground tabular-nums text-xs'>{t("details-page.history.log-count", { count: history.length })}</span>
				{pending && (
					<Icons.spinner className="size-3 animate-spin" />
				)}
			</div>
			<ScrollArea maxHeight="max-h-[2000px]">
				<div className="flex flex-col gap-4">
					{logsWithDiff.map((log, index) => (
						<div key={index} className="flex gap-4 items-start">
							<div className="flex flex-col items-center">
								<div className="rounded-md bg-muted size-8 flex items-center justify-center z-10">
									{typeToIcon(log.type)}
								</div>
							</div>
							<div className="bg-card rounded-md border p-4 flex-grow space-y-4">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
									<span className="text-sm text-muted-foreground">
										{t("details-page.history.log-title", { action: typeToAction(log.type), user: log.userName })}
										{log.isImport && <span className="italic ml-1">{t("details-page.history.via-import")}</span>}
									</span>
									<p className="text-sm text-muted-foreground">{formatDate(log.inserted)}</p>
								</div>
								<div className="bg-muted p-3 rounded-md">
									<h4 className="text-sm font-medium mb-2">{t("details-page.history.changes")}</h4>
									{log.changes.length > 0 ? (
										<ul className="list-disc list-outside pl-5 text-sm text-muted-foreground">
											{log.changes.map((change, i) => (
												<li key={i}>
													{t("details-page.history.key", { context: change.key })}: {!change.from
														? <span className="italic">{t("details-page.history.log-empty")}</span>
														: `"${change.from}"`} → &quot;{change.to?.toString()}&quot;
												</li>
											))}
										</ul>
									) : (
										<p className="text-sm italic text-muted-foreground">{t("details-page.history.no-changes")}</p>
									)}
								</div>
							</div>
						</div>
					))}
					{history.length > 5 && limit != history.length && (
						<Button className="mx-auto" onClick={() => setLimit(history.length)}>{t("details-page.history.see-all", { count: history.length })}</Button>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

export function HistorySkeleton() {
	return (
		<div className="w-full border rounded-md p-4 space-y-4">
			<Skeleton className="h-9 w-32" />
			<div className="flex gap-4 items-start">
				<Skeleton className="size-8" />
				<Skeleton className="h-16 w-full" />
			</div>
			<div className="flex gap-4 items-start">
				<Skeleton className="size-8" />
				<Skeleton className="h-16 w-full" />
			</div>
		</div>
	)
}
