import { historyTypeZodSchema } from "@/data/inventory.types";
import { validateRequest } from "@/service/user.utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createRegulationSchema = z.object({
	productId: z.coerce.number(),
	type: historyTypeZodSchema,
	quantity: z.coerce.number(),
})

export async function POST(request: NextRequest): Promise<NextResponse<unknown>> {
	try {
		const { session, user } = await validateRequest(request)

		if (session == null || user == null) {
			return NextResponse.json({
				msg: "Du har ikke adgang til denne resource"
			}, {
				status: 401,
			})
		}

		if (request.headers.get("content-type") != "application/json") {
			return NextResponse.json({
				msg: "Request body skal være json format",
			}, {
				status: 400,
			})
		}

		const zodRes = createRegulationSchema.safeParse(await request.json())

		if (!zodRes.success) {
			return NextResponse.json({
				msg: "Indlæsning af data fejlede",
				errorMessages: zodRes.error.flatten().formErrors,
				error: zodRes.error,
			}, {
				status: 400,
			})
		}

		const { data } = zodRes

		console.log("data received:", JSON.stringify(data, null, 2))

		return NextResponse.json({
			msg: "Success, not fully implemented",
		}, {
			status: 201,
		})
	} catch (e) {
		console.error(`Error getting products for authenticated user: '${(e as Error).message}'`)

		return NextResponse.json({
			msg: `Der skete en fejl under reguleringen: '${(e as Error).message}'`,
		}, {
			status: 500,
		})
	}
}
