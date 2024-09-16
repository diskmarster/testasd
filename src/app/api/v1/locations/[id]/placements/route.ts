import { inventoryService } from "@/service/inventory";
import { validateRequest } from "@/service/user.utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
): Promise<NextResponse<unknown>> {
	try {
		console.log(JSON.stringify(request.headers, null, 2))
		const { session, user } = await validateRequest(request)

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

		const placements = await inventoryService.getPlacementsByID(params.id)

		return NextResponse.json(
			{
				msg: "Success",
				data: placements,
			},
			{
				status: 200,
			}
		)
	} catch (e) {
		console.error(
			`Error getting products for authenticated user: '${(e as Error).message}'`,
		)

		return NextResponse.json(
			{
				msg: `Der skete en fejl under reguleringen: '${(e as Error).message}'`,
			},
			{
				status: 500,
			},
		)
	}
}
