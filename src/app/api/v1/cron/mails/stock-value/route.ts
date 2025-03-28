import { EmailSendMonthlyStock } from '@/components/email/email-monthly-stock'
import { genInventoryExcel } from '@/lib/pdf/inventory-rapport'
import { tryCatch } from '@/lib/utils.server'
import { emailService } from '@/service/email'
import { inventoryService } from '@/service/inventory'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { z } from 'zod'

const CRON_SECRET = process.env.NL_CRON_SECRET

const mailRequestValidation = z.object({
  id: z.coerce.number(),
  email: z.string().email().nullable(),
  userID: z.coerce.number().nullable(),
  userEmail: z.string().email().nullable(),
  customerID: z.coerce.number(),
  locationID: z.string(),
  locationName: z.string(),
  inserted: z.coerce.date(),
  updated: z.coerce.date(),
  sendStockMail: z.coerce.boolean(),
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

  const inventory = await tryCatch(
    inventoryService.getInventory(parsed.data.locationID),
  )
  if (!inventory.success) {
    return sendResponse(500, { error: inventory.error.message })
  }

  const workbook = genInventoryExcel(inventory.data)
  const b64 = XLSX.write(workbook, { type: 'base64' })
  const email = parsed.data.userID ? parsed.data.userEmail! : parsed.data.email!

  await emailService.sendRecursively(
    [email],
    `Månedlig lagerværdi rapport for ${parsed.data.locationName}`,
    EmailSendMonthlyStock({}),
    [{ content: b64, filename: 'lagerværdi.xlsx' }],
  )

  return sendResponse(200, {})
}

function sendResponse(code: number, data: any) {
  return NextResponse.json(data, { status: code })
}
