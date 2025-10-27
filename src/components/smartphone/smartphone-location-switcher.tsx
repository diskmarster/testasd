'use client'

import { changeLocationAction } from '@/app/actions'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import {
	Location,
	LocationID,
	LocationWithPrimary,
} from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { DrawerList, Option } from './smartphone-drawer-list'

function LocationOption({
	option,
	selected,
}: {
	option: Option
	selected: boolean
}) {
	return (
		<div
			className={cn(
				'px-3 py-2 min-h-14 flex flex-col justify-center',
				selected && 'bg-muted',
			)}>
			<p className='font-medium text-sm line-clamp-1'>{option.label}</p>
			{option.sub && (
				<div className='flex items-center gap-1'>
					<p className='text-muted-foreground line-clamp-1 text-sm'>
						{option.sub}
					</p>
					<Icons.star className='fill-warning text-warning size-3' />
				</div>
			)}
		</div>
	)
}

export function SmartphoneLocationSwitcher({
	location,
	locations,
}: {
	location: Location
	locations: LocationWithPrimary[]
}) {
	const [pending, startTransition] = useTransition()
	const router = useRouter()
	const pathname = usePathname()

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')

	const locationOptions = locations.map(l => ({
		label: l.name,
		sub: l.isPrimary ? t('locations.primary') : '',
		value: l.id,
	}))

	function changeLocation(locationID: LocationID) {
		startTransition(async () => {
			await changeLocationAction({
				locationID: locationID,
				revalidatePath: pathname,
			})
			router.refresh()
		})
	}

	return (
		<div className='border shadow-sm py-2 px-3 rounded-lg mb-2 flex items-center justify-between'>
			<div className='flex items-start justify-between'>
				<div className={cn(location.isBarred && 'space-y-0.5')}>
					<p className='font-medium line-clamp-1 text-sm text-muted-foreground'>
						{t('locations.current')}
					</p>
					<div className='flex items-center gap-2'>
						<p className='line-clamp-1'>{location.name}</p>
						{location.isBarred && (
							<Badge variant='destructive'>{t('locations.isBarred')}</Badge>
						)}
					</div>
				</div>
			</div>
			<DrawerList
				options={locationOptions}
				option={LocationOption}
				selected={location.id}
				onSelect={opt => changeLocation(opt.value)}>
				<Button disabled={pending} size='icon' variant='outline'>
					{pending ? (
						<Icons.spinner className='size-4 animate-spin' />
					) : (
						<Icons.arrowLeftRight className='size-4 rotate-90' />
					)}
				</Button>
			</DrawerList>
		</div>
	)
}
