import crypto from 'crypto'

const secret = process.env.EXT_ENCRYPTION_SECRET!
const algorithm = 'aes-256-gcm'
const ivLength = 12

export const apikeys = {
  encrypt: function (base: string): string {
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(
      algorithm,
      Buffer.from(secret, 'hex'),
      iv,
    )

    const encrypted = Buffer.concat([
      cipher.update(base, 'utf8'),
      cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    return Buffer.concat([iv, authTag, encrypted]).toString('base64')
  },
  decrypt: function (encrypted: string): string {
    const data = Buffer.from(encrypted, 'base64')
    const iv = data.subarray(0, ivLength)
    const authTag = data.subarray(ivLength, ivLength + 16)
    const encryptedText = data.subarray(ivLength + 16)

    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(secret, 'hex'),
      iv,
    )
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  },
}
