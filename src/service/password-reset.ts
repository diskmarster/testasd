import { EmailResetPassword } from '@/components/email/email-reset-password'
import { passwordReset } from '@/data/password-reset'
import { ResetPassword, ResetPasswordID, UserID } from '@/lib/database/schema/auth'
import { ACTION_ERR_INTERNAL, ActionError } from '@/lib/safe-action/error'
import { emailService } from './email'
import { userService } from './user'
import { isBefore } from 'date-fns'

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
    const resetPasswordLink = await this.createLink(userEmail)
    if (!resetPasswordLink) {
      return false
    }

    await emailService.sendRecursively(
      [userEmail],
      'Nulstil kodeord',
      EmailResetPassword({ link: resetPasswordLink }),
    )

    return true
  },
  getLinkById: async function(
    id: ResetPasswordID,
  ): Promise<(ResetPassword & { isExpired: () => boolean }) | undefined> {
    const link = await passwordReset.getPasswordResetById(id)
    if (!link) return undefined

    return {
      ...link,
      isExpired: () => isBefore(link.expiresAt, Date.now())
    }
  },
  reset: async function(
    linkID: ResetPasswordID,
    userID: UserID,
    password: string,
  ): Promise<boolean> {
    const user = await userService.updatePassword(userID, password)
    if (!user) {
      return false
    }

    return await this.deleteLink(linkID)
  },
  deleteLink: async function(
    id: ResetPasswordID,
  ): Promise<boolean> {
    return await passwordReset.deletePasswordReset(id)
  }
}
