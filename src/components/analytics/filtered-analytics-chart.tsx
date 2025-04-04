'use client'

import { ActionAnalytic } from "@/lib/database/schema/analytics"
import * as dateFns from "date-fns"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { AnalyticsFilter } from "@/data/analytics.types"
import { Calendar } from "../ui/calendar"
import { DateRange } from "react-day-picker"
import { AnalyticsFilterDTO } from "@/app/[lng]/(site)/sys/analytics/validation"

interface Props {
	defaultAnalytics: ActionAnalytic[],
	defaultFilter: AnalyticsFilterDTO,
}

export function FilteredAnalyticsChart({
	defaultAnalytics,
	defaultFilter,
}: Props) {
	const [analytics, setAnalytics] = useState(defaultAnalytics)
	const [filter, setFilter] = useState(defaultFilter)
	const transformerKey: TransformerKey = 'actions'

	useEffect(() => {
		console.log({filter})
	}, [filter])

	return (
		<Card>
			<CardHeader>
				<CardTitle>Actions</CardTitle>
			</CardHeader>
			<CardContent className="flex h-[80vh]">
				<AnalyticsFilterPanel filter={filter} setFilter={setFilter} />
				<ChartContainer config={{
					actions: {
						label: 'Actions',
						color: 'hsl(var(--chart-1))'
					}
				}}>
					<BarChart
						accessibilityLayer
						data={transformAnalytics(transformerKey, analytics)}
						margin={{
							left: 12,
							right: 12,
						}}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey='label'
							tickLine={false}
							axisLine={false}
							tickMargin={10}
						/>
						<YAxis domain={[0, 'dataMax']} tickLine={false} axisLine={false} />
						<ChartTooltip content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar
							type={'natural'}
							fillOpacity={0.4}
							dataKey={transformerKey}
							fill='hsl(var(--chart-1))'
							radius={4}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}

type TransformerKey = 'actions'

function transformAnalytics(transformerKey: TransformerKey, analytics: ActionAnalytic[]): {
	[Property in (TransformerKey | 'label')]?: number | string
}[] {

	let indexKey: keyof ActionAnalytic
	switch (transformerKey) {
		case 'actions':
			indexKey = 'actionName'
			break

		default:
			return []
	}

	const actionMap = new Map<string, number>()
	analytics.forEach(analytic => {
		const formattedDate = dateFns.format(analytic.inserted, "yyyy-MM-dd")
		const current = actionMap.get(formattedDate) ?? 0
		actionMap.set(formattedDate, current + 1)
	})

	return Array.from(actionMap.entries()).map(([key, val]) => {
		const res: { [Property in (TransformerKey | 'label')]?: number | string } = {
			label: key
		}
		res[transformerKey] = val

		return res
	})
}

function AnalyticsFilterPanel({
	filter,
	setFilter,
}: {
	filter: AnalyticsFilterDTO,
	setFilter: Dispatch<SetStateAction<AnalyticsFilterDTO>>,
}) {
	const today = dateFns.startOfDay(Date.now())
	const dateRange: DateRange | undefined = filter ? {
		from: dateFns.sub(today, filter.start),
		to: today,
	} : undefined

	if (dateRange && filter?.end) {
		dateRange.to = dateFns.add(today, filter.end)
	}

	return (
		<div className="h-full flex flex-col">
			<p>Tidsperiode</p>
			<Calendar
				mode='range'
				selected={dateRange}
				onSelect={dateRange => {
					setFilter(prev => ({
						...prev,
						start: dateRange?.from ? {days: dateFns.differenceInDays(today, dateRange.from)} : prev.start,
						end: dateRange?.to ? {days: dateFns.differenceInDays(dateRange.to, today)} : prev.end,
					}))
				}}
				initialFocus
			/>
		</div>
	)
}
