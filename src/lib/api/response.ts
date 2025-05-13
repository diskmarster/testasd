import { NextResponse } from 'next/server'

type ApiResponseSuccess<T> = {
  data: T
}

type ApiResponseError = {
  error: string
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError

export const apiResponse = {
  ok: function <T>(data: T): NextResponse<ApiResponseSuccess<T>> {
    return NextResponse.json({ data }, { status: 200 })
  },
  locked: function (error: string): NextResponse<ApiResponseError> {
    return NextResponse.json({ error }, { status: 423 })
  },
}
