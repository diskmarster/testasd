import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { isMaintenanceMode } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { productService } from '@/service/products'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
): Promise<NextResponse<unknown>> {
  const start = performance.now()

  const { session, user } = await validateRequest(headers())
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

  if (isMaintenanceMode()) {
    return NextResponse.json(
      { msg: t('route-translations-productid.maintenance') },
      { status: 423 },
    )
  }

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: t('route-translations-productid.no-access-to-resource') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-productid.no-app-access') },
      { status: 401 },
    )
  }

  try {
    const productID = parseInt(id)

    const product = await productService.getByID(productID)

    if (product?.isBarred)
      return NextResponse.json(
        {
          msg: t('route-translations-productid.error-product-barred'),
        },
        {
          status: 404,
        },
      )

		const end = performance.now()

		await analyticsService.createAnalytic('action', {
			actionName: 'getProductsByID',
			userID: user.id,
			customerID: user.customerID,
			sessionID: session.id,
			executionTimeMS: end - start,
			platform: 'app',
		})

    return NextResponse.json(
      {
        msg: 'success',
        data: product,
      },
      { status: 200 },
    )
  } catch (e) {
    console.error(t('route-translations-productid.error-fetching-product'), e)

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: { id: id },
      error:
        (e as Error).message ??
        `${t('route-translations-productid.error-fetching-product')} ${id}`,
      origin: `GET api/v1/products/{id}`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      { msg: t('route-translations-productid.server-error-product') },
      { status: 500 },
    )
  }
}
