import { productService } from "@/service/product";
import { validateRequest } from "@/service/user.utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse<unknown>> {
	try {
		const { session, user } = await validateRequest(request)

		if (session == null || user == null) {
			return NextResponse.json({
				msg: "Du har ikke adgang til denne resource"
			}, {
				status: 401,
			})
		}

		const products = await productService.getAllProducts(user.customerId)

		return NextResponse.json({
			msg: "Success",
			products,
		}, {
			status: 200,
		})
	} catch (e) {
		console.log(`Error getting products for authenticated user: '${(e as Error).message}'`)

		return NextResponse.json({
			msg: `Error getting products for authenticated user: '${(e as Error).message}'`,
		}, {
			status: 500,
		})
	}
}
