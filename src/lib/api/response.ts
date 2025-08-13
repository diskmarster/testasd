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
  created: function <T>(data: T): NextResponse<ApiResponseSuccess<T>> {
    return NextResponse.json({ data }, { status: 201 })
  },
	noContent: function() {
		return new NextResponse(null, { status: 204 })
	},
  badRequest: function (
    error: string,
    requestId: string,
  ): NextResponse<ApiResponseError> {
    return NextResponse.json({ error, requestId }, { status: 400 })
  },
  notFound: function (
    error: string,
    requestId: string,
  ): NextResponse<ApiResponseError> {
    return NextResponse.json({ error, requestId }, { status: 404 })
  },
  unauthorized: function (
    error: string,
    requestId: string,
  ): NextResponse<ApiResponseError> {
    return NextResponse.json({ error, requestId }, { status: 401 })
  },
  locked: function (
    error: string,
    requestId: string,
  ): NextResponse<ApiResponseError> {
    return NextResponse.json({ error, requestId }, { status: 423 })
  },
  internal: function (
    error: string,
    requestId: string,
  ): NextResponse<ApiResponseError> {
    return NextResponse.json({ error, requestId }, { status: 500 })
  },
	internalErrors: function (
		message: string,
		errors: any | any[],
		requestId: string,
	) {
		return NextResponse.json({ message, errors, requestId }, { status: 500 })
	}
}
