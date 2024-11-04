import { serverTranslation } from '@/app/i18n'
import { useLanguage } from '@/context/language'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { chip } }: { params: { chip: string } },
) {
  const { session, user } = await sessionService.validate()
  const lng = useLanguage()
  const { t } = await serverTranslation(lng, 'common')

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: t('route-translations.no-resource-access') },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: t('route-translations.no-web-access') },
      { status: 401 },
    )
  }

  const location = await locationService.getLastVisited(user.id!)
  if (!location) {
    return NextResponse.json(
      { msg: t('route-translations.no-location-found') },
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
      `Error getting chip count for ${chip}: '${(e as Error).message}'`,
    )

    return NextResponse.json(
      {
        msg: `${t('route-translations.chip-get-error ')} ${chip}: '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ count })
}
