"use client";

import { useState, useEffect, useCallback } from "react";
import ItemCard from "./ItemCard";
import CheckoutModal from "./CheckoutModal";

interface Item {
  id: string;
  name: string;
  description: string;
  pixPrice: number;
  cardPrice: number;
  imageUrl?: string | null;
  pixCode?: string | null;
  _count?: { payments: number };
}

export default function StoreFront() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("asc");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"PIX" | "CARD">("PIX");
  const [pixManual, setPixManual] = useState(false);

  const limit = 12;

  useEffect(() => {
    fetch("/api/public-config")
      .then((r) => r.json())
      .then((data) => setPixManual(data.payment_mode === "pix_manual"))
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      sortBy,
      order,
    });
    const res = await fetch(`/api/items?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, sortBy, order]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSelect = (item: Item, method: "PIX" | "CARD") => {
    setSelectedItem(item);
    setSelectedMethod(method);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar presentes..."
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] bg-white"
          />
          <button
            type="submit"
            className="bg-[#A9DCA4] hover:bg-[#6DB567] text-white px-5 py-3 rounded-2xl text-sm font-medium transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] bg-white text-gray-600"
          >
            <option value="createdAt">Mais recentes</option>
            <option value="name">Alfabético</option>
            <option value="pixPrice">Preço PIX</option>
            <option value="cardPrice">Preço Cartão</option>
          </select>
          <button
            onClick={() => { setOrder(order === "asc" ? "desc" : "asc"); setPage(1); }}
            className="border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white hover:bg-gray-50 transition-colors text-gray-600"
            title={order === "asc" ? "Crescente" : "Decrescente"}
          >
            {order === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Nenhum item encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={handleSelect} pixManual={pixManual} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedItem && (
        <CheckoutModal
          item={selectedItem}
          method={selectedMethod}
          pixManual={pixManual}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
