import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where = status ? { status: status as "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED" } : {};

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { item: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({ payments, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
}
