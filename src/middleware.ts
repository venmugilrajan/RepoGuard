import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const PROTECTED_PREFIXES = ["/dashboard", "/repositories", "/findings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (!sessionCookie?.value) {
    const installUrl = new URL("/api/github/install", request.url);
    installUrl.searchParams.set("return_to", pathname);
    return NextResponse.redirect(installUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/repositories/:path*", "/findings/:path*"],
};
