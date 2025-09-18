import { serverTranslation } from '@/app/i18n'
import { getVercelRequestID, validatePublicRequest } from '@/lib/api/request'
import { apiResponse, ApiResponse } from '@/lib/api/response'
import { Location } from '@/lib/database/schema/customer'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { locationService } from '@/service/location'
import { getLanguageFromRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	r: NextRequest,
): Promise<NextResponse<ApiResponse<Location[]>>> {
	const lng = getLanguageFromRequest(headers())
	const { t } = await serverTranslation(lng, 'common')

	if (isMaintenanceMode()) {
		return apiResponse.locked(
			t('route-translations-regulations.maintenance'),
			getVercelRequestID(headers()),
		)
	}

	const { customer, apikey } = await validatePublicRequest(headers())
	if (customer == null) {
		return apiResponse.unauthorized(
			t('route-translations-product.no-access-to-resource'),
			getVercelRequestID(headers()),
		)
	}

	const locationResponse = await tryCatch(
		locationService.getByCustomerID(customer.id),
	)
	if (!locationResponse.success) {
		return apiResponse.internal(
			locationResponse.error.message,
			getVercelRequestID(headers()),
		)
	}

	const trimmedLocations: Location[] = locationResponse.data.map(l => ({
		id: l.id,
		customerID: l.customerID,
		name: l.name,
		inserted: l.inserted,
		updated: l.updated,
		isBarred: l.isBarred,
	}))

	return apiResponse.ok(trimmedLocations)
}
