import { createSafeActionClient } from "next-safe-action";
import { ACTION_ERR_UNAUTHORIZED, ActionError } from "@/lib/safe-action/error";
import { sessionService } from "@/service/session";

// public action client for unauthorized requests
export const publicAction = createSafeActionClient({
  handleServerErrorLog(err, utils) {
    // TODO: implement third party logger or just insert into error table

    if (err instanceof ActionError) {
      console.error("ActionError thrown:", err, utils.bindArgsClientInputs)
    }

    console.error("Error thrown:", err, utils.bindArgsClientInputs)
  },
  handleReturnedServerError(err) {
    if (err instanceof ActionError) {
      return err.message
    }
    return "Ukendt fejl opstået"
  }
})

// private action client for all authorized requests
export const privateAction = publicAction.use(async ({ next }) => {
  const { session, user } = await sessionService.validate()

  if (!session || !user) {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }

  return next({ ctx: { session, user } })
})

// admin action client for admin only requests
export const adminAction = privateAction.use(async ({ next, ctx }) => {
  if (!ctx.user.role.includes('admin')) {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }
  return next({ ctx })
})
