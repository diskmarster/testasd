import { Resend } from 'resend'

// For local development, use a dummy key if RESEND_API_KEY is not set
const apiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_local_dev'

export const resendClient = new Resend(apiKey)
