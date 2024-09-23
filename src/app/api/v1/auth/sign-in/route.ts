import { lucia } from "@/lib/lucia";
import { sessionService } from "@/service/session";
import { userService } from "@/service/user";
import { signJwt } from "@/service/user.utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const signInSchema = z.object({
	email: z
		.string({ message: "Email mangler" })
		.email({ message: "Email er ugyldig" }),
	password: z.string({ message: "Password mangler", }).min(8, { message: "Kodeord skal være mindst 8 karakterer." }),
})

export async function POST(request: NextRequest): Promise<NextResponse<unknown>> {
	try {
		if (request.headers.get("content-type") != "application/json") {
			return NextResponse.json({
				msg: "Request body skal være json format",
			}, {
				status: 400,
			})
		}

		const body = await request.json()

		const zodRes = signInSchema.safeParse(body)

		if (!zodRes.success) {
			return NextResponse.json({
				msg: "Indlæsning af data fejlede",
				errorMessages: zodRes.error.flatten().formErrors,
				error: zodRes.error,
			}, {
				status: 400,
			})
		}

		const { email, password } = zodRes.data

		const user = await userService.verifyPassword(email, password)

		if (user == undefined) {
			return NextResponse.json({
				msg: "Ugyldig email og password",
			}, {
				status: 401
			})
		}

		const sessionId = await sessionService.create(user.id)

		const jwt = signJwt({
			sessionId: sessionId,
			user: user,
		})

		return NextResponse.json({
			msg: "Log ind fuldendt",
			jwt,
			user,
		}, {
			status: 201,
		})
	} catch (e) {
		console.error(e)

		return NextResponse.json({
			msg: "Der skete en fejl på serveren, prøv igen.",
			error: e
		}, {
			status: 500
		})
	}
}
