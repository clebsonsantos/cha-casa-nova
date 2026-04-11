"use client";

import { useState } from "react";

interface Item {
  id: string;
  name: string;
  pixPrice: number;
  cardPrice: number;
}

interface CheckoutModalProps {
  item: Item;
  method: "PIX" | "CARD";
  onClose: () => void;
}

export default function CheckoutModal({ item, method, onClose }: CheckoutModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const price = method === "PIX" ? item.pixPrice : item.cardPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          paymentMethod: method,
          buyerName: buyerName || undefined,
          buyerEmail: buyerEmail || undefined,
          message: message || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar pagamento");

      // Abre o checkout do MP em nova aba e mantém nossa página fazendo polling
      window.open(data.checkoutUrl, "_blank", "noopener");
      window.location.href = `/obrigado?payment_id=${data.paymentId}&status=pending`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#A9DCA4] px-6 py-5">
          <h2 className="font-[var(--font-playfair)] text-xl font-bold text-white">
            Finalizar Presente
          </h2>
          <p className="text-white/80 text-sm mt-1">{item.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#D4EED1] rounded-2xl">
            <span className="text-sm font-medium text-gray-600">
              {method === "PIX" ? "Pagamento via PIX" : "Pagamento via Cartão"}
            </span>
            <span className="text-xl font-bold text-[#C9A84C]">
              {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu nome <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Como posso te chamar?"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail <span className="text-gray-400">(opcional, para recibo)</span>
            </label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deixe um recadinho carinhoso..."
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{message.length}/500</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Aguarde..." : "Ir para pagamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
