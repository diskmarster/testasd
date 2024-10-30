import { NewApplicationError } from '@/lib/database/schema/errors'
import { errorsService } from '@/service/errors'
import { inventoryService } from '@/service/inventory'
import { validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<unknown>> {
  const { session, user } = await validateRequest(headers())

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: 'Du har ikke adgang til denne resource' },
      { status: 401 },
    )
  }

  if (!user.appAccess) {
    return NextResponse.json(
      { msg: 'Bruger har ikke app adgang' },
      { status: 401 },
    )
  }

  try {
    const placements = await inventoryService.getActivePlacementsByID(params.id)

    return NextResponse.json(
      { msg: 'Success', data: placements },
      { status: 200 },
    )
  } catch (e) {
    console.error(
      `Error getting placements for authenticated user: '${(e as Error).message}'`,
    )

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: { id: params.id },
      error: (e as Error).message ?? 'Kunne ikke hente placeringer',
      origin: `GET api/v1/locations/{id}/placements`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: `Der skete en fejl da vi skulle hente placeringer: '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }
}
