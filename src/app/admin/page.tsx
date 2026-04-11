export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getDashboardData() {
  // Using direct import to avoid fetch cycle
  const { prisma } = await import("@/lib/prisma");

  const [
    totalItems,
    activeItems,
    totalPayments,
    approvedPayments,
    pendingPayments,
    revenueResult,
    recentMessages,
    recentPayments,
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
      take: 5,
    }),
    prisma.payment.findMany({
      include: { item: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    totalItems,
    activeItems,
    totalPayments,
    approvedPayments,
    pendingPayments,
    totalRevenue: revenueResult._sum.amount || 0,
    recentMessages,
    recentPayments,
  };
}

export default async function AdminDashboard() {
  try {
    await requireSession();
  } catch {
    redirect("/admin/login");
  }

  const data = await getDashboardData();

  const statusColors: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<string, string> = {
    APPROVED: "Aprovado",
    PENDING: "Pendente",
    REJECTED: "Recusado",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-gray-800 mb-8">
        Dashboard
      </h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Itens ativos", value: data.activeItems, total: data.totalItems, color: "text-[#6DB567]", bg: "bg-[#D4EED1]" },
          { label: "Presentes dados", value: data.approvedPayments, color: "text-[#C9A84C]", bg: "bg-yellow-50" },
          { label: "Aguardando", value: data.pendingPayments, color: "text-orange-500", bg: "bg-orange-50" },
          {
            label: "Arrecadado",
            value: data.totalRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            color: "text-[#6DB567]",
            bg: "bg-[#D4EED1]",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-3xl p-5`}>
            <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            {"total" in stat && (
              <p className="text-xs text-gray-400 mt-1">de {stat.total} total</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Pagamentos Recentes</h2>
          {data.recentPayments.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum pagamento ainda</p>
          ) : (
            <div className="space-y-3">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{p.item.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.buyerName || "Anônimo"} •{" "}
                      {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#C9A84C]">
                      {p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Últimas Mensagens</h2>
          {data.recentMessages.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma mensagem ainda</p>
          ) : (
            <div className="space-y-3">
              {data.recentMessages.map((m) => (
                <div key={m.id} className="p-3 bg-[#D4EED1]/30 rounded-2xl">
                  <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{m.message}&rdquo;</p>
                  <p className="text-xs text-gray-400 mt-1">
                    — {m.buyerName || "Anônimo"}, ao presentear{" "}
                    <span className="font-medium">{m.item.name}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
