import { serverTranslation } from '@/app/i18n'
import { hasPermissionByRank } from '@/data/user.types'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { errorsService } from '@/service/errors'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
	const { session, user } = await validateRequest(headers())
	const lng = getLanguageFromRequest(headers())
	const { t } = await serverTranslation(lng, 'common')

	if (session == null || user == null) {
		return NextResponse.json(
			{ msg: t('route-translations-users.no-access-to-resource') },
			{ status: 401 },
		)
	}

	if (!user.appAccess) {
		return NextResponse.json(
			{ msg: t('route-translations-users.no-app-access') },
			{ status: 401 },
		)
	}

	if (!hasPermissionByRank(user.role, 'moderator')) {
		return NextResponse.json(
			{ msg: t('route-translations-users.no-access-to-resource') },
			{ status: 401 },
		)
	}

	try {
		let users = await userService.getAllByCustomerID(user.customerID)
		const userAccesses = await locationService.getAccessesByCustomerID(
			user.customerID,
		)

		if (user.role == 'moderator') {
			const signedInUserLocations = await locationService.getAllByUserID(
				user.id,
			)

			const userIDsToView = userAccesses
				.filter(acc =>
					signedInUserLocations.some(loc => loc.id == acc.locationID),
				)
				.map(acc => acc.userID)

			users = users.filter(u => userIDsToView.some(uID => u.id == uID))
		}

		return NextResponse.json(
			{
				msg: 'Success',
				data: users.map(u => ({
					id: u.id,
					name: u.name,
				})),
			},
			{
				status: 200,
			},
		)
	} catch (e) {
		console.error(
			`${t('route-translations-users.error-getting-userinfo')} '${(e as Error).message}'`,
		)

		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error:
				(e as Error).message ??
				t('route-translations-users.couldnt-get-userinfo'),
			origin: `GET api/v1/users`,
		}

		errorsService.create(errorLog)

		return NextResponse.json(
			{
				msg: `${t('route-translations-users.error-occured-getting-userinfo')} '${(e as Error).message}'`,
			},
			{ status: 500 },
		)
	}
}
