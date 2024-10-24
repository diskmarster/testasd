'use server'

import { serverTranslation } from '@/app/i18n'
import { EmailInviteUser } from '@/components/email/email-invite-user'
import { siteConfig } from '@/config/site'
import { adminAction, getSchema } from '@/lib/safe-action'
import { ACTION_ERR_INTERNAL, ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import {
  isLocationLimitReached,
  isUserLimitReached,
} from '@/service/customer.utils'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { passwordResetService } from '@/service/password-reset'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import {
  changeLocationStatusValidation,
  changeUserStatusValidation,
  createNewLocationValidation,
  editLocationValidation,
  editUserValidation,
  getLocationsByUserIDValidation,
  inviteNewUserValidation,
  resetUserPasswordValidation,
  updateCustomerValidation,
} from './validation'

export const toggleUserStatusAction = adminAction
  .metadata({ actionName: 'toggleUserStatus' })
  .schema(async () => await getSchema(changeUserStatusValidation, 'validation'))
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')

    if (parsedInput.status == "inactive" && parsedInput.userIDs.some(id => ctx.user.id == id)) {
      throw new ActionError(t('organisation-action.deactivate-own-user-error'))
    }

    const status = parsedInput.status == 'active' ? true : false
    const userTogglePromises = parsedInput.userIDs.map(uID => {
      return userService.updateStatus(uID, status)
    })

    let userInvalidatePromises: Promise<void>[] = []
    if (parsedInput.status) {
      userInvalidatePromises = parsedInput.userIDs.map(uID => {
        return sessionService.invalidateByID(uID)
      })
    }

    const toggleResponses = await Promise.allSettled([
      ...userTogglePromises,
      ...userInvalidatePromises,
    ])

    for (const resp of toggleResponses) {
      if (resp.status == 'rejected') {
        throw new ActionError(t('organisation-action.couldnt-update-users'))
      }
    }

    revalidatePath(`/${ctx.lang}/admin/organisation`)
  })

export const inviteNewUserAction = adminAction
  .metadata({ actionName: 'inviteNewUser' })
  .schema(async () => await getSchema(inviteNewUserValidation, 'validation'))
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError(t('organisation-action.existing-user-mail'))
    }

    const users = await userService.getAllByCustomerID(ctx.user.customerID)
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError(
        t('organisation-action.company-account-doesnt-exist'),
      )
    }

    if (isUserLimitReached(customer.plan, customer.extraUsers, users.length)) {
      throw new ActionError(t('organisation-action.company-user-limit-reached'))
    }

    const userInviteLink = await userService.createUserLink({
      email: parsedInput.email,
      role: parsedInput.role,
      customerID: ctx.user.customerID,
      locationIDs: parsedInput.locationIDs,
      webAccess: parsedInput.webAccess,
      appAccess: parsedInput.appAccess,
      priceAccess: parsedInput.priceAccess,
    })
    if (!userInviteLink) {
      throw new ActionError(
        t('organisation-action.couldnt-send-activation-link'),
      )
    }

    const subject = customer
      ? `${customer.company} ${t('organisation-action.has-invited-you')} ${siteConfig.name}`
      : `${t('organisation-action.you-have-been-invited')} ${siteConfig.name}`

    await emailService.sendRecursively(
      [parsedInput.email],
      subject,
      EmailInviteUser({ link: userInviteLink }),
    )
  })

export const createNewLocationAction = adminAction
  .metadata({ actionName: 'createNewLocation' })
  .schema(
    async () => await getSchema(createNewLocationValidation, 'validation'),
  )

  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    // 1. is location limit reached?
    // 2. does location exist?
    // 3. create location
    // 4. create defualt batch and placement for location
    // 5. create zero-quantaties for every product for new location
    // 6. add user accesses for userIDs
    // 7. revalidates pathname

    const locations = await locationService.getByCustomerID(ctx.user.customerID)
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError(t('organisation-action.company-account-doesnt-exist'))
    }

    if (isLocationLimitReached(customer.plan, locations.length)) {
      throw new ActionError(
        t('organisation-action.company-location-limit-reached'),
      )
    }

    const existingLocation = await locationService.getByName(
      parsedInput.name.trim(),
      customer.id,
    )
    if (existingLocation) {
      throw new ActionError(t('organisation-action.location-already-exists'))
    }

    const didCreateLocation = await locationService.createWithAccess(
      parsedInput.name,
      parsedInput.customerID,
      parsedInput.userIDs,
    )
    if (!didCreateLocation) {
      throw new ActionError(t('organisation-action.location-not-created'))
    }

    revalidatePath(parsedInput.pathname)
  })

