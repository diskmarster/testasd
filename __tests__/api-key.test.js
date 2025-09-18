import { expect, test } from '@jest/globals'
import { hasher } from '../src/lib/hash/hasher'

test('encrypt/decrypt roundf trip', () => {
	const base = crypto.randomUUID()

	const encrypted = hasher.encrypt(base)
	expect(encrypted).toBeDefined()

	const decrypted = hasher.decrypt(encrypted)
	expect(decrypted).toEqual(base)
})

test('same base twice should give different key', () => {
	const base = 'my-secret-data'

	const encrypted1 = hasher.encrypt(base)
	const encrypted2 = hasher.encrypt(base)

	expect(encrypted1).not.toEqual(encrypted2)

	expect(hasher.decrypt(encrypted1)).toEqual(base)
	expect(hasher.decrypt(encrypted2)).toEqual(base)
})

test('decrypting invalid base64 should throw', () => {
	expect(() => hasher.decrypt('invalid-base64')).toThrow()
})

test('decrypting tampered key should throw', () => {
	const encrypted = hasher.encrypt('some-secret')
	const tampered = encrypted.slice(0, -4) + 'abcd'
	expect(() => hasher.decrypt(tampered)).toThrow()
})

test('encrypt/decrypt empty string', () => {
	const encrypted = hasher.encrypt('')
	const decrypted = hasher.decrypt(encrypted)
	expect(decrypted).toEqual('')
})

test('hashes are the same', () => {
	const base = 'my-secret-data'
	const hash1 = hasher.hash(base)
	const hash2 = hasher.hash(base)
	expect(hash1).toEqual(hash2)
})
