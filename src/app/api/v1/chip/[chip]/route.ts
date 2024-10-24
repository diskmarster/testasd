import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: { chip } }: { params: { chip: string } },
) {
  return NextResponse.json({ count: 7 })
}
