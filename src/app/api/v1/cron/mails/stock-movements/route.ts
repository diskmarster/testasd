import { sendResponse, tryCatch } from '@/lib/utils.server'
import { inventoryService } from '@/service/inventory'
import { userService } from '@/service/user'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import * as dateFns from 'date-fns'
import { emailService } from '@/service/email'
import { EmailDailyStockMovements } from '@/components/email/email-daily-movement'

const CRON_SECRET = process.env.NL_CRON_SECRET

const mailRequestValidation = z.object({
  id: z.coerce.number(),
  email: z.string().email().nullable(),
  userID: z.coerce.number(),
  userEmail: z.string().email(),
  customerID: z.coerce.number(),
  locationID: z.string(),
  locationName: z.string(),
  inserted: z.coerce.date(),
  updated: z.coerce.date(),
  sendStockMail: z.coerce.boolean().nullable(),
  sendReorderMail: z.coerce.boolean().nullable(),
  sendMovementsMail: z.coerce.boolean(),
})

export async function POST(request: NextRequest) {
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

  const parsed = mailRequestValidation.safeParse(await request.json())

  if (!parsed.success) {
    return sendResponse(400, { error: 'invalid data in request body' })
  }

  const user = await tryCatch(
    userService.getByID(parsed.data.userID)
  )
  if (!user.success || user.data == undefined) {
    return sendResponse(500, { error: user.error?.message ?? 'No user found' })
  }

  const actions = await tryCatch(
    inventoryService.getActionsForUser(parsed.data.userID, {from: dateFns.subDays(Date.now(), 1), to: new Date()})
  )
  if (!actions.success) {
    return sendResponse(500, { error: actions.error.message })
  }

  await emailService.sendRecursively(
    [parsed.data.userEmail],
    `Rapport: Din daglige lagerbevægelses rapport for ${parsed.data.locationName}`,
    EmailDailyStockMovements({
      actions: actions.data.slice(0, 10),
      mailInfo: parsed.data,
      user: user.data,
    }),
  )

  return sendResponse(204)
}
