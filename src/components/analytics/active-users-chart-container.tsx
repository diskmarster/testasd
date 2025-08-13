'use client'

import { getActiveUsersAnalyticsAction } from '@/app/[lng]/(site)/sys/analytics/actions'
import { ActiveUser } from '@/data/analytics.types'
import { getDay } from 'date-fns'
import { useEffect, useState, useTransition } from 'react'
import { DailyActiveUsersChart } from './daily-users-chart'

const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']
const months = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'Maj',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Okt',
	'Nov',
	'Dec',
]

export function ActiveUsersChartContainer({}: {}) {
	const [sevenDays, setSevenDays] = useState<ActiveUser[]>([])
	const [fourWeeks, setFourWeeks] = useState<ActiveUser[]>([])
	const [sixMonths, setSixMonths] = useState<ActiveUser[]>([])
	const [pending, startTransition] = useTransition()

	useEffect(() => {
		startTransition(async () => {
			const sevenDaysPromise = getActiveUsersAnalyticsAction({}).then(res => {
				if (res && res.data) {
					setSevenDays(res.data)
				}
			})

			const fourWeekPromise = getActiveUsersAnalyticsAction({
				start: { weeks: 3 },
				groupBy: 'week',
			}).then(res => {
				if (res && res.data) {
					setFourWeeks(res.data)
				}
			})

			const sixMonthsPromise = getActiveUsersAnalyticsAction({
				start: { months: 5 },
				groupBy: 'month',
			}).then(res => {
				if (res && res.data) {
					setSixMonths(res.data)
				}
			})

			await Promise.all([sevenDaysPromise, fourWeekPromise, sixMonthsPromise])
		})
	}, [])

	const dayFormatter = (value: string) => days[getDay(new Date(value))]
	const monthFormatter = (value: string) => months[parseInt(value) - 1]

	return (
		<div className='w-full max-h-[450px] grid grid-cols-3 gap-4'>
			<DailyActiveUsersChart
				data={sevenDays}
				title={'Aktive brugere de seneste 7 dage'}
				tickFormatter={dayFormatter}
				loading={pending}
			/>
			<DailyActiveUsersChart
				data={fourWeeks}
				title={'Aktive brugere de seneste 4 uger'}
				loading={pending}
			/>
			<DailyActiveUsersChart
				data={sixMonths}
				title={'Aktive brugere de seneste 6 måneder'}
				tickFormatter={monthFormatter}
				loading={pending}
			/>
		</div>
	)
}
