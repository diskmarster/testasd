import {hash} from '@node-rs/argon2'
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
