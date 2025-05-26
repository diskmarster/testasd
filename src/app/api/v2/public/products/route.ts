import { serverTranslation } from '@/app/i18n'
import { ProductFilters, ProductWithInventories } from '@/data/products.types'
import { getVercelRequestID, validatePublicRequest } from '@/lib/api/request'
import { apiResponse, ApiResponse } from '@/lib/api/response'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { productService } from '@/service/products'
import { getLanguageFromRequest } from '@/service/user.utils'
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

  const { customer } = await validatePublicRequest(headers())
  if (customer == null) {
    return apiResponse.unauthorized(
      t('route-translations-product.no-access-to-resource'),
      getVercelRequestID(headers()),
    )
  }

  const searchparams = r.nextUrl.searchParams
  let filters: ProductFilters = {}

  if (searchparams.has('group')) {
    filters.group = searchparams.get('group')?.split(',')
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
