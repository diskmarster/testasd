import { NextRequest, NextResponse } from "next/server";

export async function GET(r: NextRequest) {
  // TODO: redirect based on if a session exists

  return NextResponse.redirect(new URL("/oversigt", r.nextUrl))
}
