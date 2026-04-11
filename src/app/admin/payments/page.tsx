"use client";

import { useState, useEffect } from "react";

interface Payment {
  id: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  amount: number;
  paymentMethod: "PIX" | "CARD";
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  message?: string | null;
  createdAt: string;
  item: { name: string };
}

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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const limit = 20;

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setLoading(false);
    };
    fetchPayments();
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-gray-800">Pagamentos</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] bg-white text-gray-600"
        >
          <option value="">Todos</option>
          <option value="APPROVED">Aprovados</option>
          <option value="PENDING">Pendentes</option>
          <option value="REJECTED">Recusados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-400">Nenhum pagamento encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Comprador</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4 hidden md:table-cell">Item</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4 hidden md:table-cell">Método</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4">Valor</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4 hidden lg:table-cell">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-700">{p.buyerName || "Anônimo"}</p>
                    {p.buyerEmail && <p className="text-xs text-gray-400">{p.buyerEmail}</p>}
                    {p.message && (
                      <p className="text-xs text-[#6DB567] mt-0.5 italic truncate max-w-[200px]">
                        &ldquo;{p.message}&rdquo;
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-600">{p.item.name}</td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.paymentMethod === "PIX" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#C9A84C]">
                    {p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-50">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Anterior</button>
              <span className="px-3 py-1.5 text-sm text-gray-500">{page}/{totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Próximo</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
