import { customerService } from '@/service/customer'
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'
import { apikeys } from '../api-key/api-key'
import { Customer } from '../database/schema/customer'

export function getVercelRequestID(headers: ReadonlyHeaders): string {
  let id = headers.get('x-vercel-id')
  if (id == null) {
    return 'DEV_' + crypto.randomUUID()
  } else {
    return id.split('::')[1]
  }
}

export async function validatePublicRequest(
  headers: ReadonlyHeaders,
): Promise<Customer | null> {
  const authheader = headers.get('authorization')
  if (authheader == null) {
    return null
  }

  const authparts = authheader.split(' ')
  if (authparts.length != 2 || authparts[0].toLowerCase() != 'bearer') {
    return null
  }

  const tokenhash = apikeys.hash(authparts[1])
  const apikey = await customerService.getApiKey(tokenhash)
  if (!apikey) {
    return null
  }

  const customer = await customerService.getByID(apikey.customerID)
  if (!customer) {
    return null
  }

  return customer
}