export const editLocationAction = adminAction
  .metadata({ actionName: 'editLocation' })
  .schema(async () => await getSchema(editLocationValidation, 'validation'))

  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    // 1. fetch old accesses for location
    // 2. update location name
    // 3. create/remove user accesses
    // 4. revalidate path

    const oldLocationAccesses = await locationService.getAccessesByLocationID(
      parsedInput.locationID,
    )
    const oldUsersAccess = oldLocationAccesses.map(old => old.userID)

    const didUpdateLocation = await locationService.updateLocation(
      parsedInput.locationID,
      ctx.user.customerID,
      parsedInput.name,
      oldUsersAccess,
      parsedInput.userIDs,
      ctx.lang,
    )
    if (!didUpdateLocation) {
      throw new ActionError(t('organisation-action.location-not-updated'))
    }

    revalidatePath(`/${ctx.lang}/admin/organisation`)
  })

export const changeLocationStatusAction = adminAction
  .metadata({ actionName: 'changeLocation' })
  .schema(
    async () => await getSchema(changeLocationStatusValidation, 'validation'),
  )

  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    // 1. toggle location by ID
    // 2. revalidate path

    const status = parsedInput.status == 'active' ? false : true
    const locationTogglePromises = parsedInput.locationIDs.map(
      (locID: string) => {
        return locationService.updateStatus(locID, status)
      },
    )

    const toggleResponses = await Promise.allSettled(locationTogglePromises)

    for (const resp of toggleResponses) {
      if (resp.status == 'rejected') {
        throw new ActionError(t('organisation-action.couldnt-update-locations'))
      }
      if (resp.status == 'fulfilled' && resp.value == false) {
        throw new ActionError(t('organisation-action.couldnt-update-locations'))
      }
    }

    revalidatePath(`/${ctx.lang}/admin/organisation`)
  })

export const updateCustomerAction = adminAction
  .metadata({ actionName: 'updateCustomer' })
  .schema(async () => await getSchema(updateCustomerValidation, 'validation'))

  .action(async ({ parsedInput, ctx: { user, lang } }) => {
    const { t } = await serverTranslation(lang, 'action-errors')
    const updatedCustomer = customerService.updateByID(user.customerID, {
      ...parsedInput,
    })
    if (!updatedCustomer) {
      throw new ActionError(t('organisation-action.customer-wasnt-updated'))
    }
    revalidatePath(`/${lang}/admin/organisation`)
  })

export const resetUserPasswordAction = adminAction
  .metadata({ actionName: 'resetUserPassword' })
  .schema(resetUserPasswordValidation)

  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const linkCreated = await passwordResetService.createAndSendLink(
      parsedInput.email,
      ctx.lang,
    )
    if (!linkCreated) {
      throw new ActionError(
        `${ACTION_ERR_INTERNAL}. ${t('organisation-action.couldnt-create-reset-link')}`,
      )
    }
  })

export const editUserAction = adminAction
  .metadata({ actionName: 'editUser' })
  .schema(async () => await getSchema(editUserValidation, 'organisation'))
  .action(async ({ parsedInput: { userID, data }, ctx: { user, lang } }) => {
    const { t } = await serverTranslation(lang, 'actions-errors')

    const {locationIDs, ...userData} = data

    const updatedUser = await userService.updateByID(userID, {
      ...userData,
    })

    if (!updatedUser) {
      throw new ActionError(t('organisation-action.user-wasnt-updated'))
    }

    const updated = await locationService.updateAccessByUserID(userID, user.customerID, locationIDs)
    if (!updated) {
      throw new ActionError(t('organisation-action.user-locations-wasnt-updated'))
    }
  })

export const getLocationsByUserIDAction = adminAction
  // No metadata, since we dont need to log when querying data
  .schema(getLocationsByUserIDValidation)
  .action(async ({ parsedInput: { userID } }) => {
    return await locationService.getAllByUserID(userID)
  })
