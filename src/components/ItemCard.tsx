"use client";

import Image from "next/image";
import { useState } from "react";

interface Item {
  id: string;
  name: string;
  description: string;
  pixPrice: number;
  cardPrice: number;
  imageUrl?: string | null;
  _count?: { payments: number };
}

interface ItemCardProps {
  item: Item;
  onSelect: (item: Item, method: "PIX" | "CARD") => void;
}

export default function ItemCard({ item, onSelect }: ItemCardProps) {
  const [method, setMethod] = useState<"PIX" | "CARD">("PIX");

  const price = method === "PIX" ? item.pixPrice : item.cardPrice;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-48 bg-[#D4EED1]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-[#A9DCA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        {item._count && item._count.payments > 0 && (
          <div className="absolute top-3 right-3 bg-[#C9A84C] text-white text-xs font-bold px-2 py-1 rounded-full">
            {item._count.payments}x adquirido
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-[var(--font-playfair)] text-lg font-semibold text-gray-800 leading-tight">
            {item.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        </div>

        <div className="flex rounded-2xl border border-[#A9DCA4] overflow-hidden text-sm font-medium">
          <button
            onClick={() => setMethod("PIX")}
            className={`flex-1 py-2 transition-colors ${
              method === "PIX"
                ? "bg-[#A9DCA4] text-white"
                : "text-[#6DB567] hover:bg-[#D4EED1]"
            }`}
          >
            PIX
          </button>
          <button
            onClick={() => setMethod("CARD")}
            className={`flex-1 py-2 transition-colors ${
              method === "CARD"
                ? "bg-[#A9DCA4] text-white"
                : "text-[#6DB567] hover:bg-[#D4EED1]"
            }`}
          >
            Cartão
          </button>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-2xl font-bold text-[#C9A84C]">
            {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
          {method === "CARD" && (
            <span className="text-xs text-gray-400">até 12x</span>
          )}
        </div>

        <button
          onClick={() => onSelect(item, method)}
          className="w-full bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          Presentear
        </button>
      </div>
    </div>
  );
}
