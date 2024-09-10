import { validateRequest } from "@/service/user.utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse<unknown>> {
	try {
		const {session, user} = await validateRequest(request)

		if (session == null || user == null) {
			return NextResponse.json({
				msg: "Du har ikke adgang til denne resource"
			}, {
				status: 401,
			})
		}

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
