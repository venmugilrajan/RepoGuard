import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { clearSession } from "@/lib/session";

export async function GET() {
  const env = getEnv();
  await clearSession();
  return NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_APP_URL));
}
