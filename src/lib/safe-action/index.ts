import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { hasPermissionByRank } from '@/data/user.types'
import { ACTION_ERR_MAINTENANCE, ACTION_ERR_UNAUTHORIZED, ActionError } from '@/lib/safe-action/error'
import { analyticsService } from '@/service/analytics'
import { errorsService } from '@/service/errors'
import { sessionService } from '@/service/session'
import { Session, User } from 'lucia'
import { createSafeActionClient, MiddlewareResult } from 'next-safe-action'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { NewApplicationError } from '../database/schema/errors'
import { isMaintenanceMode } from '../utils.server'

export async function getSchema<T>(
  schema: (t: (key: string, options?: any) => string) => T,
  namespace: string = 'common',
) {
  const lng = cookies().get('i18next')?.value ?? fallbackLng
  const { t } = await serverTranslation(lng, namespace)
  return schema(t)
}
type ActionContextType = { session?: Session; user?: User }
const metadataSchema = z.object({
  actionName: z.string().optional(),
})

const baseClient = createSafeActionClient<
  undefined,
  string,
  typeof metadataSchema
>({
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
  .use(async ({ next, metadata, clientInput }) => {
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

    if (!res.success && ctx && ctx.user && metadata.actionName != 'signIn') {
      const errorLog: NewApplicationError = {
        userID: ctx.user.id,
        customerID: ctx.user.customerID,
        type: 'action',
        input: clientInput,
        error: res.serverError,
        origin: metadata.actionName ?? 'unavngivet',
      }
      errorsService.create(errorLog)
    }

    return res
  })

// public action client for unauthorized requests
export const publicAction = baseClient.use(async ({ next }) => {
  const lang = cookies().get('i18next')?.value ?? fallbackLng
  const { session, user } = await sessionService.validate()

  return next({ ctx: { session, user, lang } })
})

// authed action client for all authorized requests
export const authedAction = publicAction.use(async ({ next, ctx }) => {
  if (isMaintenanceMode()) {
    throw new ActionError(ACTION_ERR_MAINTENANCE)
  }

  if (!ctx.session || !ctx.user) {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }

  if (!ctx.user.webAccess) {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }

  return next({ ctx })
})

// editable action client for all users with rights to mutate data
export const editableAction = authedAction.use(async ({ next, ctx }) => {
  if (ctx.user.role == 'læseadgang') {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }

  return next({ ctx })
})

// admin action client for admin only requests
export const adminAction = editableAction.use(async ({ next, ctx }) => {
  if (!hasPermissionByRank(ctx.user.role, 'moderator')) {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }

  return next({ ctx })
})

// admin action client for admin only requests
export const sysAdminAction = adminAction.use(async ({ next, ctx }) => {
  if (!hasPermissionByRank(ctx.user.role, 'system_administrator')) {
    throw new ActionError(ACTION_ERR_UNAUTHORIZED)
  }

  return next({ ctx })
})
