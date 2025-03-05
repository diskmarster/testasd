'use client'

import { useTranslation } from '@/app/i18n/client'
import { ModalCreateLocation } from '@/components/admin/modal-create-location'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLanguage } from '@/context/language'
import { hasPermissionByRank } from '@/data/user.types'
import { User, UserNoHash } from '@/lib/database/schema/auth'
import { Customer } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { isLocationLimitReached } from '@/service/customer.utils'

interface Props {
	user: User
	users: UserNoHash[]
	customer: Customer
	locationCount: number
}

export function LocationPageActions({
	user,
	users,
	customer,
	locationCount,
}: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'organisation')

	return hasPermissionByRank(user.role, 'moderator') ? (
		<div className='flex items-center gap-4'>
			{isLocationLimitReached(customer.plan, locationCount) && (
				<div className='flex items-center gap-2'>
					<span className='text-xs font-semibold text-destructive'>
						{t('location-page.location-limit-reached')}
					</span>
					<TooltipProvider delayDuration={250}>
						<Tooltip>
							<TooltipTrigger>
								<Icons.alert className='size-[18px] text-destructive' />
							</TooltipTrigger>
							<TooltipContent className='bg-foreground text-background'>
								<p>{t('location-page.location-upgrade-plan')}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			)}
			<ModalCreateLocation user={user} users={users}>
				<Button
					size='icon'
					variant='outline'
					disabled={isLocationLimitReached(customer.plan, locationCount)}
					className={cn(
						isLocationLimitReached(customer.plan, locationCount) &&
						'pointer-events-none',
					)}
					tooltip={t('modal-create-location.tooltip')}>
					<Icons.gridPlus className='size-5' />
				</Button>
			</ModalCreateLocation>
		</div>
	) : null
}
