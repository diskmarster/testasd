"use server"

import { publicAction } from "@/lib/safe-action"
import { userService } from "@/service/user"
import { signInValidation } from "@/app/(auth)/log-ind/validation"
import { ActionError } from "@/lib/safe-action/error"
import { redirect } from "next/navigation"
import { sessionService } from "@/service/session"

export const signInAction = publicAction
  .schema(signInValidation)
  .action(async ({ parsedInput }) => {
    const existingUser = await userService.verifyPassword(parsedInput.email.toLowerCase(), parsedInput.password)
    if (!existingUser) {
      throw new ActionError("Forkert email eller kodeord")
    }
    if (!existingUser.isActive) {
      throw new ActionError("Brugeren er inaktiv")
    }
    const newSessionID = await sessionService.create(existingUser.id)

    redirect("/oversigt")
  })
