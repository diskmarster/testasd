import { z } from 'zod'

export const deleteUserByIDValidation = z.object({ userID: z.coerce.number() })

export const deleteInviteLinkValidation = z.object({
  linkID: z.string(),
})

export const refreshInviteLinkValidation = z.object({
  linkID: z.string(),
})
