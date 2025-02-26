import { serverTranslation } from '@/app/i18n'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { customerService } from '@/service/customer'
import { errorsService } from '@/service/errors'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
	const { session, user } = await validateRequest(headers())
	const lng = getLanguageFromRequest(headers())
	const { t } = await serverTranslation(lng, 'common')

	if (session == null || user == null) {
		return NextResponse.json(
			{ msg: t('route-translations-users.no-access-to-resource') },
			{ status: 401 },
		)
	}

	if (!user.appAccess) {
		return NextResponse.json(
			{ msg: t('route-translations-users.no-app-access') },
			{ status: 401 },
		)
	}

	let customer
	try {
		customer = await customerService.getByID(user.customerID)
		if (customer == undefined) {
			return NextResponse.json(
				{ msg: t('route-translations-users.no-access-to-resource') },
				{ status: 401 },
			)
		}
	} catch (e) {
		console.error(`Error getting customer from user: '${(e as Error).message}'`)
		return NextResponse.json(
			{ msg: t('route-translations-users.no-access-to-resource') },
			{ status: 401 },
		)
	}

	try {
		const settings = await customerService.getSettings(customer.id)
		if (settings == undefined) {
			const errorLog: NewApplicationError = {
				userID: user.id,
				customerID: user.customerID,
				type: 'endpoint',
				input: null,
				error: t('route-translations-users.couldnt-get-settings'),
				origin: `GET api/v1/settings`,
			}

			errorsService.create(errorLog)

			return NextResponse.json(
				{
					msg: t('route-translations-users.couldnt-get-settings'),
				},
				{ status: 500 },
			)
		}

		return NextResponse.json(
			{
				msg: 'Success',
				data: settings,
			},
			{ status: 200 },
		)
	} catch (e) {
		console.error(
			`${t('route-translations-users.error-getting-settings')} '${(e as Error).message}'`,
		)

		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error:
				(e as Error).message ??
				t('route-translations-users.couldnt-get-settings'),
			origin: `GET api/v1/settings`,
		}

		errorsService.create(errorLog)

		return NextResponse.json(
			{
				msg: `${t('route-translations-users.error-occured-getting-settings')} '${(e as Error).message}'`,
			},
			{ status: 500 },
		)
	}
}
