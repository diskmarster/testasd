import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { chip } }: { params: { chip: string } },
) {
  const { session, user } = await sessionService.validate()
  const lng = cookies().get('i18next')?.value ?? fallbackLng
  const { t } = await serverTranslation(lng, 'common')

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: t('route-translations-chip.no-resource-access') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations-chip.no-web-access') },
      { status: 401 },
    )
  }

  const location = await locationService.getLastVisited(user.id!)
  if (!location) {
    return NextResponse.json(
      { msg: t('route-translations-chip.no-location-found') },
      { status: 404 },
    )
  }

  let count = 0

  try {
    switch (chip) {
      case 'genbestil':
        const reorders = await inventoryService.getReordersByID(location)
        const num = reorders.filter(
          r => r.recommended > 0 && r.ordered < r.recommended,
        ).length
        count = num
        break
      default:
        count = 0
        break
    }
  } catch (e) {
    console.error(
      `${t('route-translations-chip.chip-count-error')} ${chip}: '${(e as Error).message}'`,
    )

    return NextResponse.json(
      {
        msg: `${t('route-translations-chip.chip-get-error ')} ${chip}: '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ count })
}
