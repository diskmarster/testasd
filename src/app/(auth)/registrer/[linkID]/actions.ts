"use server"

import { publicAction } from "@/lib/safe-action"
import { userService } from "@/service/user"
import { signUpValidation } from "@/app/(auth)/registrer/[linkID]/validation"
import { ActionError } from "@/lib/safe-action/error"
import { sessionService } from "@/service/session"
import { redirect } from "next/navigation"
import { emailService } from "@/service/email"
import { EmailTest } from "@/components/email/email-test"

export const signUpAction = publicAction
  .schema(signUpValidation)
  .action(async ({ parsedInput }) => {
    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError("En bruger med den email findes allerede")
    }

    const newUser = await userService.register({ clientID: parsedInput.clientID, name: parsedInput.name, email: parsedInput.email, hash: parsedInput.password })
    const newSessionID = await sessionService.create(newUser.id)

    const emailError = await emailService.sendOnce([parsedInput.email], "Velkommen til Nem Lager", EmailTest())
    if (emailError) {
      throw new ActionError("Kunne ikke sende en velkomst mail")
    }

    redirect("/oversigt")
  })
