import { NextRequest, NextResponse } from "next/server";

// this function will execute on clicking a confirmation email from Supabase
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}
