import { serverTranslation } from '@/app/i18n'
import { MoveBetweenLocationResponse } from '@/data/inventory.types'
import { getVercelRequestID, validatePublicRequest } from '@/lib/api/request'
import { apiResponse, ApiResponse } from '@/lib/api/response'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { apiService } from '@/service/api'
import { getLanguageFromRequest } from '@/service/user.utils'
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

  const payload = schema.safeParse(await r.json())
  if (!payload.success) {
    return apiResponse.badRequest(
      payload.error.toString(),
      getVercelRequestID(headers()),
    )
  }

  const move = await tryCatch(
    apiService.moveInventoryBetweenLocations(
      customer.id,
      null,
      apikey.name,
      'ext',
      payload.data,
      lng,
    ),
  )
  if (!move.success) {
    return apiResponse.internal(
      move.error.message,
      getVercelRequestID(headers()),
    )
  }

  return apiResponse.created(move.data)
}
