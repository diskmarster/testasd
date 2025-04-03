import { CustomerMailSettingWithEmail } from '@/data/customer.types'
import { CustomerMailSetting } from '@/lib/database/schema/customer'
import { sendResponse } from '@/lib/utils.server'
import { customerService } from '@/service/customer'
import { NextRequest } from 'next/server'

const CRON_SECRET = process.env.NL_CRON_SECRET

export async function GET(request: NextRequest) {
  const secret = request.headers.get('Authorization')

  if (!secret) {
    return sendResponse(401, { error: 'authorization is missing' })
  }

  const parts = secret.split(' ', 2)
  if (parts[0] != 'Bearer') {
    return sendResponse(401, { error: 'authorization is malformed' })
  }

  if (parts[1] != CRON_SECRET) {
    return sendResponse(401, { error: 'authorization is denied' })
  }

  const searchParams = request.nextUrl.searchParams
  const mailType = searchParams.get('mailtype') ?? undefined

  if (mailType && !isKeyofCustomerMailSetting(mailType) {
    return sendResponse(400, { error: 'invalid mail type query parameter' })
  }

  let mails: CustomerMailSettingWithEmail[] = []

  try {
    mails = await customerService.getMailsForCron(mailType as keyof CustomerMailSetting | undefined)
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : 'unknown error occured'
    return sendResponse(500, { error: errMsg })
  }

  return sendResponse(200, { mails })
}

function isKeyofCustomerMailSetting(key: string): key is keyof CustomerMailSettingWithEmail {
	const validMailTypes: (keyof CustomerMailSetting)[] = ['sendStockMail']
	return validMailTypes.includes(key as keyof CustomerMailSetting)
}
