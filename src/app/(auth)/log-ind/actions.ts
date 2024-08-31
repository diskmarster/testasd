"use server"

import { publicAction } from "@/lib/safe-action"
import { userService } from "@/service/user"
import { signInValidation } from "@/app/(auth)/log-ind/validation"
import { ActionError } from "@/lib/safe-action/error"
import { sessionService } from "@/service/auth"
import { redirect } from "next/navigation"

export const signInAction = publicAction
  .schema(signInValidation)
  .action(async ({ parsedInput }) => {
    const existingUser = await userService.signIn(parsedInput.email, parsedInput.password)
    if (!existingUser) {
      throw new ActionError("Forkert email eller kodeord")
    }
    const newSessionID = await sessionService.create(existingUser.id)

    redirect("/oversigt")
  })
