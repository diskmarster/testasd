import { NewApplicationError } from '@/lib/database/schema/errors'
import { errorsService } from '@/service/errors'
import { locationService } from '@/service/location'
import { validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
): Promise<NextResponse<unknown>> {
  const { session, user } = await validateRequest(headers())

  if (session == null || user == null) {
    return NextResponse.json(
      { msg: 'Du har ikke adgang til denne ressource' },
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
      error: (e as Error).message ?? 'Der skete en fejl på serveren',
      origin: `GET api/v1/locations`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      { msg: `Der skete en fejl på serveren. '${(e as Error).message}'` },
      { status: 500 },
    )
  }
}
