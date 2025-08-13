import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { isMaintenanceMode } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { inventoryService } from '@/service/inventory'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
): Promise<NextResponse<unknown>> {
	const start = performance.now()

	const { session, user } = await validateRequest(headers())
	const lng = getLanguageFromRequest(headers())
	const { t } = await serverTranslation(lng, 'common')

	if (isMaintenanceMode()) {
		return NextResponse.json(
			{ msg: t('route-translations-placements.maintenance') },
			{ status: 423 },
		)
	}

	if (session == null || user == null) {
		return NextResponse.json(
			{ msg: t('route-translations-placements.no-access-to-resource') },
			{ status: 401 },
		)
	}

	if (!user.appAccess) {
		return NextResponse.json(
			{ msg: t('route-translations-placements.no-app-access') },
			{ status: 401 },
		)
	}

	try {
		const placements = await inventoryService.getActivePlacementsByID(params.id)

		const end = performance.now()

		await analyticsService.createAnalytic('action', {
			actionName: 'getPlacementsForLocation',
			userID: user.id,
			customerID: user.customerID,
			sessionID: session.id,
			executionTimeMS: end - start,
			platform: 'app',
		})

		return NextResponse.json(
			{ msg: 'Success', data: placements },
			{ status: 200 },
		)
	} catch (e) {
		console.error(
			`${t('route-translations-placements.error-getting-placement')} '${(e as Error).message}'`,
		)

		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: { id: params.id },
			error:
				(e as Error).message ??
				t('route-translations-placements.error-getting-placement-numbers'),
			origin: `GET api/v1/locations/{id}/placements`,
		}

		errorsService.create(errorLog)

		return NextResponse.json(
			{
				msg: `${t('route-translations-placements.error-getting-placement-number')}'${(e as Error).message}'`,
			},
			{ status: 500 },
		)
	}
}
