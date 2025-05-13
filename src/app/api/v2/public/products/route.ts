import { serverTranslation } from '@/app/i18n'
import { apiResponse, ApiResponse } from '@/lib/api/response'
import { isMaintenanceMode } from '@/lib/utils.server'
import { getLanguageFromRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  r: NextRequest,
): Promise<NextResponse<ApiResponse<string>>> {
  const headerList = headers()
  const lng = getLanguageFromRequest(headerList)
  for (const [key, value] of headerList.entries()) {
    console.log(`${key}: ${value}`)
  }
  const { t: commonT } = await serverTranslation(lng, 'common')

  if (isMaintenanceMode()) {
    return apiResponse.locked(
      commonT('route-translations-regulations.maintenance'),
      'abc',
    )
  }

  return apiResponse.ok('test')
}
