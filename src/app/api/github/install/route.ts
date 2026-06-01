import { NextResponse } from "next/server";
import { getAppInstallUrl } from "@/lib/github/app";

export async function GET(request: Request) {
  const returnTo =
    new URL(request.url).searchParams.get("return_to") ?? "/dashboard";
  const state = Buffer.from(
    JSON.stringify({ returnTo, issuedAt: Date.now() }),
  ).toString("base64url");

  return NextResponse.redirect(getAppInstallUrl(state));
}
