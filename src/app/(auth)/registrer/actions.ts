"use server"

import { publicAction } from "@/lib/safe-action"
import { userService } from "@/service/user"
import { signUpValidation } from "@/app/(auth)/registrer/validation"
import { ActionError } from "@/lib/safe-action/error"
import { sessionService } from "@/service/session"
import { redirect } from "next/navigation"

export const signUpAction = publicAction
  .schema(signUpValidation)
  .action(async ({ parsedInput }) => {
    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError("En bruger med den email findes allerede")
    }

    const newUser = await userService.register({ email: parsedInput.email, hash: parsedInput.password })
    const newSessionID = await sessionService.create(newUser.id)

    redirect("/oversigt")
  })
