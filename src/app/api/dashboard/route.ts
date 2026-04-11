import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();

    const [
      totalItems,
      activeItems,
      totalPayments,
      approvedPayments,
      pendingPayments,
      revenueResult,
      recentMessages,
    ] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { active: true } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { message: { not: null } },
        select: {
          id: true,
          buyerName: true,
          message: true,
          createdAt: true,
          item: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      totalItems,
      activeItems,
      totalPayments,
      approvedPayments,
      pendingPayments,
      totalRevenue: revenueResult._sum.amount || 0,
      recentMessages,
    });
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
}
