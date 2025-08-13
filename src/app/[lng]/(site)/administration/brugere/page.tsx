import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { ModalDeleteUser } from '@/components/admin/modal-delete-user'
import { ModalEditUser } from '@/components/admin/modal-edit-user'
import { ModalInviteUser } from '@/components/admin/modal-invite-user'
import { ModalResetUserPin } from '@/components/admin/modal-reset-user-pin'
import { ModalResetUserPW } from '@/components/admin/modal-reset-user-pw'
import { ModalToggleUser } from '@/components/admin/modal-toggle-user'
import { TableAdminUsers } from '@/components/admin/table-company-users'
import { ModalQrPrint } from '@/components/auth/modal-print-qr'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { Icons } from '@/components/ui/icons'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { getUserRoles, lte } from '@/data/user.types'
import { isUserLimitReached } from '@/service/customer.utils'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, user, customer }: Props) {
	const { t } = await serverTranslation(lng, 'organisation')

	const currentLocationID = await locationService.getLastVisited(user.id)
	if (!currentLocationID) {
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
			title={t('user-page.title')}
			description={t('user-page.description')}
			actions={
				<div className='flex items-center gap-4'>
					{isUserLimitReached(
						customer.plan,
						customer.extraUsers,
						users.length,
					) && (
						<div className='flex items-center gap-2'>
							<span className='text-xs font-semibold text-destructive'>
								{t('user-page.user-limit-reached')}
							</span>
							<TooltipProvider delayDuration={250}>
								<Tooltip>
									<TooltipTrigger>
										<Icons.alert className='size-[18px] text-destructive' />
									</TooltipTrigger>
									<TooltipContent className='bg-foreground text-background'>
										<p>{t('user-page.user-upgrade-plan')}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					)}
					<ModalInviteUser
						locations={locations}
						currentLocationID={currentLocationID}
						isDisabled={isUserLimitReached(
							customer.plan,
							customer.extraUsers,
							users.length,
						)}
						userRoles={getUserRoles(lte(user.role))}
					/>
				</div>
			}>
			<TableAdminUsers data={users} user={user} />
			<ModalQrPrint />
			<ModalEditUser />
			<ModalToggleUser />
			<ModalResetUserPW />
			<ModalResetUserPin />
			<ModalDeleteUser />
		</SiteWrapper>
	)
}

export default withAuth(Page, 'lite', 'moderator')
