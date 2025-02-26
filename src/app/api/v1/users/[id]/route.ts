import { serverTranslation } from '@/app/i18n'
import { hasPermissionByRank } from '@/data/user.types'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { tryParseInt } from '@/lib/utils'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } },
): Promise<NextResponse<{ msg: string; data?: any }>> {
	const start = performance.now()

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

	if (
		!hasPermissionByRank(user.role, 'moderator') &&
		user.id != tryParseInt(params.id)
	) {
		return NextResponse.json(
			{ msg: t('route-translations-users.no-access-to-resource') },
			{ status: 401 },
		)
	}

	const userID = tryParseInt(params.id)

	if (userID == undefined) {
		return NextResponse.json(
			{ msg: t('route-translations-users.invalid-user-id') },
			{ status: 400 },
		)
	}

	try {
		const userInfo = await userService.getUserInfoByUserID(userID)
		if (userInfo == undefined) {
			return NextResponse.json(
				{ msg: t('route-translations-users.invalid-user-id') },
				{ status: 400 },
			)
		}

		const userLocations = await locationService.getAllByUserID(userID)

		if (!hasPermissionByRank(user.role, 'administrator') && user.id != userID) {
			const signedInUserLocations = await locationService.getAllByUserID(
				user.id,
			)

			const shareLocation = userLocations.some(uLoc =>
				signedInUserLocations.some(sLoc => sLoc.id == uLoc.id),
			)

			if (!shareLocation) {
				return NextResponse.json(
					{ msg: t('route-translations-users.no-access-to-resource') },
					{ status: 401 },
				)
			}
		}

		const end = performance.now()

		await analyticsService.createAnalytic('action', {
			actionName: 'getUserInfoByID',
			userID: user.id,
			customerID: user.customerID,
			sessionID: session.id,
			executionTimeMS: end - start,
			platform: 'app',
		})

		return NextResponse.json(
			{
				msg: 'Success',
				data: {
					id: userInfo.id,
					name: userInfo.name,
					hasNfc: userInfo.hasNfc,
				},
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
			origin: `GET api/v1/users/${params.id}`,
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
