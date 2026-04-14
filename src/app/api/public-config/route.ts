import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Chaves seguras para expor publicamente (sem auth)
const PUBLIC_KEYS = ["payment_mode"] as const;

export async function GET() {
  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: [...PUBLIC_KEYS] } },
  });

  const result: Record<string, string> = {};
  configs.forEach((c) => {
    result[c.key] = c.value;
  });

  return NextResponse.json(result);
}
