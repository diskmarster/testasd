"use client"

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Icons } from '../ui/icons'
import { hideAnnouncementAction } from '@/app/actions'
import { Announcement } from '@/lib/database/schema/announcements'
import { useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'

interface Props {
	announcement: Announcement,
	dismissible?: boolean
	className?: string
}

const variants = {
	info: {
		container: 'bg-blue-50 border-blue-200 text-blue-900',
		icon: Icons.info,
		iconColor: 'text-blue-600',
		butten: 'text-blue-600 hover:text-blue-700',
	},
	warning: {
		container: 'bg-amber-50 border-amber-200 text-amber-900',
		icon: Icons.alert,
		iconColor: 'text-amber-600',
		butten: 'text-amber-600 hover:text-amber-700',
	},
	success: {
		container: 'bg-green-50 border-green-200 text-green-900',
		icon: Icons.circleCheck,
		iconColor: 'text-green-600',
		butten: 'text-green-600 hover:text-green-700',
	},
	error: {
		container: 'bg-red-50 border-red-200 text-red-900',
		icon: Icons.triangleAlert,
		iconColor: 'text-red-600',
		butten: 'text-red-600 hover:text-red-700',
	},
}

export default function FlashMessage({
	announcement,
	dismissible = true,
	className,
}: Props) {
	const variant = variants[announcement.type]
	const Icon = variant.icon

	const [_pending, startTransition] = useTransition()
	const [isHidden, setIsHidden] = useState(false)

	const pathname = usePathname()

	function onHide() {
		startTransition(async () => {
			await hideAnnouncementAction({
				announcementID: announcement.id,
				pathname: pathname
			})
			setIsHidden(true)
		})
	}

	if (isHidden) return null

	return (
		<div className={cn('w-full border-b px-3 transition-all duration-300 ease-in-out', variant.container, className)}>
			<div className='container mx-auto py-3'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex items-center gap-3 min-w-0 flex-1'>
						<Icon className={cn('h-4 w-4 flex-shrink-0', variant.iconColor)} />
						<p className='text-sm font-medium leading-relaxed truncate sm:whitespace-normal'>{announcement.message}</p>
					</div>

					{dismissible && (
						<Button
							onClick={onHide}
							variant='ghost'
							size='sm'
							className={cn(
								'h-6 w-6 p-0 hover:bg-black/10 flex-shrink-0', variant.butten)}
						>
							<Icons.cross className='h-3 w-3' />
							<span className='sr-only'>Dismiss</span>
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
