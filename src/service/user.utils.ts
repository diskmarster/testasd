import * as jwt from 'jsonwebtoken'
import { User, UserNoHash } from '@/lib/database/schema/auth'
import { hash, verify } from '@node-rs/argon2'
import { sessionService } from './session'
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

export type JWTObject = {
  sessionId: string,
  user: UserNoHash,
}

export function signJwt(payload: JWTObject): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string)
}

type JWTFailed = {
  name: 'TokenExpiredError' | 'JsonWebTokenError' | 'NotBeforeError',
  message: string,
  expiredAt?: number,
  date?: string,
}

export type VerifyJWTResponse = {
  ok: true,
  data: JWTObject,
  error?: undefined,
} | {
  ok: false,
  data?: undefined,
  error: JWTFailed,
}
export function verifyJWT(jwtString: string): VerifyJWTResponse {
  try {
    const payload = jwt.verify(jwtString, process.env.JWT_SECRET as string)

    let jwtObj: JWTObject
    if (typeof payload == "string") {
      jwtObj = JSON.parse(payload);
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

export async function validateRequest(request: Request): Promise<{ session: any, user: any } | { session: null, user: null }> {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      console.error("No authentication header found")
      return {
        session: null,
        user: null,
      }
    }

    const authWords = authHeader.split(' ')
    if (authWords.length != 2 || !authWords[0].toLowerCase().includes('bearer')) {
      console.error("Invalid authentication header")
      return {
        session: null,
        user: null,
      }
    }

    const jwtString = authWords[1]

    const res = verifyJWT(jwtString)
    if (!res.ok) {
      console.error("Could not verify jwt")
      return {
        session: null,
        user: null,
      }
    }

    console.log("jwtData:", JSON.stringify(res.data, null, 2))

    return await sessionService.validateSessionId(res.data.sessionId)
  } catch (e) {
    console.error(`Error validation request: '${(e as Error).message}'`)
    return {
      session: null,
      user: null,
    }
  }
}
