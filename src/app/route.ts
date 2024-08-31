import { sessionService } from "@/service/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(r: NextRequest) {
  const { session } = await sessionService.validate()

  if (!session) {
    return NextResponse.redirect(new URL("/log-ind", r.nextUrl))
  }

  return NextResponse.redirect(new URL("/oversigt", r.nextUrl))
}
