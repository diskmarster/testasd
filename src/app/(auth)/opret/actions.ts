"use server"

import { publicAction } from "@/lib/safe-action"
import { createCustomerValidation } from "@/app/(auth)/opret/validation"

export const createCustomerAction = publicAction
  .schema(createCustomerValidation)
  .action(async ({ parsedInput }) => {
    console.log("customer to create:", parsedInput)
  })
