"use server"

import { privateAction } from "@/lib/safe-action"
import { sessionService } from "@/service/session"
import { redirect } from "next/navigation"

export const signOutAction = privateAction.action(async ({ ctx }) => {
  await sessionService.delete(ctx.session.id)
  return redirect("/log-ind")
})
