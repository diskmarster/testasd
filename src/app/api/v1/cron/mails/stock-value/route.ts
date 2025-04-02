import { EmailSendMonthlyStock } from '@/components/email/email-monthly-stock'
import { genInventoryExcel, genInventoryPDF } from '@/lib/pdf/inventory-rapport'
import { sendResponse, tryCatch } from '@/lib/utils.server'
import { customerService } from '@/service/customer'
import { emailService } from '@/service/email'
import { inventoryService } from '@/service/inventory'
import { formatDate } from 'date-fns'
import { NextRequest } from 'next/server'
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

  const customer = await tryCatch(
    customerService.getByID(parsed.data.customerID),
  )
  if (!customer.success) {
    return sendResponse(500, { error: customer.error.message })
  }

  const inventory = await tryCatch(
    inventoryService.getInventory(parsed.data.locationID),
  )
  if (!inventory.success) {
    return sendResponse(500, { error: inventory.error.message })
  }

  const workbook = genInventoryExcel(inventory.data)
  const excelb64 = XLSX.write(workbook, { type: 'base64' })
  const email = parsed.data.userID ? parsed.data.userEmail! : parsed.data.email!
  const today = new Date()
  const dateStr = formatDate(today, 'dd-MM-yy')

  const pdf = genInventoryPDF(
    {
      docTitle: `Lagerværdi for ${customer.data?.company}, ${parsed.data.locationName}`,
      companyName: customer.data?.company!,
      locationName: parsed.data.locationName,
      userName: email,
      dateOfReport: today,
    },
    inventory.data,
    'da',
  )
  const pdfbufarr = pdf.output('arraybuffer')
  const pdfb64 = Buffer.from(pdfbufarr).toString('base64')

  await emailService.sendRecursively(
    [email],
    `Rapport: Månedlig lagerværdi rapport for ${customer.data?.company}, ${parsed.data.locationName}`,
    EmailSendMonthlyStock({
      mailInfo: parsed.data,
      customer: customer.data!,
    }),
    [
      {
        content: excelb64,
        filename: `nem_lager_${parsed.data.locationName}_lagerværdi_${dateStr}.xlsx`,
      },
      {
        content: pdfb64,
        filename: `nem_lager_${parsed.data.locationName}_lagerværdi_${dateStr}.pdf`,
      },
    ],
  )

  return sendResponse(204)
}
