import { NextResponse } from 'next/server'

type ApiResponseSuccess<T> = {
  data: T
}

type ApiResponseError = {
  error: string
  requestId: string
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError

export const apiResponse = {
  ok: function <T>(data: T): NextResponse<ApiResponseSuccess<T>> {
    return NextResponse.json({ data }, { status: 200 })
  },
  locked: function (
    error: string,
    requestId: string,
  ): NextResponse<ApiResponseError> {
    return NextResponse.json({ error, requestId }, { status: 423 })
  },
}
