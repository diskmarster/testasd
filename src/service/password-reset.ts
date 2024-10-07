import { passwordReset } from '@/data/password-reset'
import { ResetPasswordID } from '@/lib/database/schema/auth'
import { ACTION_ERR_INTERNAL, ActionError } from '@/lib/safe-action/error'
import { userService } from './user'
import { emailService } from './email'
import { EmailTest } from '@/components/email/email-test'

const RESET_PASSWORD_LINK_BASEURL =
  process.env.VERCEL_ENV === 'production'
    ? 'https://lager.nemunivers.app'
    : process.env.VERCEL_ENV === 'preview'
      ? 'stage.lager.nemunivers.app'
      : 'http://localhost:3000'

export type ResetPasswordLink =
  `${typeof RESET_PASSWORD_LINK_BASEURL}/glemt-password/${ResetPasswordID}`

const LINK_DURATION_MINUTES = 30

export const passwordResetService = {
  createLink: async function(
    userEmail: string,
  ): Promise<ResetPasswordLink | undefined> {
    const user = await userService.getByEmail(userEmail)
    if (!user) {
      throw new ActionError('Ingen bruger med denne email fundet')
    }

    try {
      const id: ResetPasswordID | undefined =
        await passwordReset.createPasswordReset(user.id, LINK_DURATION_MINUTES)
      if (!id) {
        return undefined
      }

      return `${RESET_PASSWORD_LINK_BASEURL}/glemt-password/${id}`
    } catch (e) {
      console.error(e)
      throw new ActionError(
        `${ACTION_ERR_INTERNAL}. Kunne ikke oprette link til nulstilling af kodeord`,
      )
    }
  },
  createAndSendLink: async function(userEmail: string): Promise<boolean> {
    const resetPasswordLink = this.createLink(userEmail)
    if (!resetPasswordLink) {
      return false
    }

    emailService.sendRecursively(
      [userEmail],
      "Nulstil kodeord",
      EmailTest()
    )

    return true
  },
}
