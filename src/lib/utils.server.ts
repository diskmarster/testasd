import { NextResponse } from "next/server"

export function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === '1'
}

type Success<T> = {
  success: true
  data: T
  error?: never
}

type Failure<E> = {
  success: false
  data?: never
  error: E
}

type SafeResult<T, E = Error> = Success<T> | Failure<E>

export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<SafeResult<T, E>> {
  try {
    const data = await promise
    return { data, error: undefined, success: true }
  } catch (error) {
    return { data: undefined, error: error as E, success: false }
  }
}

export function sendResponse(code: number, data: any = null) {
	if (data) {
		return new Response(JSON.stringify(data), { status: code })
	} else {
		return new Response(null,{ status: code })
	}
}
