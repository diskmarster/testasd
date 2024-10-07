import { passwordReset } from '@/data/password-reset'
import { ResetPasswordID } from '@/lib/database/schema/auth'
import { ACTION_ERR_INTERNAL, ActionError } from '@/lib/safe-action/error'
import { userService } from './user'

export const passwordResetService = {
  create: async function(
    userEmail: string,
  ): Promise<ResetPasswordID | undefined> {
    const user = await userService.getByEmail(userEmail)
    if (!user) {
      throw new ActionError('Ingen bruger med denne email fundet')
    }

    try {
      return passwordReset.createPasswordReset(user.id)
    } catch (e) {
      console.error(e)
      throw new ActionError(
        `${ACTION_ERR_INTERNAL}. Kunne ikke oprette link til nulstilling af kodeord`,
      )
    }
  },
}
