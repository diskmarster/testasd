"use client"

import { ProductHistory as ProductHistoryType } from "@/lib/database/schema/inventory"
import { Icons } from "../ui/icons"
import { formatDate, numberToDKCurrency } from "@/lib/utils"
import { Badge } from "../ui/badge"

interface Props {
	history: ProductHistoryType[]
}

export function ProductHistory({ history }: Props) {
	const logsWithDiffs = history.reverse().slice(1).map((curLog, index) => {
		const prevLog = history[index]
		const changes = {}

		for (const [key, value] of Object.entries(curLog)) {
			const skipKeys = ['id', 'inserted']
			if (skipKeys.includes(key)) continue
			if (prevLog[key] !== value) {
				changes[key] = { from: prevLog[key], to: value }
			}
		}

		return { ...curLog, changes }
	}).filter(log => Object.keys(log.changes).length > 0)

	return (
		<div className="w-full border rounded-md p-4">
			<div className='flex items-baseline gap-1.5'>
				<p>Historik</p>
				<span className='text-muted-foreground tabular-nums text-xs'>({history.length} handlinger)</span>
			</div>
			<div className="flex flex-col gap-2">
				<div className="space-y-2">
					{logsWithDiffs.map((log, i) => (
						<Log key={i} log={log} />
					))}
				</div>
			</div>
		</div>
	)
}

function Log({ log }: { log: ProductHistoryType }) {
	return (
		<div className="text-xs grid grid-cols-12">
			<div className="flex items-center gap-2 col-span-2">
				<Icons.calendarClock className="text-muted-foreground size-4" />
				<p>{formatDate(log.inserted)}</p>
			</div>
			<Badge className="capitalize w-fit h-fit place-self-start self-center" variant='gray'>{log.type}</Badge>
			<p className="self-center">{log.productSku}</p>
			<p className="self-center">{log.productBarcode}</p>
			<div className="flex flex-col col-span-3">
				<p>{log.productText1}</p>
				<p>{log.productText2}</p>
				<p>{log.productText3}</p>
			</div>
			<p>{log.productUnitName}</p>
			<p>{log.productGroupName}</p>
			<p>{numberToDKCurrency(log.productCostPrice)}</p>
			<p>{numberToDKCurrency(log.productSalesPrice)}</p>
			<p>{log.userName}</p>
		</div>
	)
}
