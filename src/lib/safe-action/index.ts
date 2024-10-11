import { createSafeActionClient, MiddlewareResult } from "next-safe-action";
import { ACTION_ERR_UNAUTHORIZED, ActionError } from "@/lib/safe-action/error";
import { sessionService } from "@/service/session";
import { Session, User } from "lucia";
import { z } from "zod";

type ActionContexType = {session?: Session, user?: User}
const metadataSchema = z.object({
  actionName: z.string().optional(),
})

// public action client for unauthorized requests
export const publicAction = createSafeActionClient<undefined, string, typeof metadataSchema>({
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
  },
  defineMetadataSchema() {
    return metadataSchema
  },
})
.metadata({})
.use(async (input) => {
  const start = performance.now()

  const res: MiddlewareResult<string, ActionContexType> = await input.next<ActionContexType>()

  const end = performance.now()

  if (res.success 
      && input.metadata.actionName
      && res.ctx 
      // @ts-ignore -- TS apparently doesn't know that user can exist on ctx, even though we tell it the type of res...
      && res.ctx.user
  ) {
    console.log('meta ->', input.metadata)
    console.log('res ->', res)
    console.log(`execution time: ${end - start} ms`)
  }

  return res
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
