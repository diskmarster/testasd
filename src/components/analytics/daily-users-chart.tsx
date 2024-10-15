'use client'

import { ActiveUser } from '@/data/analytics.types'
import { getDay } from 'date-fns'
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

const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']

export function DailyActiveUsersChart({ data }: { data: ActiveUser[] }) {
	console.log(data)

	const horizontalLineValues: number[] = ((maxData: number) => {
		if (maxData == 0) return []

		const step = maxData / 4

		const res: number[] = []

		for (let i = 0; i <= maxData; i += step) {
			res.push(i)
		}

		return res
	})(data.reduce((agg, cur) => {
		let localMax = cur.desktopUsers
		if (cur.appUsers > localMax) localMax = cur.appUsers

		if (localMax > agg) agg = localMax

		return agg
	}, 0))

	return (
		<Card className='max-w-[450px]'>
			<CardHeader>
				<CardTitle>Daglige aktive brugere de seneste 7 dage</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className='min-h-[200px] w-full'>
					<BarChart
						accessibilityLayer
						data={data}
						margin={{
							left: 12,
							right: 12,
						}}>
						<CartesianGrid vertical={false} horizontalValues={horizontalLineValues} />
						<XAxis
							dataKey='label'
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							tickFormatter={value => days[getDay(new Date(value))]}
						/>
						<YAxis
							domain={['dataMin', 'dataMax']}
							hide
						/>
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
			</CardContent>
		</Card>
	)
}
