export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminMessagesPage() {
  try {
    await requireSession();
  } catch {
    redirect("/admin/login");
  }

  const messages = await prisma.payment.findMany({
    where: { message: { not: null } },
    select: {
      id: true,
      buyerName: true,
      message: true,
      createdAt: true,
      status: true,
      amount: true,
      item: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-gray-800 mb-8">
        Mensagens dos Amigos
      </h1>

      {messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-400">Nenhuma mensagem recebida ainda</p>
          <p className="text-gray-300 text-sm mt-1">As mensagens aparecerão aqui quando os amigos fizerem compras</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4EED1] flex items-center justify-center text-[#6DB567] font-bold text-sm">
                    {(m.buyerName || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-700">
                      {m.buyerName || "Anônimo"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Presenteou: {m.item.name}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-[#C9A84C]">
                    {m.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <blockquote className="border-l-4 border-[#A9DCA4] pl-4 py-1">
                <p className="text-gray-600 text-sm leading-relaxed italic">{m.message}</p>
              </blockquote>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
