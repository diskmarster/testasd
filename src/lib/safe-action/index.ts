import { fallbackLng } from '@/app/i18n/settings'
import { ACTION_ERR_UNAUTHORIZED, ActionError } from '@/lib/safe-action/error'
import { analyticsService } from '@/service/analytics'
import { sessionService } from '@/service/session'
import { Session, User } from 'lucia'
import { createSafeActionClient, MiddlewareResult } from 'next-safe-action'
import { cookies } from 'next/headers'
import { z } from 'zod'

type ActionContextType = { session?: Session; user?: User }
const metadataSchema = z.object({
  actionName: z.string().optional(),
})

const baseClient = createSafeActionClient<
  undefined,
  string,
  typeof metadataSchema
>({
  handleServerErrorLog(err, utils) {
    // TODO: implement third party logger or just insert into error table

    if (err instanceof ActionError) {
      console.error('ActionError thrown:', err, utils.bindArgsClientInputs)
    }

    console.error('Error thrown:', err, utils.bindArgsClientInputs)
  },
  handleReturnedServerError(err) {
    if (err instanceof ActionError) {
      return err.message
    }
    return 'Ukendt fejl opstået'
  },
  defineMetadataSchema() {
    return metadataSchema
  },
})
  .metadata({})
  .use(async ({ next, metadata }) => {
    const start = performance.now()

    const res: MiddlewareResult<string, ActionContextType> =
      await next<ActionContextType>()

    const end = performance.now()

    const ctx: ActionContextType | undefined = res.ctx
    if (
      res.success &&
      metadata.actionName &&
      ctx &&
      ctx.user &&
      ctx.user.id &&
      ctx.user.customerID
    ) {
      const user: User = ctx.user as User
      analyticsService.createAnalytic('action', {
        userID: user.id,
        customerID: user.customerID,
        sessionID: ctx.session?.id,
        actionName: metadata.actionName,
        executionTimeMS: end - start,
        platform: 'web',
      })
    }

    return res
  })

// public action client for unauthorized requests
export const publicAction = baseClient.use(async ({ next }) => {
  const lang = cookies().get('i18next')?.value ?? fallbackLng

  return next({ ctx: { lang } })
})

// private action client for all authorized requests
export const privateAction = publicAction.use(async ({ next, ctx }) => {
  const { session, user } = await sessionService.validate()

  if (!session || !user) {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }

  if (!user.webAccess) {
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
