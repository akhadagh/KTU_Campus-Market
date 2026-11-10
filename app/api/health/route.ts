import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "campus-market",
      timestamp: new Date().toISOString(),
      checks: {
        database: process.env.DATABASE_URL ? "configured" : "not_configured",
        payments: process.env.PAYSTACK_SECRET_KEY ? "configured" : "not_configured",
        ai: process.env.AI_ENABLED === "true" ? "enabled" : "disabled",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
