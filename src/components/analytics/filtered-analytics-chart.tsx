'use client'

import { getFilteredAnalyticsAction } from '@/app/[lng]/(site)/sys/analytics/actions'
import { AnalyticsFilterDTO } from '@/app/[lng]/(site)/sys/analytics/validation'
import { useLanguage } from '@/context/language'
import { AnalyticsPlatform } from '@/data/analytics.types'
import { ActionAnalytic } from '@/lib/database/schema/analytics'
import { Customer } from '@/lib/database/schema/customer'
import { getDateFnsLocale, tryParseInt } from '@/lib/utils'
import * as dateFns from 'date-fns'
import { Dispatch, SetStateAction, useState, useTransition } from 'react'
import { DateRange, SelectRangeEventHandler } from 'react-day-picker'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { AutoComplete } from '../ui/autocomplete'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
	ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '../ui/chart'
import { Icons } from '../ui/icons'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'

interface Props {
	defaultAnalytics: ActionAnalytic[]
	defaultFilter: AnalyticsFilterDTO
	customers: Customer[]
}

type XAxisKey = 'date' | 'action' | 'customer'

const chartConfigMap: {
	[Property in TransformerKey]: {
		label: string
		color: string
	}
} = {
	count: {
		label: 'Udførte actions',
		color: 'hsl(var(--chart-1))',
	},
	time: {
		label: 'Kørsel tid',
		color: 'hsl(var(--chart-1))',
	},
}

