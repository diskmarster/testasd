import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { isMaintenanceMode } from '@/lib/utils.server'
import { errorsService } from '@/service/errors'
import { inventoryService } from '@/service/inventory'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<unknown>> {
  const { session, user } = await validateRequest(headers())
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

  if (isMaintenanceMode()) {
    return NextResponse.json(
      { msg: t('route-translations-batches.maintenance') },
      { status: 423 },
    )
  }

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: t('route-translations-batches.no-access-to-resource') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-batches.no-app-access') },
      { status: 401 },
    )
  }

  try {
    const batches = await inventoryService.getActiveBatchesByID(params.id)

    return NextResponse.json(
      {
        msg: 'Success',
        data: batches,
      },
      { status: 200 },
    )
  } catch (e) {
    console.error(
      `${t('route-translations-batches.error-getting-batch')} '${(e as Error).message}'`,
    )

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: { id: params.id },
      error:
        (e as Error).message ??
        t('route-translations-batches.error-getting-batch-numbers'),
      origin: `GET api/v1/locations/{id}/batches`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: `${t('route-translations-batches.error-getting-batch-number')} '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }
}
