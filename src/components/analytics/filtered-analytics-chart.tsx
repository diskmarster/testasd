'use client'

import { ActionAnalytic } from "@/lib/database/schema/analytics"
import * as dateFns from "date-fns"
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Calendar } from "../ui/calendar"
import { DateRange, SelectRangeEventHandler } from "react-day-picker"
import { AnalyticsFilterDTO } from "@/app/[lng]/(site)/sys/analytics/validation"
import { getFilteredAnalyticsAction } from "@/app/[lng]/(site)/sys/analytics/actions"
import { getDateFnsLocale, tryParseInt } from "@/lib/utils"
import { useLanguage } from "@/context/language"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import { AutoComplete } from "../ui/autocomplete"
import { Customer } from "@/lib/database/schema/customer"
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select"
import { AnalyticsPlatform } from "@/data/analytics.types"

interface Props {
	defaultAnalytics: ActionAnalytic[],
	defaultFilter: AnalyticsFilterDTO,
	customers: Customer[],
}

type XAxisKey = 'date' | 'action'

function filterToXAxisElements(filter: AnalyticsFilterDTO, analytics: ActionAnalytic[], key: XAxisKey): string[] {
	switch (key) {
		case 'date': {
			const today = Date.now()
			const start = dateFns.startOfDay(today)
			const end = dateFns.endOfDay(today)
			const dateRange: { from: Date, to: Date } = {
				from: dateFns.sub(start, filter.start),
				to: start,
			}

			if (filter.end) {
				dateRange.to = dateFns.add(end, filter.end)
			}

			let res: string[] = []
			for (let current = dateRange.from; !dateFns.isAfter(current, dateRange.to); current = dateFns.addDays(current, 1)) {
				res.push(dateFns.format(current, "yyyy/MM/dd"))
			}

			return res
		}
		case 'action': {
			return Array.from(new Set(analytics.map(a => a.actionName)).values())
		}
		default: return []
	}
}

