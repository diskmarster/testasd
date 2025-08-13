import { serverTranslation } from '@/app/i18n'
import { MoveBetweenLocationResponse } from '@/data/inventory.types'
import { getVercelRequestID } from '@/lib/api/request'
import { apiResponse, ApiResponse } from '@/lib/api/response'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { apiService } from '@/service/api'
import { errorsService } from '@/service/errors'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
	fromLocation: z.string().min(1),
	toLocation: z.string().min(1),
	reference: z.string().optional(),
	items: z
		.object({
			productID: z.coerce.number(),
			sku: z.string(),
			fromPlacementID: z.coerce.number(),
			fromBatchID: z.coerce.number(),
			toPlacementID: z.coerce.number().optional(),
			toBatchID: z.coerce.number().optional(),
			quantity: z.coerce.number(),
		})
		.array(),
})

export async function POST(
	r: NextRequest,
): Promise<NextResponse<ApiResponse<MoveBetweenLocationResponse>>> {
	const start = performance.now()
	const { session, user } = await validateRequest(headers())
	const lng = getLanguageFromRequest(headers())
	const { t } = await serverTranslation(lng, 'common')

	if (isMaintenanceMode()) {
		return apiResponse.locked(
			t('route-translations-regulations.maintenance'),
			getVercelRequestID(headers()),
		)
	}

	if (session == null || user == null) {
		return apiResponse.unauthorized(
			t('route-translations-product.no-access-to-resource'),
			getVercelRequestID(headers()),
		)
	}

	if (!user.appAccess) {
		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error: t('route-translations-product.no-access-to-resource'),
			origin: 'POST /api/v1/regulations/move/locations',
		}
		errorsService.create(errorLog)

		return apiResponse.unauthorized(
			t('route-translations-product.no-access-to-resource'),
			getVercelRequestID(headers()),
		)
	}

	const payload = schema.safeParse(await r.json())
	if (!payload.success) {
		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: payload.data,
			error: payload.error.toString(),
			origin: 'POST /api/v1/regulations/move/locations',
		}
		errorsService.create(errorLog)

		return apiResponse.badRequest(
			payload.error.toString(),
			getVercelRequestID(headers()),
		)
	}

	const move = await tryCatch(
		apiService.moveInventoryBetweenLocations(
			user.customerID,
			user.id,
			null,
			'app',
			payload.data,
			lng,
		),
	)
	if (!move.success) {
		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: payload.data,
			error: move.error.message,
			origin: 'POST /api/v1/regulations/move/locations',
		}
		errorsService.create(errorLog)

		return apiResponse.internal(
			move.error.message,
			getVercelRequestID(headers()),
		)
	}

	const end = performance.now()

	await analyticsService.createAnalytic('action', {
		actionName: 'moveInventoryBetweenLocations',
		userID: user.id,
		customerID: user.customerID,
		sessionID: session.id,
		executionTimeMS: end - start,
		platform: 'app',
	})

	return apiResponse.created(move.data)
}
