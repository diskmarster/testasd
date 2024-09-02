"use server"

import { publicAction } from "@/lib/safe-action"
import { createCustomerValidation } from "@/app/(auth)/opret/validation"
import { customerService } from "@/service/customer"
import { ActionError } from "@/lib/safe-action/error"
import { emailService } from "@/service/email"
import { EmailWelcomeCustomer } from "@/components/email/email-welcome-customer"

export const createCustomerAction = publicAction
  .schema(createCustomerValidation)
  .action(async ({ parsedInput }) => {
    const existingCustomer = await customerService.getByEmail(parsedInput.email)
    if (existingCustomer) {
      throw new ActionError("En kunde med den email findes allerede")
    }

    const newCustomer = await customerService.create(parsedInput)
    if (!newCustomer) {
      throw new ActionError("Der gik noget galt med at oprette dig som kunde")
    }

    const activationLink = await customerService.createActivationLink({ customerID: newCustomer.id, email: newCustomer.email })
    if (!activationLink) {
      throw new ActionError("Der gik noget galt med at sende din aktiveringsmail")
    }

    emailService.sendRecursively(
      [parsedInput.email],
      "Velkommen til Nem Lager",
      EmailWelcomeCustomer({ company: newCustomer.company, link: activationLink })
    )
  })
