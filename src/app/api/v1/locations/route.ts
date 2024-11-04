import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { errorsService } from '@/service/errors'
import { locationService } from '@/service/location'
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
      { msg: t('route-translations-locations.no-access-to-resource') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-locations.no-app-access') },
      { status: 401 },
    )
  }

  try {
    const locations = await locationService.getAllByUserID(user.id)

    return NextResponse.json(
      {
        msg: 'Success',
        data: locations,
      },
      { status: 200 },
    )
  } catch (e) {
    console.error(e)

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: null,
      error:
        (e as Error).message ?? t('route-translations-locations.server-error'),
      origin: `GET api/v1/locations`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: `${t('route-translations-locations.server-error')} '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }
}