function createXAxisElements(
	filter: AnalyticsFilterDTO,
	analytics: ActionAnalytic[],
	customers: Customer[],
	key: XAxisKey,
): string[] {
	switch (key) {
		case 'date': {
			const today = Date.now()
			const start = dateFns.startOfDay(today)
			const end = dateFns.endOfDay(today)
			const dateRange: { from: Date; to: Date } = {
				from: dateFns.sub(start, filter.start),
				to: start,
			}

			if (filter.end) {
				dateRange.to = dateFns.add(end, filter.end)
			}

			let res: string[] = []
			for (
				let current = dateRange.from;
				!dateFns.isAfter(current, dateRange.to);
				current = dateFns.addDays(current, 1)
			) {
				res.push(dateFns.format(current, 'yyyy/MM/dd'))
			}

			return res
		}
		case 'action': {
			return Array.from(new Set(analytics.map(a => a.actionName)).values())
		}
		case 'customer': {
			return Array.from(
				new Set(
					analytics
						.filter(a => customers.some(c => c.id == a.customerID))
						.map(a => customers.find(c => c.id == a.customerID)!.company),
				).values(),
			)
		}
		default:
			return []
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
	const [xAxisElements, setXAxisElements] = useState<string[]>(
		createXAxisElements(filter, analytics, customers, xAxisKey),
	)
	const [chartConfig, setChartConfig] = useState<ChartConfig>({
		antal: chartConfigMap['count'],
	})
	const actions = new Set(analytics.map(a => a.actionName))
	const [transformerKey, setTransformerKey] = useState<TransformerKey>('count')

	const onTransformerKeyChange = (val: TransformerKey) => {
		setTransformerKey(val)
		setChartConfig({ [val]: chartConfigMap[val] })
	}

	const onXAxisKeyChange = (val: XAxisKey) => {
		setXAxisKey(val)
		setXAxisElements(createXAxisElements(filter, analytics, customers, val))
	}

	const onFilterChange: Dispatch<
		SetStateAction<AnalyticsFilterDTO>
	> = valOrUpdater => {
		let updatedFilter: AnalyticsFilterDTO
		if (typeof valOrUpdater == 'function') {
			updatedFilter = valOrUpdater(filter)
		} else {
			updatedFilter = valOrUpdater
		}

		setXAxisElements(
			createXAxisElements(updatedFilter, analytics, customers, xAxisKey),
		)
		setFilter(updatedFilter)
		startTransition(async () => {
			const res = await getFilteredAnalyticsAction(updatedFilter)

			if (res && res.data) {
				setAnalytics(res.data)
			} else if (res && res.serverError) {
				console.error('FUCK! ' + res.serverError)
			}
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Actions</CardTitle>
			</CardHeader>
			<CardContent className='flex max-h-[80vh]'>
				<AnalyticsFilterPanel
					filter={filter}
					setFilter={onFilterChange}
					customers={customers}
					actions={actions}
				/>
				<div className='flex flex-col gap-4 w-full'>
					<div className='flex gap-2 justify-end items-center w-full'>
						<div>
							<p className='text-lg font-semibold tracking-tight'>X akse</p>
							<Select
								value={xAxisKey}
								onValueChange={val => onXAxisKeyChange(val as XAxisKey)}>
								<SelectTrigger className='w-[130px]'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='date'>Dato</SelectItem>
									<SelectItem value='action'>Action</SelectItem>
									<SelectItem value='customer'>Kunde</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<p className='text-lg font-semibold tracking-tight'>Y akse</p>
							<Select
								value={transformerKey}
								onValueChange={val =>
									onTransformerKeyChange(val as TransformerKey)
								}>
								<SelectTrigger className='w-[130px]'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='count'>Antal</SelectItem>
									<SelectItem className='normal-case' value='time'>
										Tid (ms)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<ChartContainer config={chartConfig} loading={pending}>
						<BarChart
							accessibilityLayer
							data={transformAnalytics(
								transformerKey,
								xAxisKey,
								analytics,
								xAxisElements,
								customers,
							)}
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

type TransformerKey = 'count' | 'time'

function transformAnalytics(
	transformerKey: TransformerKey,
	xAxisKey: XAxisKey,
	analytics: ActionAnalytic[],
	expectedKeys: string[],
	customers: Customer[],
): {
	[Property in TransformerKey | 'label']?: number | number[] | string
}[] {
	let indexKey: keyof ActionAnalytic
	switch (xAxisKey) {
		case 'date':
			indexKey = 'inserted'
			break
		case 'action':
			indexKey = 'actionName'
			break
		case 'customer':
			indexKey = 'customerID'
			break

		default:
			return []
	}

	const actionMap = new Map<string, [number, number]>(
		expectedKeys.map(k => [k, [Infinity, -Infinity]]),
	)

	analytics.forEach(analytic => {
		const val = formatAnalyticValue(indexKey, analytic, customers)
		if (val == null) {
			return
		}

		const current = actionMap.get(val)
		actionMap.set(val, calculateDataPoint(transformerKey, current, analytic))
	})

	let entries: [string, [number, number]][] = Array.from(
		actionMap.entries(),
	).map(([k, e]) => [
		k,
		[e[0] == Infinity ? 0 : e[0], e[1] == -Infinity ? 0 : e[1]],
	])
	switch (xAxisKey) {
		case 'date':
			entries = [...entries].sort((a, b) => dateFns.compareAsc(a[0], b[0]))
			break
		case 'action':
			entries = [...entries].sort(sortChartData)
			break
	}

	return entries.map(([key, val]) => {
		const res: {
			[Property in TransformerKey | 'label']?: number | number[] | string
		} = {
			label: key,
		}
		res[transformerKey] = transformerKey == 'count' ? val[1] : val

		return res
	})
}

function formatAnalyticValue<T extends keyof ActionAnalytic>(
	indexKey: T,
	analytic: ActionAnalytic,
	customers: Customer[],
): string | null {
	const key = analytic[indexKey]

	if (key instanceof Date) {
		return dateFns.format(key, 'yyyy/MM/dd')
	} else if (typeof key == 'number') {
		switch (indexKey) {
			case 'customerID': {
				return customers.find(c => c.id == key)?.company ?? null
			}
			case 'id':
			case 'userID':
			default:
				return null
		}
	} else {
		return key
	}
}

function sortChartData<
	T extends [string, [number, number]] = [string, [number, number]],
>(a: T, b: T): number {
	const aVal = a[1]
	const aDiff = aVal[1] - aVal[0]

	const bVal = b[1]
	const bDiff = bVal[1] - bVal[0]

	return aDiff - bDiff
}

function calculateDataPoint(
	transformerKey: TransformerKey,
	current: [number, number] | undefined,
	analytic: ActionAnalytic,
): [number, number] {
	switch (transformerKey) {
		case 'count': {
			const cur = current ?? [0, 0]
			return [Math.min(0, cur[0]), Math.max(0, cur[1]) + 1]
		}

		case 'time': {
			const cur = current
			const next = Math.round(analytic.executionTimeMS)

			return cur == undefined
				? [next, next]
				: [Math.min(next, cur[0]), Math.max(next, cur[1])]
		}

		default:
			return [0, 0]
	}
}

function AnalyticsFilterPanel({
	filter,
	setFilter,
	customers: defaultCustomers,
	actions,
}: {
	filter: AnalyticsFilterDTO
	setFilter: Dispatch<SetStateAction<AnalyticsFilterDTO>>
	customers: Customer[]
	actions: Set<string>
}) {
	const [calendarPopoverOpen, setCalenderPopoverOpen] = useState(false)
	const today = Date.now()
	const start = dateFns.startOfDay(today)
	const end = dateFns.endOfDay(today)
	const dateRange: { from: Date; to: Date } = {
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
		setCustomers(
			defaultCustomers.filter(c =>
				c.company.toLowerCase().includes(value.toLowerCase()),
			),
		)
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
		onCustomerSearch('')
		setSelectedValue('')
		setFilter(prev => ({
			...prev,
			customerID: undefined,
		}))
	}

	const [selectedPlatform, setSelectedPlatform] = useState(filter.platform)
	const [searchPlatform, setSearchPlatform] = useState('')

	const strIsPlatform = (
		val: string | undefined,
	): val is AnalyticsPlatform | undefined => {
		return val === undefined || ['web', 'app'].includes(val)
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
		<div className='h-full flex flex-col gap-4'>
			<div className='flex gap-2 items-center'>
				<div className='flex flex-col w-full'>
					<p className='text-lg font-semibold tracking-tight'>Tidsperiode</p>
					<p className='text-sm '>
						{dateRange
							? `${dateFns.format(dateRange.from!, 'yyyy/MM/dd')} - ${dateFns.format(dateRange.to!, 'yyyy/MM/dd')}`
							: 'Vælg en tidsperiode'}
					</p>
				</div>
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
								start: dateRange.from
									? {
										days: dateFns.differenceInDays(
											start,
											dateFns.startOfDay(dateRange.from),
										),
									}
									: prev.start,
								end: dateRange.to
									? {
										days: dateFns.differenceInDays(
											dateFns.endOfDay(dateRange.to),
											end,
										),
									}
									: prev.end,
							}))
						}
					}}
				/>
			</div>
			<div className='w-full'>
				<p className='text-lg font-semibold tracking-tight'>Kunde</p>
				<div className='flex gap-2'>
					<AutoComplete
						items={customers.map(c => ({
							label: c.company,
							value: c.id.toString(),
						}))}
						searchValue={searchValue}
						selectedValue={selectedValue}
						onSearchValueChange={onCustomerSearch}
						onSelectedValueChange={onCustomerSelected}
						className='w-[300px]'
					/>
					<Button
						size={'icon'}
						variant={'outline'}
						disabled={filter.customerID == undefined}
						onClick={clearCustomerFilter}>
						<Icons.cross className='size-4' />
					</Button>
				</div>
			</div>
			<div className='w-full'>
				<p className='text-lg font-semibold tracking-tight'>Platform</p>
				<div className='flex gap-2'>
					<AutoComplete
						items={[
							{
								label: 'Web',
								value: 'web',
							},
							{
								label: 'App',
								value: 'app',
							},
						].filter(p =>
							p.label.toLowerCase().includes(searchPlatform.toLowerCase()),
						)}
						searchValue={searchPlatform}
						selectedValue={selectedPlatform ?? ''}
						onSearchValueChange={setSearchPlatform}
						onSelectedValueChange={onPlatformSelect}
						className='w-[300px]'
					/>
					<Button
						size={'icon'}
						variant={'outline'}
						disabled={filter.platform == undefined}
						onClick={clearPlatformSelect}>
						<Icons.cross className='size-4' />
					</Button>
				</div>
			</div>
			<div className='w-full'>
				<p className='text-lg font-semibold tracking-tight'>Action</p>
				<div className='flex gap-2'>
					<AutoComplete
						items={Array.from(actions.values())
							.map(a => ({
								label: a,
								value: a,
							}))
							.filter(p =>
								p.label.toLowerCase().includes(searchAction.toLowerCase()),
							)}
						searchValue={searchAction}
						selectedValue={selectedAction ?? ''}
						onSearchValueChange={setSearchAction}
						onSelectedValueChange={onActionSelect}
						className='w-[300px]'
					/>
					<Button
						size={'icon'}
						variant={'outline'}
						disabled={filter.actionName == undefined}
						onClick={clearActionSelect}>
						<Icons.cross className='size-4' />
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
	open: boolean
	onOpenChange: (val: boolean) => void
	dateRange: DateRange | undefined
	onSelect: SelectRangeEventHandler
}) {
	const lng = useLanguage()

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button size={'icon'} variant={'outline'}>
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
