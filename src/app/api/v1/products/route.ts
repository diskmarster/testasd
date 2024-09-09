import { productService } from "@/service/product";
import { validateRequest } from "@/service/user.utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse<unknown>> {
	const {session, user} = await validateRequest(request)

	if (session == null || user == null) {
		return NextResponse.json({
			msg: "Du har ikke adgang til denne resource"
		}, {
			status: 401,
		})
	}

	const products = await productService.getAllProducts(user.customerId)

	return NextResponse.json({
		msg: "Succes",
		products,
	}, {
		status: 200,
	})
}
