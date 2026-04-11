"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

interface Config {
  mp_access_token?: string;
  mp_public_key?: string;
  mp_webhook_secret?: string;
  r2_account_id?: string;
  r2_access_key_id?: string;
  r2_secret_access_key?: string;
  r2_bucket_name?: string;
  youtube_music_url?: string;
  couple_names?: string;
  event_date?: string;
  couple_story?: string;
  hero_image?: string;
  social_instagram?: string;
  social_whatsapp?: string;
  social_facebook?: string;
}

const TABS = ["Personalização", "Redes Sociais", "Armazenamento", "Pagamentos", "Administradores"] as const;
type Tab = typeof TABS[number];

function Field({
  label, hint, type = "text", value, onChange, placeholder,
}: {
  label: string; hint?: string; type?: string;
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SaveBar({ saving, saved, error }: { saving: boolean; saved: boolean; error: string }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
      {error && <span className="text-sm text-red-500">{error}</span>}
      {saved && <span className="text-sm text-[#6DB567] font-medium">✓ Salvo!</span>}
      <button
        type="submit"
        disabled={saving}
        className="bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold px-6 py-2.5 rounded-2xl transition-colors disabled:opacity-60 text-sm"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tab = searchParams.get("tab");
    return TABS.includes(tab as Tab) ? (tab as Tab) : "Personalização";
  });
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "", name: "" });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSaved, setAdminSaved] = useState(false);

  const set = (key: keyof Config) => (v: string) =>
    setConfig((prev) => ({ ...prev, [key]: v }));

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { setConfig(data); setLoading(false); });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setError("Erro ao salvar configurações");
    setSaving(false);
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      // 1. Pede URL pré-assinada ao servidor
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar URL de upload");

      // 2. Browser envia direto ao R2
      const putRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Erro ao enviar arquivo ao R2");

      set("hero_image")(data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setHeroUploading(false);
    }
  };

  const handleAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true); setAdminError(""); setAdminSaved(false);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAdmin),
    });
    const data = await res.json();
    if (res.ok) {
      setAdminSaved(true);
      setNewAdmin({ username: "", password: "", name: "" });
      setTimeout(() => setAdminSaved(false), 3000);
    } else {
      setAdminError(data.error || "Erro ao criar admin");
    }
    setAdminSaving(false);
  };

  const heroKey = config.hero_image || "";
  const heroPreview = heroKey
    ? heroKey.startsWith("http") ? heroKey : `/api/image?key=${encodeURIComponent(heroKey)}`
    : "";

  if (loading) {
    return (
      <div className="p-6 lg:p-8 pt-20 lg:pt-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-white rounded-2xl animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8 max-w-3xl">
      <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-gray-800 mb-6">
        Configurações
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-max text-sm font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Personalização ── */}
      {activeTab === "Personalização" && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nome do Casal" value={config.couple_names || ""} onChange={set("couple_names")} placeholder="João & Maria" />
            <Field label="Data do Evento" value={config.event_date || ""} onChange={set("event_date")} placeholder="Sábado, 15 de Março de 2025" />
          </div>
          <Field
            label="Música de fundo (URL do YouTube)"
            value={config.youtube_music_url || ""}
            onChange={set("youtube_music_url")}
            placeholder="https://www.youtube.com/watch?v=..."
            hint="O vídeo fica oculto — só o áudio toca."
          />

          {/* Foto do casal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Casal</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#D4EED1] overflow-hidden flex-shrink-0 border-2 border-white shadow">
                {heroPreview ? (
                  <Image src={heroPreview} alt="Foto do casal" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#A9DCA4]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-500 flex items-center gap-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {heroUploading ? "Enviando..." : "Fazer upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} disabled={heroUploading} />
                </label>
                <input
                  type="text" value={heroKey} onChange={(e) => set("hero_image")(e.target.value)}
                  placeholder="ou cole uma URL externa"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
                />
                {heroKey && (
                  <button type="button" onClick={() => set("hero_image")("")} className="text-xs text-red-400 hover:text-red-600">
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nossa História</label>
            <textarea
              value={config.couple_story || ""} onChange={(e) => set("couple_story")(e.target.value)}
              rows={5} placeholder="Conte a história de vocês..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] resize-none"
            />
          </div>
          <SaveBar saving={saving} saved={saved} error={error} />
        </form>
      )}

      {/* ── Redes Sociais ── */}
      {activeTab === "Redes Sociais" && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <p className="text-sm text-gray-400">Os links aparecem no rodapé da vitrine. Deixe em branco para ocultar o ícone.</p>
          <Field
            label="Instagram"
            value={config.social_instagram || ""}
            onChange={set("social_instagram")}
            placeholder="https://instagram.com/seuperfil"
          />
          <div>
            <Field
              label="WhatsApp"
              value={config.social_whatsapp || ""}
              onChange={set("social_whatsapp")}
              placeholder="5511999990000 ou https://wa.me/..."
            />
            <p className="text-xs text-gray-400 mt-1">Aceita número com DDI+DDD ou link wa.me completo.</p>
          </div>
          <Field
            label="Facebook"
            value={config.social_facebook || ""}
            onChange={set("social_facebook")}
            placeholder="https://facebook.com/seuperfil"
          />
          <SaveBar saving={saving} saved={saved} error={error} />
        </form>
      )}

      {/* ── Armazenamento (R2) ── */}
      {activeTab === "Armazenamento" && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <p className="text-sm text-gray-400">
            Credenciais do bucket Cloudflare R2. Crie um API Token com permissão{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">Object Read &amp; Write</code>.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Account ID" value={config.r2_account_id || ""} onChange={set("r2_account_id")} placeholder="d1f0f9195a..." hint="Painel Cloudflare → R2 → lado direito" />
            <Field label="Bucket Name" value={config.r2_bucket_name || ""} onChange={set("r2_bucket_name")} placeholder="cha-de-casa-nova" />
            <Field label="Access Key ID" value={config.r2_access_key_id || ""} onChange={set("r2_access_key_id")} placeholder="43b7b9f5b4..." hint="Gerado ao criar o API Token R2" />
            <Field label="Secret Access Key" type="password" value={config.r2_secret_access_key || ""} onChange={set("r2_secret_access_key")} placeholder="•••••••• (deixe em branco para manter)" />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700">
            O bucket <strong>não</strong> precisa de acesso público. Imagens são servidas via URLs pré-assinadas (expiram em 1h).
          </div>
          <SaveBar saving={saving} saved={saved} error={error} />
        </form>
      )}

      {/* ── Pagamentos (MP) ── */}
      {activeTab === "Pagamentos" && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <p className="text-sm text-gray-400">
            Credenciais do Mercado Pago. Acesse{" "}
            <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-[#6DB567] hover:underline">
              mercadopago.com.br/developers
            </a>{" "}
            → Credenciais de produção.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Access Token" type="password" value={config.mp_access_token || ""} onChange={set("mp_access_token")} placeholder="APP_USR-... (deixe em branco para manter)" hint="Painel MP → Configurações → Credenciais" />
            <Field label="Public Key" value={config.mp_public_key || ""} onChange={set("mp_public_key")} placeholder="APP_USR-..." />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">URL do Webhook</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3">
              <code className="text-xs text-gray-500 flex-1 truncate">
                {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhook/mercadopago
              </code>
              <button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhook/mercadopago`)} className="text-xs text-[#6DB567] hover:underline flex-shrink-0">
                Copiar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Configure em Seu negócio → Configurações → Notificações no painel do MP.</p>
          </div>
          <Field
            label="Chave de Assinatura do Webhook"
            type="password"
            value={config.mp_webhook_secret || ""}
            onChange={set("mp_webhook_secret")}
            placeholder="(deixe em branco para manter)"
            hint="Gerada automaticamente pelo MP ao salvar a URL do webhook acima."
          />
          <SaveBar saving={saving} saved={saved} error={error} />
        </form>
      )}

      {/* ── Administradores ── */}
      {activeTab === "Administradores" && (
        <form onSubmit={handleAdminCreate} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <p className="text-sm text-gray-400">Crie novos usuários para acessar o painel administrativo.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="Maria Silva" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário <span className="text-gray-400 text-xs">(nome.sobrenome)</span>
              </label>
              <input type="text" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} placeholder="maria.silva" pattern="^[a-z]+\.[a-z]+$" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="mínimo 6 caracteres" minLength={6} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]" />
            </div>
          </div>
          {adminError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">{adminError}</div>
          )}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-6">
            <button type="submit" disabled={adminSaving} className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-2xl transition-colors disabled:opacity-60 text-sm">
              {adminSaving ? "Criando..." : "Criar administrador"}
            </button>
            {adminSaved && <span className="text-sm text-[#6DB567] font-medium">✓ Admin criado!</span>}
          </div>
        </form>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
