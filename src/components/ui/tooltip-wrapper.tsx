'use client'

import { PropsWithChildren, ReactNode } from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

interface Props extends PropsWithChildren {
	tooltip: string | ReactNode
}

export function TooltipWrapper({ tooltip, children }: Props) {
	const tooltipComp = typeof tooltip == 'string' ? <p>{tooltip}</p> : tooltip

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent className='bg-foreground text-background'>
					{tooltipComp}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
