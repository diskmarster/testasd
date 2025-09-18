'use client'

import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from '../ui/button'
import { Icons } from '../ui/icons'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'

export function NavFAQ() {
	const lng = useLanguage()
	return (
		<TooltipProvider delayDuration={250}>
			<Tooltip>
				<TooltipTrigger>
					<Link
						href={`/${lng}/faq`}
						target='_blank'
						className={cn(
							'',
							buttonVariants({ variant: 'outline', size: 'icon' }),
						)}>
						<Icons.help className='size-4' />
					</Link>
				</TooltipTrigger>
				<TooltipContent className='bg-foreground text-background'>
					<p>Gå til F.A.Q. side</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
