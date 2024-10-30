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
      `Error getting batches for authenticated user: '${(e as Error).message}'`,
    )

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: { id: params.id },
      error: (e as Error).message ?? 'Kunne ikke hente batchnumre',
      origin: `GET api/v1/locations/{id}/batches`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      {
        msg: `Der skete en fejl da vi skulle hente batchnr.: '${(e as Error).message}'`,
      },
      { status: 500 },
    )
  }
}
