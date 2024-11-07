import { isMaintenanceMode } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { customerService } from '@/service/customer'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { signJwt } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const signInSchema = z.object({
  email: z
    .string({ message: 'Email mangler' })
    .email({ message: 'Email er ugyldig' }),
  password: z.string({ message: 'Password mangler' }),
})

export async function POST(
  request: NextRequest,
): Promise<NextResponse<unknown>> {
  const start = performance.now()
  try {
    if (headers().get('content-type') != 'application/json') {
      return NextResponse.json(
        { msg: 'Request body skal være json format', },
        { status: 400, },
      )
    }

    const body = await request.json()

    const zodRes = signInSchema.safeParse(body)

    if (!zodRes.success) {
      return NextResponse.json(
        {
          msg: 'Indlæsning af data fejlede',
          errorMessages: zodRes.error.flatten().formErrors,
          error: zodRes.error,
        },
        { status: 400, },
      )
    }

    const { email, password } = zodRes.data

    let user = await userService.verifyPin(email, password)

    if (user == undefined) {
      user = await userService.verifyPassword(email, password)
    }

    if (user == undefined) {
      return NextResponse.json(
        { msg: 'Ugyldig email og password', },
        { status: 401, },
      )
    } else if (!user.appAccess) {
      return NextResponse.json(
        { msg: 'Bruger har ikke app adgang', },
        { status: 401, },
      )
    }
    const customer = await customerService.getByID(user.customerID)

    const sessionId = await sessionService.create(user.id)

    const jwt = signJwt({
      sessionId: sessionId,
      user: user,
    })

    const end = performance.now()

    await analyticsService.createAnalytic('action', {
      actionName: 'signIn',
      userID: user.id,
      customerID: user.customerID,
      sessionID: sessionId,
      executionTimeMS: end - start,
      platform: 'app',
    })

    return NextResponse.json(
      {
        msg: 'Log ind fuldendt',
        data: {
          jwt,
          user,
          customer,
        },
      },
      { status: 201, },
    )
  } catch (e) {
    console.error(e)

    return NextResponse.json(
      {
        msg: 'Der skete en fejl på serveren, prøv igen.',
        error: e,
      },
      { status: 500, },
    )
  }
}