export function FilteredAnalyticsChart({
	defaultAnalytics,
	defaultFilter,
	customers,
}: Props) {
	const [pending, startTransition] = useTransition()
	const [analytics, setAnalytics] = useState(defaultAnalytics)
	const [filter, setFilter] = useState(defaultFilter)
	const [xAxisKey, setXAxisKey] = useState<XAxisKey>('date')
	const [xAxisElements, setXAxisElements] = useState<string[]>(filterToXAxisElements(filter, analytics, xAxisKey))
	const actions = new Set(analytics.map(a => a.actionName))
	const transformerKey: TransformerKey = 'actions'

	const onFilterChange: Dispatch<SetStateAction<AnalyticsFilterDTO>> = (valOrUpdater) => {
		let updatedFilter: AnalyticsFilterDTO
		if (typeof valOrUpdater == 'function') {
			updatedFilter = valOrUpdater(filter)
		} else {
			updatedFilter = valOrUpdater
		}

		setXAxisElements(filterToXAxisElements(updatedFilter, analytics, xAxisKey))
		setFilter(updatedFilter)
		startTransition(async () => {
			const res = await getFilteredAnalyticsAction(updatedFilter)

			if (res && res.data) {
				setAnalytics(res.data)
			} else if (res && res.serverError) {
				console.error("FUCK! " + res.serverError)
			}
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Actions</CardTitle>
			</CardHeader>
			<CardContent className="flex h-[80vh]">
				<AnalyticsFilterPanel filter={filter} setFilter={onFilterChange} customers={customers} actions={actions} />
				<div className="flex flex-col gap-1 w-full">
					<div className="flex gap-2 justify-content align-items w-full">
						<p className="text-lg font-semibold tracking-tight text-center">X akse</p>
						<Select value={xAxisKey} onValueChange={(val) => setXAxisKey(val as XAxisKey)}>
							<SelectTrigger className="w-[130px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="date">Dato</SelectItem>
								<SelectItem value="action">Action</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<ChartContainer config={{
						actions: {
							label: 'Udførte actions',
							color: 'hsl(var(--chart-1))'
						},
						}}
						loading={pending}
						>
						<BarChart
							accessibilityLayer
							data={transformAnalytics(transformerKey, xAxisKey, analytics, xAxisElements)}
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
							<YAxis domain={[0, 'auto']} tickLine={false} axisLine={false} />
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
				</div>
			</CardContent>
		</Card>
	)
}

type TransformerKey = 'actions'

function transformAnalytics(transformerKey: TransformerKey, xAxisKey: XAxisKey, analytics: ActionAnalytic[], expectedKeys: string[]): {
	[Property in (TransformerKey | 'label')]?: number | string
}[] {
	let indexKey: keyof ActionAnalytic
	switch (xAxisKey) {
		case 'date':
			indexKey = 'inserted'
			break
		case 'action':
			indexKey = 'actionName'
			break

		default:
			return []
	}

	const actionMap = new Map<string, number>(expectedKeys.map(k => [k, 0]))
	analytics.forEach(analytic => {
		const val = analytic[indexKey]

		if (val instanceof Date) {
			const formattedDate = dateFns.format(analytic.inserted, "yyyy/MM/dd")
			const current = actionMap.get(formattedDate) ?? 0
			actionMap.set(formattedDate, current + 1)
		} else {
			const current = actionMap.get(val) ?? 0
			actionMap.set(val, current + 1)
		}
	})

	let entries = Array.from(actionMap.entries()) 
	switch (xAxisKey) {
		case "date":
		entries = [...entries].sort((a, b) => dateFns.compareDesc(a[0], b[0]))
		break
		case "action":
		entries = [...entries].sort((a, b) => a[1] - b[1])
		break
	}

	return entries.map(([key, val]) => {
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
	customers: defaultCustomers,
	actions,
}: {
	filter: AnalyticsFilterDTO,
	setFilter: Dispatch<SetStateAction<AnalyticsFilterDTO>>,
	customers: Customer[],
	actions: Set<string>,
}) {
	const [calendarPopoverOpen, setCalenderPopoverOpen] = useState(false)
	const today = Date.now()
	const start = dateFns.startOfDay(today)
	const end = dateFns.endOfDay(today)
	const dateRange: { from: Date, to: Date } = {
		from: dateFns.sub(start, filter.start),
		to: end,
	}

	if (filter.end) {
		dateRange.to = dateFns.add(end, filter.end)
	}

	const [customers, setCustomers] = useState(defaultCustomers)
	const [searchValue, setSearchValue] = useState<string>('')
	const [selectedValue, setSelectedValue] = useState<string>('')

	const onCustomerSearch = (value: string) => {
		setSearchValue(value)
		setCustomers(defaultCustomers.filter(c => c.company.toLowerCase().includes(value.toLowerCase())))
	}

	const onCustomerSelected = (value: string) => {
		const selectedID = tryParseInt(value)
		if (selectedID == undefined) return

		setSelectedValue(value)
		setFilter(prev => ({
			...prev,
			customerID: selectedID,
		}))
	}

	const clearCustomerFilter = () => {
		onCustomerSearch("")
		setSelectedValue("")
		setFilter(prev => ({
			...prev,
			customerID: undefined,
		}))
	}

	const [selectedPlatform, setSelectedPlatform] = useState(filter.platform)
	const [searchPlatform, setSearchPlatform] = useState('')

	const strIsPlatform = (val: string | undefined): val is AnalyticsPlatform | undefined => {
		return val === undefined || ["web", "app"].includes(val)
	}

	const onPlatformSelect = (val: string) => {
		if (strIsPlatform(val)) {
			setSelectedPlatform(val)
			setFilter(prev => ({
				...prev,
				platform: val,
			}))
		}
	}

	const clearPlatformSelect = () => {
		setSearchPlatform('')
		setSelectedPlatform(undefined)
		setFilter(prev => ({
			...prev,
			platform: undefined,
		}))
	}

	const [selectedAction, setSelectedAction] = useState(filter.actionName)
	const [searchAction, setSearchAction] = useState('')

	const onActionSelect = (val: string) => {
		setSelectedAction(val)
		setFilter(prev => ({
			...prev,
			actionName: val,
		}))
	}

	const clearActionSelect = () => {
		setSearchAction('')
		setSelectedAction(undefined)
		setFilter(prev => ({
			...prev,
			actionName: undefined,
		}))
	}

	return (
		<div className="h-full flex flex-col gap-4">
			<div className='flex gap-2 items-center'>
				<CalendarPopover
					open={calendarPopoverOpen}
					onOpenChange={setCalenderPopoverOpen}
					dateRange={dateRange}
					onSelect={dateRange => {
						if (dateRange == undefined) {
							setFilter(prev => ({
								...prev,
								start: {},
								end: undefined,
							}))
						} else {
							setFilter(prev => ({
								...prev,
								start: dateRange.from ? { days: dateFns.differenceInDays(start, dateFns.startOfDay(dateRange.from)) } : prev.start,
								end: dateRange.to ? { days: dateFns.differenceInDays(dateFns.endOfDay(dateRange.to), end) } : prev.end,
							}))
						}
					}}
				/>
				<div className="flex flex-col">
					<p className="text-lg font-semibold tracking-tight">Tidsperiode</p>
					<p className='text-sm '>
						{dateRange
							? `${dateFns.format(dateRange.from!, 'yyyy/MM/dd')} - ${dateFns.format(dateRange.to!, 'yyyy/MM/dd')}`
							: 'Vælg en tidsperiode'
						}
					</p>
				</div>
			</div>
			<div>
				<p className="text-lg font-semibold tracking-tight">Kunde</p>
				<div className="flex gap-2">
					<AutoComplete
						items={customers.map(c => ({
							label: c.company,
							value: c.id.toString(),
						}))}
						searchValue={searchValue}
						selectedValue={selectedValue}
						onSearchValueChange={onCustomerSearch}
						onSelectedValueChange={onCustomerSelected}
					/>
					<Button
						size={'icon'}
						variant={'outline'}
						disabled={filter.customerID == undefined}
						onClick={clearCustomerFilter}>
						<Icons.cross className="size-4" />
					</Button>
				</div>
			</div>
			<div>
				<p className="text-lg font-semibold tracking-tight">Platform</p>
				<div className="flex gap-2">
					<AutoComplete
						items={[
							{
								label: "Web",
								value: "web",
							}, {
								label: "App",
								value: "app",
							}
						].filter(p => p.label.toLowerCase().includes(searchPlatform.toLowerCase()))}
						searchValue={searchPlatform}
						selectedValue={selectedPlatform ?? ''}
						onSearchValueChange={setSearchPlatform}
						onSelectedValueChange={onPlatformSelect}
					/>
					<Button
						size={'icon'}
						variant={'outline'}
						disabled={filter.platform == undefined}
						onClick={clearPlatformSelect}>
						<Icons.cross className="size-4" />
					</Button>
				</div>
			</div>
			<div>
				<p className="text-lg font-semibold tracking-tight">Action</p>
				<div className="flex gap-2">
					<AutoComplete
						items={ Array.from(actions.values()).map(a => ({
								label: a,
								value: a,
							})).filter(p => p.label.toLowerCase().includes(searchAction.toLowerCase()))}
						searchValue={searchAction}
						selectedValue={selectedAction ?? ''}
						onSearchValueChange={setSearchAction}
						onSelectedValueChange={onActionSelect}
					/>
					<Button
						size={'icon'}
						variant={'outline'}
						disabled={filter.actionName == undefined}
						onClick={clearActionSelect}>
						<Icons.cross className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}

function CalendarPopover({
	open,
	onOpenChange,
	dateRange,
	onSelect,
}: {
	open: boolean,
	onOpenChange: (val: boolean) => void,
	dateRange: DateRange | undefined,
	onSelect: SelectRangeEventHandler,
}) {
	const lng = useLanguage()

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button
					size={'icon'}
					variant={'outline'}>
					<Icons.calendar className='size-4' />
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Calendar
					mode='range'
					locale={getDateFnsLocale(lng)}
					selected={dateRange}
					onSelect={onSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	)
}
