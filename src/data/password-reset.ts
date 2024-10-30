import { db, TRX } from '@/lib/database'
import {
  ResetPassword,
  ResetPasswordID,
  resetPasswordTable,
  UserID,
} from '@/lib/database/schema/auth'
import * as dateFns from 'date-fns'
import { eq } from 'drizzle-orm'
import { generateId } from 'lucia'
import { ResetPasswordType } from './user.types'

export const passwordReset = {
  createPasswordReset: async function(
    userID: UserID,
    pwType: ResetPasswordType,
    linkDurationMinutes: number,
    trx: TRX = db,
  ): Promise<ResetPasswordID | undefined> {
    const id = generateId(16)
    const expiry = dateFns.addMinutes(Date.now(), linkDurationMinutes).getTime()

    const [res] = await trx
      .insert(resetPasswordTable)
      .values({
        id: id,
        userId: userID,
        expiresAt: expiry,
        passwordType: pwType,
      })
      .returning({ id: resetPasswordTable.id })

    return res?.id
  },
  getPasswordResetById: async function(
    id: ResetPasswordID,
    trx: TRX = db,
  ): Promise<ResetPassword | undefined> {
    const [res] = await trx
      .select()
      .from(resetPasswordTable)
      .where(eq(resetPasswordTable.id, id))

    return res
  },
  deletePasswordReset: async function(
    id: ResetPasswordID,
    trx: TRX = db,
  ): Promise<boolean> {
    const res = await trx
      .delete(resetPasswordTable)
      .where(eq(resetPasswordTable.id, id))

    return res.rowsAffected == 1
  },
}
