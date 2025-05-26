import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { isMaintenanceMode, tryCatch } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { apiService } from '@/service/api'
import { createRegulationSchema } from '@/service/api.utils'
import { errorsService } from '@/service/errors'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
): Promise<NextResponse<unknown>> {
  const start = performance.now()
  const { session, user } = await validateRequest(headers())
  const lng = getLanguageFromRequest(headers())
  const { t } = await serverTranslation(lng, 'common')

  if (isMaintenanceMode()) {
    return NextResponse.json(
      { msg: t('route-translations-regulations.maintenance') },
      { status: 423 },
    )
  }

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: t('route-translations-regulations.no-access-to-resource') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-regulations.no-app-access') },
      { status: 401 },
    )
  }

  const json = await request.json()

  if (headers().get('content-type') != 'application/json') {
    const msg = t('route-translations-regulations.request-body-json')

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: json,
      error: msg,
      origin: 'POST /api/v1/regulations',
    }
    errorsService.create(errorLog)

    return NextResponse.json({ msg: msg }, { status: 400 })
  }

  const zodRes = createRegulationSchema.safeParse(json)

  if (!zodRes.success) {
    const msg = t('route-translations-regulations.loading-failed')

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: json,
      error: msg,
      origin: 'POST /api/v1/regulations',
    }
    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: msg,
        errorMessages: zodRes.error.flatten().formErrors,
        error: zodRes.error,
      },
      { status: 400 },
    )
  }

  const { data } = zodRes

  const regulate = await tryCatch(
    apiService.regulateInventory(user.customerID, null, null, 'ext', data),
  )
  if (!regulate.success) {
    console.error(
      `${t('route-translations-regulations.error-getting-product')} '${regulate.error.message}'`,
    )
    const msg = `${t('route-translations-regulations.error-during-regulation')} '${regulate.error.message}'`

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: json,
      error: msg,
      origin: 'POST /api/v1/regulations',
    }
    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: msg,
      },
      { status: 500 },
    )
  }

  const end = performance.now()

  await analyticsService.createAnalytic('action', {
    actionName: 'regulateInventory',
    userID: user.id,
    customerID: user.customerID,
    sessionID: session.id,
    executionTimeMS: end - start,
    platform: 'app',
  })

  return NextResponse.json({ msg: 'Success' }, { status: 201 })
}
