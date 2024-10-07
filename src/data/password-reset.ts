import * as dateFns from "date-fns";
import { db, TRX } from '@/lib/database'
import {
  ResetPasswordID,
  resetPasswordTable,
  UserID,
} from '@/lib/database/schema/auth'
import { generateId } from "lucia";

export const passwordReset = {
  createPasswordReset: async function(
    userID: UserID,
    linkDurationMinutes: number = 30,
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
      })
      .returning({ id: resetPasswordTable.id })

    return res?.id
  },
}
