import { productService } from '@/service/products'
import { validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
): Promise<NextResponse<unknown>> {
	try {
		const { session, user } = await validateRequest(headers())

		if (session == null || user == null) {
			return NextResponse.json(
				{
					msg: 'Du har ikke adgang til denne resource',
				},
				{
					status: 401,
				},
			)
		}

		const products = await productService
			.getAllProductsWithInventories(user.customerID)
			.catch(e => {
				console.error(`Error getting products for authenticated user: '${e}'`)

				return NextResponse.json(
					{
						msg: `Error getting products for authenticated user: '${e}'`,
					},
					{
						status: 500,
					},
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
			{
				status: 200,
			},
		)
	} catch (e) {
		console.error(
			`Error getting products for authenticated user: '${(e as Error).message}'`,
		)

		return NextResponse.json(
			{
				msg: `Der skete en fejl da vi skulle hente produkter: '${(e as Error).message}'`,
			},
			{
				status: 500,
			},
		)
	}
}
