import { serverTranslation } from '@/app/i18n'
import { hasPermissionByRank } from '@/data/user.types'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { userService } from '@/service/user'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { LibsqlError } from '@libsql/client'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const dataSchema = z.object({
	tag: z.string(),
	userId: z.number(),
})

export async function POST(request: Request): Promise<NextResponse<unknown>> {
	const start = performance.now()

	const { session, user } = await validateRequest(headers())
	const lng = getLanguageFromRequest(headers())
	const { t } = await serverTranslation(lng, 'common')

	if (session == null || user == null) {
		return NextResponse.json(
			{ msg: t('route-translations-nfc.no-access-to-resource') },
			{ status: 401 },
		)
	}

	if (!user.appAccess) {
		return NextResponse.json(
			{ msg: t('route-translations-nfc.no-app-access') },
			{ status: 401 },
		)
	}

	const data = dataSchema.safeParse(await request.json())

	if (!data.success) {
		return NextResponse.json(
			{
				msg: 'Læsning af data fejlede',
			},
			{ status: 400 },
		)
	}

	if (
		!hasPermissionByRank(user.role, 'moderator') &&
		user.id != data.data.userId
	) {
		return NextResponse.json(
			{ msg: t('route-translations-nfc.no-access-to-resource') },
			{ status: 401 },
		)
	}

	try {
		const providerData = data.data

		const currentProvider = await userService.getNfcProvider(
			providerData.userId,
		)

		if (currentProvider == undefined) {
			const provider = await userService.registerNfcProvider(
				providerData.tag,
				providerData.userId,
			)

			if (provider == undefined) {
				return NextResponse.json(
					{ msg: t('route-translations-nfc.couldnt-register-nfc') },
					{ status: 500 },
				)
			}
		} else {
			const provider = await userService.updateNfcProvider(
				providerData.tag,
				providerData.userId,
			)

			if (provider == undefined) {
				return NextResponse.json(
					{ msg: t('route-translations-nfc.couldnt-register-nfc') },
					{ status: 500 },
				)
			}
		}

		const end = performance.now()

		await analyticsService.createAnalytic('action', {
			actionName: 'registerNFC',
			userID: user.id,
			customerID: user.customerID,
			sessionID: session.id,
			executionTimeMS: end - start,
			platform: 'app',
		})

		return NextResponse.json(
			{
				msg: 'Registrering successfuld',
			},
			{ status: 201 },
		)
	} catch (e) {
		if (e instanceof LibsqlError) {
			if (e.message.includes('UNIQUE')) {
				console.error(`AuthID already in use: ${e}`)

				const errorLog: NewApplicationError = {
					userID: user.id,
					customerID: user.customerID,
					type: 'endpoint',
					input: null,
					error: t('route-translations-nfc.error-card-in-use'),
					origin: `POST api/v1/auth/nfc`,
				}

				errorsService.create(errorLog)

				return NextResponse.json(
					{ msg: t('route-translations-nfc.error-card-in-use') },
					{ status: 400 },
				)
			}
		}

		console.error(`Unknown error when registering NFC: ${e}`)

		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error:
				(e as Error).message ??
				t('route-translations-nfc.couldnt-register-nfc'),
			origin: `POST api/v1/auth/nfc`,
		}

		errorsService.create(errorLog)

		return NextResponse.json(
			{ msg: t('route-translations-nfc.couldnt-register-nfc') },
			{ status: 500 },
		)
	}
}
