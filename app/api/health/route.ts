import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function checkDatabase(): Promise<string> {
  if (!process.env["DATABASE_URL"]) {
    return "not_configured";
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const database = await checkDatabase();

  return NextResponse.json(
    {
      status: database === "error" ? "degraded" : "ok",
      service: "jumart",
      brand: "JUMART — Your Campus. Your Marketplace.",
      timestamp: new Date().toISOString(),
      checks: {
        database,
        payments: process.env["PAYSTACK_SECRET_KEY"] ? "configured" : "not_configured",
        ai: process.env["AI_ENABLED"] === "true" ? "enabled" : "disabled",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
