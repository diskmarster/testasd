import { CustomerMailSettingWithEmail } from '@/data/customer.types'
import { CustomerMailSetting } from '@/lib/database/schema/customer'
import { sendResponse, tryCatch } from '@/lib/utils.server'
import { customerService } from '@/service/customer'
import { NextRequest } from 'next/server'

const CRON_SECRET = process.env.NL_CRON_SECRET

export async function GET(request: NextRequest) {
	const secret = request.headers.get('Authorization')

	if (!secret) {
		return sendResponse(401, {
			msg: 'authorization is missing',
			error: 'authorization is missing',
		})
	}

	const parts = secret.split(' ', 2)
	if (parts[0] != 'Bearer') {
		return sendResponse(401, {
			msg: 'authorization is malformed',
			error: 'authorization is malformed',
		})
	}

	if (parts[1] != CRON_SECRET) {
		return sendResponse(401, {
			msg: 'authorization is denied',
			error: 'authorization is denied',
		})
	}

	const searchParams = request.nextUrl.searchParams
	const mailType = searchParams.get('mailtype') ?? undefined

	if (!isKeyofCustomerMailSetting(mailType)) {
		return sendResponse(400, {
			msg: 'invalid mail type query parameter',
			error: 'invalid mail type query parameter',
		})
	}

	const mailRes = await tryCatch(customerService.getMailsForCron(mailType))
	if (!mailRes.success) {
		const errMsg =
			mailRes.error instanceof Error
				? mailRes.error.message
				: 'unknown error occured'
		return sendResponse(500, { msg: errMsg, error: errMsg })
	}

	const mails: CustomerMailSettingWithEmail[] = mailRes.data

	console.log(mails)
	return sendResponse(200, { mails })
}

function isKeyofCustomerMailSetting(
	key: string | undefined,
): key is
	| keyof Pick<CustomerMailSetting, 'sendStockMail' | 'sendMovementsMail'>
	| undefined {
	const validMailTypes: (keyof CustomerMailSetting)[] = [
		'sendStockMail',
		'sendMovementsMail',
	]
	return key ? validMailTypes.includes(key as keyof CustomerMailSetting) : true
}
