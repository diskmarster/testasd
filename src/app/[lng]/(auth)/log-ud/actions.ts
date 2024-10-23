'use server'

import { publicAction } from '@/lib/safe-action'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export const signOutAction = publicAction
  .metadata({ actionName: 'signOut' })
  .action(async ({ ctx }) => {
    if (ctx.session) {
      await sessionService.delete(ctx.session.id)
    }
    return redirect(`/${ctx.lang}/log-ind`)
  })
