import { NewApplicationError } from '@/lib/database/schema/errors'
import { errorsService } from '@/service/errors'
import { productService } from '@/service/products'
import { validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { id } }: { params: { id: string } },
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
    const productID = parseInt(id)

    const product = await productService.getByID(productID)

    return NextResponse.json(
      {
        msg: 'success',
        data: product,
      },
      { status: 200 },
    )
  } catch (e) {
    console.error('Error fetching product by ID:', e)

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: { id: id },
      error: (e as Error).message ?? `Kunne ikke hente vare med ID: ${id}`,
      origin: `GET api/v1/products/{id}`,
    }

    errorsService.create(errorLog)

    return NextResponse.json(
      { msg: 'Der skete en fejl på serveren, ved hentning af produkt' },
      { status: 500 },
    )
  }
}
