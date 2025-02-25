'use server'

import { adminAction } from '@/lib/safe-action'
import { suppliersService } from '@/service/suppliers'
import { updateSupplierValidation } from './validation'

export const updateSupplierAction = adminAction
  .metadata({ actionName: 'updateSupplier' })
  .schema(updateSupplierValidation)
  .action(async ({ parsedInput, ctx }) => {
    await suppliersService.updateByID(
      parsedInput.id,
      ctx.user.customerID,
      ctx.user.id,
      ctx.user.name,
      parsedInput.data,
    )
  })
