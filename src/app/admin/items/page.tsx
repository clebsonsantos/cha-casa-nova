"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ItemForm from "@/components/admin/ItemForm";

interface Item {
  id: string;
  name: string;
  description: string;
  pixPrice: number;
  cardPrice: number;
  imageUrl?: string | null;
  active: boolean;
  _count?: { payments: number };
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [r2Configured, setR2Configured] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        setR2Configured(!!(cfg.r2_account_id && cfg.r2_bucket_name));
      })
      .catch(() => {});
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch(`/api/items?page=${page}&limit=${limit}&admin=true`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [page]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteId(null);
      fetchItems();
    }
  };

  const handleToggleActive = async (item: Item) => {
    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    fetchItems();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-gray-800">
          Itens
        </h1>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Item
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-400">Nenhum item cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Item</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4 hidden md:table-cell">PIX</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4 hidden md:table-cell">Cartão</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4 hidden lg:table-cell">Adquiridos</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-4">Status</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D4EED1] overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A9DCA4]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-600">
                    {item.pixPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-600">
                    {item.cardPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="bg-[#D4EED1] text-[#6DB567] text-xs font-semibold px-2 py-1 rounded-full">
                      {item._count?.payments || 0}x
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                        item.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {item.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditItem(item); setShowForm(true); }}
                        className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
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

      {/* Item Form Modal */}
      {showForm && (
        <ItemForm
          item={editItem}
          r2Configured={r2Configured}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => { setShowForm(false); setEditItem(null); fetchItems(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-500 mb-6">Isso irá excluir o item permanentemente. Continuar?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 py-2.5 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-2xl text-sm font-medium">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
