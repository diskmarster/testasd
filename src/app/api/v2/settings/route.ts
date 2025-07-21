import { serverTranslation } from '@/app/i18n'
import { hasPermissionByPlan } from '@/data/user.types'
import { NewApplicationError } from '@/lib/database/schema/errors'
import { tryCatch } from '@/lib/utils.server'
import { analyticsService } from '@/service/analytics'
import { customerService } from '@/service/customer'
import { errorsService } from '@/service/errors'
import { productService } from '@/service/products'
import { getLanguageFromRequest, validateRequest } from '@/service/user.utils'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// temporary auth timeout, to use until the setting is implemented in web part
const DEFAULT_AUTH_TIMEOUT_MINUTES = 5

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
	const start = performance.now()

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

	const customerRes = await tryCatch(customerService.getByID(user.customerID))
	if (!customerRes.success) {
		console.error(
			`Error getting customer from user: '${customerRes.error.message}'`,
		)
		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error: customerRes.error.message,
			origin: `GET api/v2/settings`,
		}

		await errorsService.create(errorLog)

		return NextResponse.json(
			{ msg: t('route-translations-users.no-access-to-resource') },
			{ status: 401 },
		)
	}

	const customer = customerRes.data
	if (customer == undefined) {
		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error: `No customer found for customerID: ${user.customerID}`,
			origin: `GET api/v2/settings`,
		}

		await errorsService.create(errorLog)
		return NextResponse.json(
			{ msg: t('route-translations-users.no-access-to-resource') },
			{ status: 401 },
		)
	}

	const settingsRes = await tryCatch(customerService.getSettings(customer.id))
	if (!settingsRes.success) {
		console.error(
			`${t('route-translations-users.error-getting-settings')} '${settingsRes.error.message}'`,
		)

		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error:
				settingsRes.error.message ??
				t('route-translations-users.couldnt-get-settings'),
			origin: `GET api/v2/settings`,
		}

		await errorsService.create(errorLog)

		return NextResponse.json(
			{
				msg: `${t('route-translations-users.error-occured-getting-settings')} '${settingsRes.error.message}'`,
			},
			{ status: 500 },
		)
	}

	const settings = settingsRes.data
	if (settings == undefined) {
		const errorLog: NewApplicationError = {
			userID: user.id,
			customerID: user.customerID,
			type: 'endpoint',
			input: null,
			error: t('route-translations-users.couldnt-get-settings'),
			origin: `GET api/v2/settings`,
		}

		await errorsService.create(errorLog)

		return NextResponse.json(
			{
				msg: t('route-translations-users.couldnt-get-settings'),
			},
			{ status: 500 },
		)
	}

	let useBatch = hasPermissionByPlan(customer.plan, 'pro')
	if (useBatch) {
		const batchProducts = await productService.getBatchProducts(user.customerID)

		useBatch = useBatch && batchProducts.length > 0
	}

	const end = performance.now()

	const analyticsRes = await tryCatch(
		analyticsService.createAnalytic('action', {
			actionName: 'getCustomerSettingsV2',
			userID: user.id,
			customerID: user.customerID,
			sessionID: session.id,
			executionTimeMS: end - start,
			platform: 'app',
		}),
	)

	if (!analyticsRes.success) {
		console.error('Could not create analytic for v2 settings endpoint')
	}

	return NextResponse.json(
		{
			msg: 'Success',
			data: {
				...settings,
				useBatch,
				authTimeoutMin: DEFAULT_AUTH_TIMEOUT_MINUTES,
			},
		},
		{ status: 200 },
	)
}
