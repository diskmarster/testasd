import { NextRequest, NextResponse } from "next/server";

export async function GET(r: NextRequest) {
  return NextResponse.json("pong")
}
