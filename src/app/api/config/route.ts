import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// Chaves cujo valor nunca é enviado ao frontend (substituído por "••••••••")
const SENSITIVE_KEYS = new Set([
  "mp_access_token",
  "r2_secret_access_key",
  "r2_access_key_id",
]);

export async function GET() {
  try {
    await requireSession();
    const configs = await prisma.siteConfig.findMany();
    const result: Record<string, string> = {};
    configs.forEach((c) => {
      result[c.key] = SENSITIVE_KEYS.has(c.key) && c.value ? "••••••••" : c.value;
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json() as Record<string, string>;

    await Promise.all(
      Object.entries(body)
        // Ignora campos mascarados (não houve edição real)
        .filter(([, value]) => !value.includes("••"))
        // Ignora strings vazias para chaves sensíveis (não apaga credenciais existentes)
        .filter(([key, value]) => !(SENSITIVE_KEYS.has(key) && value === ""))
        .map(([key, value]) =>
          prisma.siteConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          })
        )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
}
