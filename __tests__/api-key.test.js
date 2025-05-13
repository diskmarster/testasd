import { expect, test } from '@jest/globals'
import { apikeys } from '../src/lib/api-key/api-key'

test('encrypt/decrypt roundf trip', () => {
  const base = crypto.randomUUID()

  const encrypted = apikeys.encrypt(base)
  expect(encrypted).toBeDefined()

  const decrypted = apikeys.decrypt(encrypted)
  expect(decrypted).toEqual(base)
})

test('same base twice should give different key', () => {
  const base = 'my-secret-data'

  const encrypted1 = apikeys.encrypt(base)
  const encrypted2 = apikeys.encrypt(base)

  expect(encrypted1).not.toEqual(encrypted2)

  expect(apikeys.decrypt(encrypted1)).toEqual(base)
  expect(apikeys.decrypt(encrypted2)).toEqual(base)
})

test('decrypting invalid base64 should throw', () => {
  expect(() => apikeys.decrypt('invalid-base64')).toThrow()
})

test('decrypting tampered key should throw', () => {
  const encrypted = apikeys.encrypt('some-secret')
  const tampered = encrypted.slice(0, -4) + 'abcd'
  expect(() => apikeys.decrypt(tampered)).toThrow()
})

test('encrypt/decrypt empty string', () => {
  const encrypted = apikeys.encrypt('')
  const decrypted = apikeys.decrypt(encrypted)
  expect(decrypted).toEqual('')
})
