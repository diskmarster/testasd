import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { ModalCreateLocation } from '@/components/admin/modal-create-location'
import { TableAdminLocations } from '@/components/admin/table-company-locations'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { hasPermissionByRank } from '@/data/user.types'
import { cn } from '@/lib/utils'
import { customerService } from '@/service/customer'
import { isLocationLimitReached } from '@/service/customer.utils'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

interface Props {
	params: {
		lng: string
	}
}

export default async function Page({ params: { lng } }: Props) {
	const { t } = await serverTranslation(lng, 'organisation')
	const { session, user } = await sessionService.validate()
	if (!session) {
		signOutAction()
		return
	}

	if (!hasPermissionByRank(user.role, 'moderator')) {
		redirect('/oversigt')
	}

	const currentLocationID = await locationService.getLastVisited(user.id)
	if (!currentLocationID) {
		signOutAction()
		return
	}

	const customer = await customerService.getByID(user.customerID)
	if (!customer) {
		signOutAction()
		return
	}

	let locations = await locationService.getByCustomerID(customer.id)
	let users = await userService.getAllByCustomerID(customer.id)
	const userAccesses = await locationService.getAccessesByCustomerID(
		customer.id,
	)

	if (user.role == 'moderator') {
		const signedInUserLocations = await locationService.getAllByUserID(user.id)

		const userIDsToView = userAccesses
			.filter(acc =>
				signedInUserLocations.some(loc => loc.id == acc.locationID),
			)
			.map(acc => acc.userID)

		users = users.filter(u => userIDsToView.some(uID => u.id == uID))
		locations = locations.filter(l =>
			signedInUserLocations.some(uL => l.id == uL.id),
		)
	}

	return (
		<SiteWrapper
			title={t('location-page.title')}
			description={t('location-page.description')}
			actions={
				hasPermissionByRank(user.role, 'administrator') ? (
					<div className='flex items-center gap-4'>
						{isLocationLimitReached(customer.plan, locations.length) && (
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
								disabled={isLocationLimitReached(
									customer.plan,
									locations.length,
								)}
								className={cn(
									isLocationLimitReached(customer.plan, locations.length) &&
									'pointer-events-none',
								)}>
								<Icons.gridPlus className='size-5' />
							</Button>
						</ModalCreateLocation>
					</div>
				) : null
			}>
			<TableAdminLocations data={locations} user={user} />
		</SiteWrapper>
	)
}
