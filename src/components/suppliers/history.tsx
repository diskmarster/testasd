"use client"

import { SupplierHisotry } from "@/lib/database/schema/suppliers"
import { Icons } from "../ui/icons";
import { useState, useTransition } from "react";
import { useLanguage } from "@/context/language";
import { useTranslation } from "@/app/i18n/client";
import { ScrollArea } from "../ui/scroll-area";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "../ui/button";

interface Props {
	logs: SupplierHisotry[]
}

type Change = { key: keyof SupplierHisotry; from: any; to: any }

interface LogsWithDiff extends SupplierHisotry {
	changes: Change[]
}

export function SupplierLogs({ logs }: Props) {
	const [pending, startTransition] = useTransition()
	const [limit, setLimit] = useState(5)
	const lng = useLanguage()
	const { t } = useTranslation(lng, "leverandører")

	const logsWithDiff: LogsWithDiff[] = logs.map((log, i) => {
		const includedKeys: (keyof SupplierHisotry)[] = [
			'name', 'country', 'idOfClient', 'contactPerson', 'phone', 'email'
		]

		const changes: Change[] = (Object.keys(log) as (keyof SupplierHisotry)[])
			.filter(key => includedKeys.includes(key))
			.map((key) => ({
				key,
				from: i > 0 ? logs[i - 1][key] : "",
				to: log[key]
			}))
			.filter(({ from, to }) => i === 0 || from !== to)

		return {
			...log,
			changes
		}
	}).reverse()

	function typeToIcon(type: SupplierHisotry['type']) {
		const classes = "text-white size-5"
		switch (type) {
			case "oprettet":
				return <Icons.squarePlus className={cn(classes, "")} />
			case "opdateret":
			default:
				return <Icons.squareSlash className={cn(classes, "")} />
		}
	}

	function typeToAction(type: SupplierHisotry['type']): string {
		return t("details-page.history.action", { context: type })
	}

	return (
		<div className="w-full space-y-4">
			<div className='flex items-center gap-1.5'>
				<p className="font-medium">{t("details-page.history.title")}</p>
				<span className='text-muted-foreground tabular-nums text-xs'>{t("details-page.history.log-count", { count: logs.length })}</span>
				{pending && (
					<Icons.spinner className="size-3 animate-spin" />
				)}
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
					{logs.length > 5 && limit != logs.length && (
						<Button className="mx-auto" onClick={() => setLimit(logs.length)}>{t("details-page.logs.see-all", { count: logs.length })}</Button>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
