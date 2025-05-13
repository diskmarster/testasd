import { serverTranslation } from '@/app/i18n'
import { ProductFilters, ProductWithInventories } from '@/data/products.types'
import { apikeys } from '@/lib/api-key/api-key'
import { apiResponse, ApiResponse } from '@/lib/api/response'
import { Customer } from '@/lib/database/schema/customer'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { customerService } from '@/service/customer'
import { productService } from '@/service/products'
import { getLanguageFromRequest } from '@/service/user.utils'
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  r: NextRequest,
): Promise<NextResponse<ApiResponse<ProductWithInventories[]>>> {
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

  if (isMaintenanceMode()) {
    return apiResponse.locked(
      t('route-translations-regulations.maintenance'),
      getVercelRequestID(headers()),
    )
  }

  const customer = await validatePublicRequest(headers())
  if (customer == null) {
    return apiResponse.unauthorized(
      t('route-translations-product.no-access-to-resource'),
      getVercelRequestID(headers()),
    )
  }

	const searchparams = r.nextUrl.searchParams
	let filters: ProductFilters = {}

	if (searchparams.has('group')) {
		filters.group = searchparams.get('group')?.split(",")
	}

  const productRes = await tryCatch(
    productService.getAllProductsWithInventories(customer.id, filters),
  )
  if (!productRes.success) {
    return apiResponse.internal(
      productRes.error.message,
      getVercelRequestID(headers()),
    )
  }

  return apiResponse.ok(productRes.data)
}

async function validatePublicRequest(
  headers: ReadonlyHeaders,
): Promise<Customer | null> {
  const authheader = headers.get('authorization')
  if (authheader == null) {
    return null
  }

  const authparts = authheader.split(' ')
  if (authparts.length != 2 || authparts[0].toLowerCase() != 'bearer') {
    return null
  }

  const tokenhash = apikeys.hash(authparts[1])
  const apikey = await customerService.getApiKey(tokenhash)
  if (!apikey) {
    return null
  }

  const customer = await customerService.getByID(apikey.customerID)
  if (!customer) {
    return null
  }

  return customer
}

function getVercelRequestID(headers: ReadonlyHeaders): string {
  let id = headers.get('x-vercel-id')
  if (id == null) {
    return 'DEV_' + crypto.randomUUID()
  } else {
    return id.split('::')[1]
  }
}
