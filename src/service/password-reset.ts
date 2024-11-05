import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { EmailResetPassword } from '@/components/email/email-reset-password'
import { passwordReset } from '@/data/password-reset'
import { ResetPasswordType } from '@/data/user.types'
import {
  ResetPassword,
  ResetPasswordID,
  UserID,
} from '@/lib/database/schema/auth'
import { ACTION_ERR_INTERNAL, ActionError } from '@/lib/safe-action/error'
import { isBefore } from 'date-fns'
import { emailService } from './email'
import { userService } from './user'

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
    pwType: ResetPasswordType = 'pw',
    lang: string = fallbackLng,
  ): Promise<ResetPasswordLink | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    const user = await userService.getByEmail(userEmail)
    if (!user) {
      throw new ActionError(t('password-reset-action.no-user-with-email'))
    }

    try {
      const id: ResetPasswordID | undefined =
        await passwordReset.createPasswordReset(
          user.id,
          pwType,
          LINK_DURATION_MINUTES,
        )
      if (!id) {
        return undefined
      }

      return `${RESET_PASSWORD_LINK_BASEURL}/glemt-password/${id}`
    } catch (e) {
      console.error(e)
      throw new ActionError(
        `${ACTION_ERR_INTERNAL}. ${t('password-reset-action.couldnt-create-link')}`,
      )
    }
  },
  createAndSendLink: async function(
    userEmail: string,
    pwType: ResetPasswordType = 'pw',
    lang: string = fallbackLng,
  ): Promise<boolean> {
    const resetPasswordLink = await this.createLink(userEmail, pwType, lang)
    if (!resetPasswordLink) {
      return false
    }

    await emailService.sendRecursively(
      [userEmail],
      `Nulstil ${pwType == 'pw' ? 'adgangskode' : 'pin'}`,
      EmailResetPassword({ link: resetPasswordLink, pwType: pwType }),
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
      isExpired: () => isBefore(link.expiresAt, Date.now()),
    }
  },
  reset: async function(
    linkID: ResetPasswordID,
    userID: UserID,
    password: string,
    lang: string = fallbackLng,
  ): Promise<boolean> {
    const { t } = await serverTranslation(lang, 'action-errors')
    const link = await this.getLinkById(linkID)
    if (!link || link.isExpired()) {
      throw new ActionError(t('forgot-password-action.expired'))
    }

    if (link.passwordType == 'pw') {
      const user = await userService.updatePassword(userID, password)
      if (!user) {
        return false
      }
    } else if (link.passwordType == 'pin') {
      const user = await userService.updatePin(userID, password)
      if (!user) {
        return false
      }
    }

    return await this.deleteLink(linkID)
  },
  deleteLink: async function(id: ResetPasswordID): Promise<boolean> {
    return await passwordReset.deletePasswordReset(id)
  },
}
