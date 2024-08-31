"use server"

import { publicAction } from "@/lib/safe-action"
import { userService } from "@/service/user"
import { signUpValidation } from "@/app/(auth)/registrer/validation"
import { ActionError } from "@/lib/safe-action/error"
import { authService } from "@/service/auth"
import { redirect } from "next/navigation"

export const signUpAction = publicAction
  .schema(signUpValidation)
  .action(async ({ parsedInput }) => {
    const exist = await userService.getByEmail(parsedInput.email)
    if (exist) {
      throw new ActionError("En bruger med den email findes allerede")
    }

    const newUser = await userService.register({ email: parsedInput.email, hash: parsedInput.password })
    const newSessionID = await authService.createSession(newUser.id)

    redirect("/oversigt")
  })
