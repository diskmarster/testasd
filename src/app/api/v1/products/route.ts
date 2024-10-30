import { NewApplicationError } from '@/lib/database/schema/errors'
import { errorsService } from '@/service/errors'
import { productService } from '@/service/products'
import { validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	request: NextRequest,
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
		const products = await productService
			.getAllProductsWithInventories(user.customerID)
			.catch(e => {
				console.error(`Error getting products for authenticated user: '${e}'`)

				return NextResponse.json(
					{ msg: `Error getting products for authenticated user: '${e}'` },
					{ status: 500 },
				)
			})

		if (products instanceof NextResponse) {
			return products
		}

		return NextResponse.json(
			{
				msg: 'Success',
				data: products,
			},
			{ status: 200 },
		)
	} catch (e) {
		console.error(
			`Error getting products for authenticated user: '${(e as Error).message}'`,
		)

    const errorLog: NewApplicationError = {
      userID: user.id,
      customerID: user.customerID,
      type: 'endpoint',
      input: null,
      error: (e as Error).message ?? 'Kunne ikke hente varer',
      origin: `GET api/v1/products`,
    }

    errorsService.create(errorLog)

		return NextResponse.json(
			{
				msg: `Der skete en fejl da vi skulle hente varer: '${(e as Error).message}'`,
			},
			{ status: 500 },
		)
	}
}
