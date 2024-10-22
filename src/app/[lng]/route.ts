import { sessionService } from '@/service/session'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { fallbackLng } from '../i18n/settings'

export async function GET(r: NextRequest) {
  const { session } = await sessionService.validate()
  const lng = cookies().get('i18next')?.value ?? fallbackLng
  if (!session) {
    return NextResponse.redirect(new URL(`/${lng}/log-ind`, r.nextUrl))
  }

  return NextResponse.redirect(new URL(`/${lng}/oversigt`, r.nextUrl))
}
