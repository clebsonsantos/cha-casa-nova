"use client";

import { useState } from "react";
import Image from "next/image";

interface Item {
  id: string;
  name: string;
  description: string;
  pixPrice: number;
  cardPrice: number;
  imageUrl?: string | null;
  active: boolean;
}

interface ItemFormProps {
  item?: Item | null;
  r2Configured?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ItemForm({ item, r2Configured = false, onClose, onSaved }: ItemFormProps) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [pixPrice, setPixPrice] = useState(item?.pixPrice?.toString() || "");
  const [cardPrice, setCardPrice] = useState(item?.cardPrice?.toString() || "");
  // Se imageUrl veio como /api/image?key=xxx, extrai a key bruta para edição
  const rawKey = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/api/image?key=")) return decodeURIComponent(url.replace("/api/image?key=", ""));
    return url;
  };
  // Armazena a key do R2 (ex: "uploads/xxx.jpg") — nunca a URL pública
  const [imageKey, setImageKey] = useState(rawKey(item?.imageUrl || ""));
  // Preview: se for key R2 usa /api/image, senão usa a URL diretamente
  const previewUrl = imageKey
    ? imageKey.startsWith("http")
      ? imageKey
      : `/api/image?key=${encodeURIComponent(imageKey)}`
    : "";
  const [active, setActive] = useState(item?.active ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // 1. Pede URL pré-assinada ao servidor (sem transferir bytes para o R2)
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar URL de upload");

      // 2. Browser envia o arquivo diretamente ao R2
      const putRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Erro ao enviar arquivo ao R2");

      setImageKey(data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const pix = parseFloat(pixPrice.replace(",", "."));
    const card = parseFloat(cardPrice.replace(",", "."));

    if (isNaN(pix) || pix <= 0) {
      setError("Preço PIX inválido");
      setSaving(false);
      return;
    }
    if (isNaN(card) || card <= 0) {
      setError("Preço Cartão inválido");
      setSaving(false);
      return;
    }

    try {
      const url = item ? `/api/items/${item.id}` : "/api/items";
      const method = item ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          pixPrice: pix,
          cardPrice: card,
          imageUrl: imageKey || undefined,
          active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg my-4">
        <div className="bg-[#A9DCA4] px-6 py-5 rounded-t-3xl">
          <h2 className="font-[var(--font-playfair)] text-xl font-bold text-white">
            {item ? "Editar Item" : "Novo Item"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagem</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[#D4EED1] overflow-hidden flex-shrink-0">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#A9DCA4]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className={`border border-dashed rounded-2xl px-4 py-3 text-sm flex items-center gap-2 transition-colors ${
                  r2Configured
                    ? "cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-500"
                    : "cursor-not-allowed bg-gray-50 border-gray-200 text-gray-300"
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploading ? "Enviando..." : r2Configured ? "Selecionar imagem" : "R2 não configurado"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading || !r2Configured}
                  />
                </label>
                {!r2Configured && (
                  <p className="mt-1 text-xs text-gray-400">Configure o Cloudflare R2 em <span className="font-medium">Settings → Armazenamento</span></p>
                )}
                {imageKey && r2Configured && (
                  <button
                    type="button"
                    onClick={() => setImageKey("")}
                    className="mt-1 text-xs text-red-400 hover:text-red-600"
                  >
                    Remover imagem
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Jogo de panelas"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Descreva o item..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço PIX (R$) *
              </label>
              <input
                type="text"
                value={pixPrice}
                onChange={(e) => setPixPrice(e.target.value)}
                required
                placeholder="89,90"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Cartão (R$) *
              </label>
              <input
                type="text"
                value={cardPrice}
                onChange={(e) => setCardPrice(e.target.value)}
                required
                placeholder="99,90"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative w-11 h-6 rounded-full transition-colors overflow-hidden ${
                active ? "bg-[#A9DCA4]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                  active ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">Item visível na vitrine</span>
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
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold py-3 rounded-2xl disabled:opacity-60"
            >
              {saving ? "Salvando..." : item ? "Salvar alterações" : "Criar item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
