import { NextResponse } from "next/server";
import { verifyDatabaseConnection } from "@/lib/db/connection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await verifyDatabaseConnection();
    return NextResponse.json({
      status: "ok",
      database: "connected",
    });
  } catch {
    return NextResponse.json(
      { status: "error", database: "disconnected" },
      { status: 503 },
    );
  }
}
