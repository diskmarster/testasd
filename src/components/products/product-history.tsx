"use client"

import { ProductHistory as ProductHistoryType } from "@/lib/database/schema/inventory"
import { Icons } from "../ui/icons"
import { cn, formatDate } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"
import { useState } from "react"
import { Button } from "../ui/button"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Skeleton } from "../ui/skeleton"

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
	const [limit, setLimit] = useState(5)
	const lng = useLanguage()
	const { t } = useTranslation(lng, "produkter")

	function typeToAction(type: ProductHistoryType['type']): string {
		return t("details-page.history.action", { context: type })
	}

	function typeToIcon(type: ProductHistoryType['type']) {
		const classes = "text-white size-5"
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
			const changes: { key: string; from: any; to: any }[] = [];
			const skippedKeys = ['id', 'inserted', 'type', 'userID', 'userName', 'userRole', 'customerID', 'isImport', 'productID'];

			if (index > 0) {
				const previousLog = history[index - 1];

				for (const key of Object.keys(log) as (keyof ProductHistoryType)[]) {
					if (skippedKeys.includes(key)) continue;

					const curValue = log[key];
					const preValue = previousLog[key];

					if (curValue !== preValue) {
						changes.push({
							key,
							from: preValue,
							to: curValue,
						});
					}
				}
			} else {
				for (const key of Object.keys(log) as (keyof ProductHistoryType)[]) {
					if (skippedKeys.includes(key)) continue;

					const curValue = log[key];

					changes.push({
						key,
						from: "",
						to: curValue,
					});
				}
			}

			return {
				...log,
				changes,
			};
		})
		.reverse()
		.slice(0, limit);

	return (
		<div className="w-full border rounded-md p-4 space-y-4">
			<div className='flex items-baseline gap-1.5'>
				<p>{t("details-page.history.title")}</p>
				<span className='text-muted-foreground tabular-nums text-xs'>{t("details-page.history.log-count", { count: history.length })}</span>
			</div>
			<ScrollArea maxHeight="max-h-[2000px]">
				<div className="flex flex-col gap-4">
					{logsWithDiff.map((log, index) => (
						<div key={index} className="flex gap-4 items-start">
							<div className="flex flex-col items-center">
								<div className="rounded-md bg-primary size-8 flex items-center justify-center z-10">
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
													{t("details-page.history.key", { context: change.key })}: {change.from.toString() == ""
														? <span className="italic">{t("details-page.history.log-empty")}</span>
														: `"${change.from}"`} → &quot;{change.to.toString()}&quot;
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
