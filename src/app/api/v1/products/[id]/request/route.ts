import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { isMaintenanceMode } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { productService } from '@/service/products'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createRequestValidation = z.object({
  locationID: z.string(),
  orderAmount: z.coerce.number(),
})

export async function POST(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  const start = performance.now()

  const { session, user } = await validateRequest(headers())
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

  if (isMaintenanceMode()) {
    return sendResponse(423, {
      msg: t('route-translations-productid.maintenance'),
    })
  }

  if (session == null || user == null) {
    return sendResponse(401, {
      msg: t('route-translations-productid.no-access-to-resource'),
    })
  }

  if (!user.appAccess) {
    return sendResponse(401, {
      msg: t('route-translations-productid.no-app-access'),
    })
  }

  try {
    const productID = parseInt(id)
    const json = await request.json()

    const parsed = createRequestValidation.safeParse(json)

    if (!parsed.success) {
      const msg = t('route-translations-productid.error-request-loading-failed')
      const errorLog: NewApplicationError = {
        userID: user.id,
        customerID: user.customerID,
        type: 'endpoint',
        input: { query: { id: productID }, body: { json } },
        error: msg,
        origin: `POST api/v1/products/{id}/request`,
      }
      errorsService.create(errorLog)

      return sendResponse(400, { msg })
    }

    const location = await locationService.getByID(parsed.data.locationID)

    if (!location) {
      return sendResponse(404, {
        msg: t('route-translations-productid.error-location-notfound'),
      })
    }

    if (location.customerID != user.customerID) {
      return sendResponse(401, {
        msg: t('route-translations-productid.error-location-denied'),
      })
    }

    const product = await productService.getByID(productID)

    if (!product) {
      return sendResponse(404, {
        msg: t('route-translations-productid.error-product-notfound'),
      })
    }
    if (product.isBarred) {
      return sendResponse(400, {
        msg: t('route-translations-productid.error-product-barred'),
      })
    }

    const reorder = await inventoryService.createReorder({
      customerID: user.customerID,
      productID: productID,
      locationID: parsed.data.locationID,
      minimum: 0,
      orderAmount: parsed.data.orderAmount,
      isRequested: true,
    })

    if (!reorder) {
      return sendResponse(500, {
        msg: t('route-translations-productid.error-request-notcreated'),
      })
    }

    const end = performance.now()

    await analyticsService.createAnalytic('action', {
      actionName: 'requestProduct',
      userID: user.id,
      customerID: user.customerID,
      sessionID: session.id,
      executionTimeMS: end - start,
      platform: 'app',
    })

    return sendResponse(201, {
      msg: t('route-translations-productid.error-request-created'),
    })
  } catch (error) {
    console.error(
      t('route-translations-productid.error-request-product'),
      error,
    )

    const json = await request.json()

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: { query: { id: id }, body: { json } },
      error:
        (error as Error).message ??
        `${t('route-translations-productid.error-fetching-product')} ${id}`,
      origin: `POST api/v1/products/{id}/request`,
    }

    errorsService.create(errorLog)

    return sendResponse(500, {
      msg: t('route-translations-productid.server-error-product'),
    })
  }
}

function sendResponse(code: number, data: any) {
  return NextResponse.json(code, data)
}
