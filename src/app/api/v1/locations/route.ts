import { locationService } from '@/service/location'
import { validateRequest } from '@/service/user.utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	request: NextRequest,
): Promise<NextResponse<unknown>> {
	try {
		const { session, user } = await validateRequest(request)

		if (session == null || user == null) {
			return NextResponse.json(
				{
					msg: 'Du har ikke adgang til denne ressource',
				},
				{
					status: 401,
				},
			)
		}

		const locations = await locationService.getAllByUserID(user.id)

		return NextResponse.json(
			{
				msg: 'Success',
				data: locations,
			},
			{
				status: 200,
			},
		)
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{
				msg: `Der skete en fejl på serveren. '${(e as Error).message}'`,
			},
			{
				status: 500,
			},
		)
	}
}
