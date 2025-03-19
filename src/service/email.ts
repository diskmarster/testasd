import { siteConfig } from '@/config/site'
import { resendClient } from '@/lib/resend'
import React from 'react'
import { ErrorResponse } from 'resend'

const FROM = `${siteConfig.name} <noreply@nemunivers.app>`
const MAX_ATTEMPTS = 5
const WAIT_MS = 1000
const MAX_WAIT = 60000 / MAX_ATTEMPTS

export const emailService = {
  sendOnce: async function (
    to: string[],
    subject: string,
    comp: React.ReactElement,
  ): Promise<ErrorResponse | null> {
    const { error } = await resendClient.emails.send({
      from: FROM,
      to: to,
      subject: subject,
      react: comp,
    })
    return error
  },
  sendRecursively: async function (
    to: string[],
    subject: string,
    comp: React.ReactElement,
    attachments: { path: string; filename: string }[] = [],
    attempt: number = 0,
    waitMs: number = WAIT_MS,
  ): Promise<void> {
    const { error } = await resendClient.emails.send({
      from: FROM,
      to: to,
      subject: subject,
      react: comp,
			attachments: attachments
    })

    if (error) {
      if (attempt >= MAX_ATTEMPTS) {
        // do like a tree and leave (get it? leaf...)
        console.error(`Failed to send email recursively after max attempts`)
      } else {
        const nextWaitMs = Math.min(waitMs * 2, MAX_WAIT)
        const nextAttempt = attempt + 1
        setTimeout(
          () =>
            this.sendRecursively(to, subject, comp, attachments, nextAttempt, nextWaitMs),
          waitMs,
        )
      }
    } else {
      // do like the sun and shine
      console.log(`Email send successfully after ${attempt} attempts`)
    }
  },
}
