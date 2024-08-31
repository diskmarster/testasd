import { User, UserNoHash } from '@/lib/database/schema/auth'
import { hash, verify } from '@node-rs/argon2'
const MEMORY_COST = 19456
const TIME_COST = 2
const OUTPUT_LEN = 32
const PARELLELISM = 1

export async function hashPassword(pw: string): Promise<string> {
  const hashed = await hash(pw, {
    memoryCost: MEMORY_COST,
    timeCost: TIME_COST,
    outputLen: OUTPUT_LEN,
    parallelism: PARELLELISM
  })
  return hashed
}

export async function verifyPassword(hash: string, unhashed: string): Promise<boolean> {
  const valid = await verify(hash, unhashed, {
    memoryCost: MEMORY_COST,
    timeCost: TIME_COST,
    outputLen: OUTPUT_LEN,
    parallelism: PARELLELISM
  })
  return valid
}

export function userDTO(u: User): UserNoHash {
  const { hash, ...rest } = u
  const user = { ...rest }
  return user
}
