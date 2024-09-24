import { User, UserNoHash } from '@/lib/database/schema/auth'
import { hash, verify } from '@node-rs/argon2'
import * as jwt from 'jsonwebtoken'
const MEMORY_COST = 19456
const TIME_COST = 2
const OUTPUT_LEN = 32
const PARELLELISM = 1

export async function hashPassword(pw: string): Promise<string> {
  const hashed = await hash(pw, {
    memoryCost: MEMORY_COST,
    timeCost: TIME_COST,
    outputLen: OUTPUT_LEN,
    parallelism: PARELLELISM,
  })
  return hashed
}

export async function verifyPassword(
  hash: string,
  unhashed: string,
): Promise<boolean> {
  const valid = await verify(hash, unhashed, {
    memoryCost: MEMORY_COST,
    timeCost: TIME_COST,
    outputLen: OUTPUT_LEN,
    parallelism: PARELLELISM,
  })
  return valid
}


export function userDTO(u: User): UserNoHash {
  const { hash, ...rest } = u
  const user = { ...rest }
  return user
}

export type JWTObject = {
  sessionId: string
  user: UserNoHash
}

export function signJwt(payload: JWTObject): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string)
}

type JWTFailed = {
  name: 'TokenExpiredError' | 'JsonWebTokenError' | 'NotBeforeError'
  message: string
  expiredAt?: number
  date?: string
}

export type VerifyJWTResponse =
  | {
      ok: true
      data: JWTObject
      error?: undefined
    }
  | {
      ok: false
      data?: undefined
      error: JWTFailed
    }
export function verifyJWT(jwtString: string): VerifyJWTResponse {
  try {
    const payload = jwt.verify(jwtString, process.env.JWT_SECRET as string)

    let jwtObj: JWTObject
    if (typeof payload == 'string') {
      jwtObj = JSON.parse(payload)
    } else {
      jwtObj = {
        sessionId: payload.sessionId,
        user: payload.user,
      }
    }

    return {
      ok: true,
      data: jwtObj,
    }
  } catch (e) {
    return {
      ok: false,
      error: e as JWTFailed,
    }
  }
}
