'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { getChipCount } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'

export function NavChip({
	chipLabel,
	localeKey,
}: {
	chipLabel: string
	localeKey: string
}) {
	const [count, setCount] = useState<number>()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'common')

	useCustomEventListener('UpdateNavBadges', () => {
		setCount(0)
		getChipCount(chipLabel).then(c => setCount(c))
	})

	useEffect(() => {
		if (!count) {
			getChipCount(chipLabel).then(c => setCount(c))
		}
	}, [])

	if (!count || count == 0) return null

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className='bg-red-500/25 border-red-500/50 tabular-nums rounded text-xs py-0.5 px-1 text-red-500 border font-semibold'>
						{count}
					</span>
				</TooltipTrigger>
				<TooltipContent className='bg-foreground text-background'>
					{t(localeKey, { context: 'count', count })}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
