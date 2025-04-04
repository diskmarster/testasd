import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { productService } from '@/service/products'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
): Promise<NextResponse<unknown>> {
  const start = performance.now()

  const { session, user } = await validateRequest(headers())
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

  if (isMaintenanceMode()) {
    return NextResponse.json(
      { msg: t('route-translations-product.maintenance') },
      { status: 423 },
    )
  }

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: t('route-translations-product.no-access-to-resource') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-product.no-app-access') },
      { status: 401 },
    )
  }

  const productRes = await tryCatch(productService.getAllProductsWithInventories(user.customerID))
  if (!productRes.success) {
    console.error(
      `${t('route-translations-product.error-getting-product')} '${productRes.error.message}'`,
    )

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: null,
      error:
        productRes.error.message ??
        t('route-translations-product.couldnt-get-product'),
      origin: `GET api/v1/products`,
    }

    await errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: `${t('route-translations-product.error-occured-getting-product')} '${productRes.error.message}'`,
      },
      { status: 500 },
    )
  }

  const end = performance.now()

  await analyticsService.createAnalytic('action', {
    actionName: 'getProducts',
    userID: user.id,
    customerID: user.customerID,
    sessionID: session.id,
    executionTimeMS: end - start,
    platform: 'app',
  })

  return NextResponse.json(
    {
      msg: 'Success',
      data: productRes.data,
    },
    { status: 200 },
  )
}
