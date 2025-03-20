import { UserNoHash } from '@/lib/database/schema/auth'
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

const nfcSchema = z.object({
  tagID: z.string()
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

    const searchParams = request.nextUrl.searchParams
    const signInMethod = searchParams.get("method") ?? "pw"

    const zodRes = parseDataByMethod(body, signInMethod)

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

    const user = await getUserByMethod(zodRes, signInMethod)

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
    if (customer == undefined) {
      return NextResponse.json(
        { msg: 'Adgang nægtet', },
        { status: 401, },
      )
    }

    const customerSettings = await customerService.getSettings(customer.id)

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
          customer: {
            ...customer,
            settings: customerSettings,
          },
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

function parseDataByMethod(body: unknown, method: string): z.SafeParseReturnType<unknown, unknown> {
  if (method == "pw") {
    return signInSchema.safeParse(body)
  } else if (method == "nfc") {
    return nfcSchema.safeParse(body)
  } else {
    return {
      success: false,
      error: new z.ZodError([{
        message: "Ukendt login metode",
        code: "custom",
        path: [],
      }]),
    }
  }
}

async function getUserByMethod(zodData: z.SafeParseSuccess<unknown>, method: string): Promise<UserNoHash | undefined> {
  if (method == "pw") {
    const data  = zodData.data as {
      email: string,
      password: string,
    }

    const { email, password } = data

    let user = await userService.verifyPin(email, password)

    if (user == undefined) {
      user = await userService.verifyPassword(email, password)
    }

    return user
  } else if (method == "nfc") {
    const data = zodData.data as {
      tagID: string,
    }
    
    return await userService.getNfcUser(data.tagID)
  } else {
    return undefined
  }
}
