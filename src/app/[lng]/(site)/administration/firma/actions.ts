'use server'

import { serverTranslation } from '@/app/i18n'
import { hasPermissionByRank } from '@/data/user.types'
import { adminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createMailSetting, updateMailSettingsValidation } from './validation'

export const fetchLocationsForMailSettings = adminAction
  .schema(z.object({ customerID: z.coerce.number() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (hasPermissionByRank(user.role, 'administrator')) {
      const locations = await locationService.getByCustomerID(
        parsedInput.customerID,
      )
      return locations.map(l => ({ id: l.id, name: l.name }))
    } else {
      const locations = await locationService.getAllActiveByUserID(user.id)
      return locations.map(l => ({ id: l.id, name: l.name }))
    }
  })

export const fetchUsersAction = adminAction.action(
  async ({ ctx: { user } }) => {
    if (hasPermissionByRank(user.role, 'administrator')) {
      const users = await userService.getAllByCustomerID(user.customerID)
      return users
    } else {
      const users = await userService.getAllByCustomerIDFromAccess(user.customerID,user.id)
      return users
    }
  },
)

export const createMailSettingAction = adminAction
  .schema(createMailSetting)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'organisation')
    const mailSetting = await customerService.createMailSetting({
      ...parsedInput.mails,
      email: parsedInput.email,
      userID: parsedInput.userID,
      locationID: parsedInput.locationID,
      customerID: ctx.user.customerID,
    })
    if (!mailSetting) {
      throw new ActionError(t('mail-settings.errors.create-settings-success'))
    }

    const settingWithExtra = await customerService.getExtraMailInfo(mailSetting)
		revalidatePath(`/${ctx.lang}/administration/firma`)
    return settingWithExtra
  })

export const deleteMailSettingAction = adminAction
  .schema(z.object({ settingID: z.coerce.number() }))
  .action(async ({ parsedInput: { settingID }, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'organisation')
    const deleted = await customerService.deleteMailSetting(settingID)
    if (!deleted) {
      throw new ActionError(t('mail-settings.errors.delete-settings-failed'))
    }
    revalidatePath(`/${ctx.lang}/administration/firma`)
  })

export const updateMultipleMailSettings = adminAction
  .schema(updateMailSettingsValidation)
  .action(async ({ parsedInput, ctx }) => {
    let updatePromises = []

    for (const setting of parsedInput) {
      updatePromises.push(
        customerService.updateMailSetting(setting.id, setting),
      )
    }

    const responses = await Promise.all(updatePromises)
    const updatedIDs = responses.filter(Boolean).map(r => r?.id)
    const fullUpdate = updatedIDs.length == updatePromises.length
    revalidatePath(`/${ctx.lang}/administration/firma`)

    return {
      fullUpdate,
      ids: updatedIDs,
    }
  })
