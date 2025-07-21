import { serverTranslation } from '@/app/i18n'
import { getVercelRequestID, validatePublicRequest } from '@/lib/api/request'
import { apiResponse, ApiResponse } from '@/lib/api/response'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { apiService } from '@/service/api'
import { CreateRegulation, createRegulationSchema } from '@/service/api.utils'
import { getLanguageFromRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  r: NextRequest,
): Promise<NextResponse<ApiResponse<CreateRegulation>>> {
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common', {keyPrefix: 'route-translations-regulations'})

  if (isMaintenanceMode()) {
    return apiResponse.locked(
      t('maintenance'),
      getVercelRequestID(headers()),
    )
  }

  const { customer, apikey } = await validatePublicRequest(headers())
  if (customer == null) {
    return apiResponse.unauthorized(
      t('no-access-to-resource'),
      getVercelRequestID(headers()),
    )
  }

  const payload = createRegulationSchema.safeParse(await r.json())
  if (!payload.success) {
    return apiResponse.badRequest(
      payload.error.toString(),
      getVercelRequestID(headers()),
    )
  }

  const regulate = await tryCatch(
    apiService.regulateInventory(customer.id, null, apikey.name, 'ext', payload.data, t),
  )
  if (!regulate.success) {
		const msg = `${t('error-during-regulation')} '${regulate.error.message}'`
    console.error(msg)

    return apiResponse.internal(
      msg,
      getVercelRequestID(headers()),
    )
  }

	if (!regulate.data.ok) {
		let { status, error: msg } = regulate.data
    console.error(msg)

		switch (status) {
			case 400:
				return apiResponse.badRequest(
					msg,
					getVercelRequestID(headers()),
				)

			default:
				return apiResponse.internal(
					msg,
					getVercelRequestID(headers()),
				)
		}

	}

  return apiResponse.created(payload.data)
}
