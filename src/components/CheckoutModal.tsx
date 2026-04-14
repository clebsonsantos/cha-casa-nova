"use client";

import { useState, useRef } from "react";

interface Item {
  id: string;
  name: string;
  pixPrice: number;
  cardPrice: number;
  pixCode?: string | null;
}

interface CheckoutModalProps {
  item: Item;
  method: "PIX" | "CARD";
  pixManual?: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ item, method, pixManual = false, onClose }: CheckoutModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const price = method === "PIX" ? item.pixPrice : item.cardPrice;

  const copyPixCode = () => {
    if (!item.pixCode) return;
    navigator.clipboard.writeText(item.pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (pixManual) {
        let receiptKey: string | undefined;

        if (receiptFile) {
          const uploadRes = await fetch("/api/upload/receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentType: receiptFile.type, size: receiptFile.size }),
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Erro ao preparar upload");

          const putRes = await fetch(uploadData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": receiptFile.type },
            body: receiptFile,
          });
          if (!putRes.ok) throw new Error("Erro ao enviar comprovante");

          receiptKey = uploadData.key;
        }

        const res = await fetch("/api/checkout/pix-manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: item.id,
            buyerName: buyerName || undefined,
            buyerEmail: buyerEmail || undefined,
            message: message || undefined,
            receiptKey,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao registrar pagamento");

        window.location.href = `/obrigado?payment_id=${data.paymentId}&status=success`;
      } else {
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

        window.open(data.checkoutUrl, "_blank", "noopener");
        window.location.href = `/obrigado?payment_id=${data.paymentId}&status=pending`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-4">
        <div className="bg-[#A9DCA4] px-6 py-5">
          <h2 className="font-[var(--font-playfair)] text-xl font-bold text-white">
            Finalizar Presente
          </h2>
          <p className="text-white/80 text-sm mt-1 uppercase tracking-wide">{item.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#D4EED1] rounded-2xl">
            <span className="text-sm font-medium text-gray-600">
              {pixManual || method === "PIX" ? "Pagamento via PIX" : "Pagamento via Cartão"}
            </span>
            <span className="text-xl font-bold text-[#C9A84C]">
              {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          {pixManual && item.pixCode && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Código PIX Copia e Cola</p>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-start gap-3">
                <code className="text-xs text-gray-600 flex-1 break-all leading-relaxed font-mono">
                  {item.pixCode}
                </code>
                <button
                  type="button"
                  onClick={copyPixCode}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                    copied ? "bg-[#A9DCA4] text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Abra o app do seu banco, use PIX Copia e Cola e faça o pagamento.
              </p>
            </div>
          )}

          {pixManual && !item.pixCode && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
              Chave PIX não configurada para este item.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu nome <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Como posso te chamar?"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
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
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
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
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{message.length}/500</p>
          </div>

          {pixManual && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprovante <span className="text-red-400">*</span>
              </label>
              {receiptFile ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-2xl">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-700 flex-1 truncate">{receiptFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center gap-2 border border-dashed border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Anexar comprovante (imagem ou PDF)
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          )}

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
              disabled={loading || (pixManual && !item.pixCode) || (pixManual && !receiptFile)}
              className="flex-1 bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Aguarde..." : pixManual ? "Já presenteei" : "Ir para pagamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
