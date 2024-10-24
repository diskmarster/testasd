import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { chip } }: { params: { chip: string } },
) {
  const { session, user } = await sessionService.validate()

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: 'Du har ikke adgang til denne resource' },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: 'Bruger har ikke web adgang' },
      { status: 401 },
    )
  }

  const location = await locationService.getLastVisited(user.id!)
  if (!location) {
    return NextResponse.json(
      { msg: 'Fandt ikke nogen lokation' },
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
        msg: `Der skete en fejl med at hente chip værdi for ${chip}: '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ count })
}
