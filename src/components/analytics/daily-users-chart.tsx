'use client'

import { ActiveUser } from '@/data/analytics.types'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
	ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '../ui/chart'
import { Skeleton } from '../ui/skeleton'

const chartConfig = {
	desktopUsers: {
		label: 'Web brugere',
		color: 'hsl(var(--chart-1))',
	},
	appUsers: {
		label: 'App brugere',
		color: 'hsl(var(--chart-2))',
	},
} satisfies ChartConfig

export function DailyActiveUsersChart({
	data,
	title,
	tickFormatter,
	loading,
}: {
	data: ActiveUser[]
	title: string
	tickFormatter?: (val: string) => string
	loading: boolean
}) {
	const horizontalLineValues: number[] = ((maxData: number) => {
		if (maxData == 0) return []

		const step = maxData / 4

		const res: number[] = []

		for (let i = 0; i <= maxData; i += step) {
			res.push(i)
		}

		return res
	})(
		data.reduce((agg, cur) => {
			let localMax = cur.desktopUsers
			if (cur.appUsers > localMax) localMax = cur.appUsers

			if (localMax > agg) agg = localMax

			return agg
		}, 0),
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<ChartSkeleton />
				) : (
					<ChartContainer config={chartConfig} className='min-h-[200px] w-full'>
						<BarChart
							accessibilityLayer
							data={data}
							margin={{
								left: 12,
								right: 12,
							}}>
							<CartesianGrid
								vertical={false}
								horizontalValues={horizontalLineValues}
							/>
							<XAxis
								dataKey='label'
								tickLine={false}
								axisLine={false}
								tickMargin={10}
								tickFormatter={tickFormatter}
							/>
							<YAxis domain={[0, 'dataMax']} hide />
							<ChartTooltip content={<ChartTooltipContent />} />
							<ChartLegend content={<ChartLegendContent />} />
							<Bar
								type={'natural'}
								fillOpacity={0.4}
								dataKey='desktopUsers'
								fill='hsl(var(--chart-1))'
								radius={4}
							/>
							<Bar
								type={'natural'}
								fillOpacity={0.4}
								dataKey='appUsers'
								fill='hsl(var(--chart-2))'
								radius={4}
							/>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	)
}

function ChartSkeleton() {
	return (
		<div className='h-[225px] w-full flex flex-col items-center gap-4'>
			<div className='relative h-4/5 w-full flex items-end justify-evenly'>
				<Skeleton className='w-1/12 h-3/5' />
				<Skeleton className='w-1/12 h-full' />
				<Skeleton className='w-1/12 h-2/5' />
				<Skeleton className='w-1/12 h-4/5' />
				<Skeleton className='w-1/12 h-3/5' />
				<div className='absolute flex justify-between'></div>
			</div>
			<Skeleton className='w-[95%] h-[12px]' />
			<Skeleton className='w-[50%] h-[12px]' />
		</div>
	)
}
