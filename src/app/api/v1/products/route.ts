import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { errorsService } from '@/service/errors'
import { productService } from '@/service/products'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
): Promise<NextResponse<unknown>> {
  const { session, user } = await validateRequest(headers())
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

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

  try {
    const products = await productService
      .getAllProductsWithInventories(user.customerID)
      .catch(e => {
        console.error(
          `${t('route-translations-product.error-getting-product')} '${e}'`,
        )

        return NextResponse.json(
          {
            msg: `${t('route-translations-product.error-getting-product')} '${e}'`,
          },
          { status: 500 },
        )
      })

    if (products instanceof NextResponse) {
      return products
    }

    return NextResponse.json(
      {
        msg: 'Success',
        data: products,
      },
      { status: 200 },
    )
  } catch (e) {
    console.error(
      `${t('route-translations-product.error-getting-product')} '${(e as Error).message}'`,
    )

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: null,
      error:
        (e as Error).message ??
        t('route-translations-product.couldnt-get-product'),
      origin: `GET api/v1/products`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: `${t('route-translations-product.error-occured-getting-product')} '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }
}
