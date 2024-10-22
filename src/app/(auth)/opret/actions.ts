"use server"

import { publicAction } from "@/lib/safe-action"
import { customerService } from "@/service/customer"
import { ActionError } from "@/lib/safe-action/error"
import { emailService } from "@/service/email"
import { EmailWelcomeCustomer } from "@/components/email/email-welcome-customer"
import { userService } from "@/service/user"
import { locationService } from "@/service/location"
import { generateIdFromEntropySize } from "lucia"
import { createCustomerValidation } from "@/app/[lng]/(auth)/opret/validation"

export const createCustomerAction = publicAction
  .metadata({actionName: 'createCustomer'})
  .schema(createCustomerValidation)
  .action(async ({ parsedInput }) => {
    const existingCustomer = await customerService.getByEmail(parsedInput.email)
    if (existingCustomer) {
      throw new ActionError("En kunde med den email findes allerede")
    }

    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError("En bruger med den email findes allerede")
    }

    const newCustomer = await customerService.create(parsedInput)
    if (!newCustomer) {
      throw new ActionError("Der gik noget galt med at oprette dig som kunde")
    }

    const newLocationID = generateIdFromEntropySize(8)
    const newLocation = await locationService.create({
      id: newLocationID,
      customerID: newCustomer.id,
      name: "Hovedlokation",
    })
    if (!newLocation) {
      throw new ActionError("Der gik noget galt med at oprette en lokation")
    }

    const activationLink = await customerService.createActivationLink({
      customerID: newCustomer.id,
      email: newCustomer.email,
      locationID: newLocation.id,
      role: 'administrator'
    })
    if (!activationLink) {
      throw new ActionError("Der gik noget galt med at sende din aktiveringsmail")
    }

    emailService.sendRecursively(
      [parsedInput.email],
      "Velkommen til Nem Lager",
      EmailWelcomeCustomer({ company: newCustomer.company, link: activationLink })
    )
  })
