import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { TableAdminLocations } from '@/components/admin/table-company-locations'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { LocationPageActions } from './page-actions'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'

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
			title={t('location-page.title')}
			description={t('location-page.description')}
			actions={
				<LocationPageActions
					user={user}
					users={users}
					customer={customer}
					locationCount={locations.length}
				/>
			}>
			<TableAdminLocations data={locations} user={user} />
		</SiteWrapper>
	)
}

export default withAuth(Page, 'lite', 'moderator')
