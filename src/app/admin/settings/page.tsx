"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Config {
  // Mercado Pago
  mp_access_token?: string;
  mp_public_key?: string;
  // Cloudflare R2
  r2_account_id?: string;
  r2_access_key_id?: string;
  r2_secret_access_key?: string;
  r2_bucket_name?: string;
  // Site
  youtube_music_url?: string;
  couple_names?: string;
  event_date?: string;
  couple_story?: string;
  hero_image?: string;
  // Redes sociais
  social_instagram?: string;
  social_whatsapp?: string;
  social_facebook?: string;
}

function Field({
  label,
  hint,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-gray-700 text-lg">{title}</h2>
        {badge && (
          <span className="text-xs bg-[#D4EED1] text-[#6DB567] px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
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
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("Erro ao salvar configurações");
    }
    setSaving(false);
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer upload");
      set("hero_image")(data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload da foto");
    } finally {
      setHeroUploading(false);
    }
  };

  const handleAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    setAdminError("");
    setAdminSaved(false);

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
    ? heroKey.startsWith("http")
      ? heroKey
      : `/api/image?key=${encodeURIComponent(heroKey)}`
    : "";

  if (loading) {
    return (
      <div className="p-6 lg:p-8 pt-20 lg:pt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <div className="p-6 lg:p-8 pt-20 lg:pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-[var(--font-playfair)] text-2xl font-bold text-gray-800">
            Configurações
          </h1>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-[#6DB567] font-medium">✓ Salvo!</span>}
            {error && <span className="text-sm text-red-500">{error}</span>}
            <button
              type="submit"
              disabled={saving}
              className="bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold px-6 py-2.5 rounded-2xl transition-colors disabled:opacity-60 text-sm"
            >
              {saving ? "Salvando..." : "Salvar tudo"}
            </button>
          </div>
        </div>

        {/* ── Cloudflare R2 ── */}
        <SectionCard title="Cloudflare R2" badge="Armazenamento de imagens">
          <p className="text-xs text-gray-400 -mt-2">
            Credenciais do bucket R2. Crie um API Token com permissão{" "}
            <code className="bg-gray-100 px-1 rounded">Object Read &amp; Write</code> no painel da Cloudflare.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Account ID"
              value={config.r2_account_id || ""}
              onChange={set("r2_account_id")}
              placeholder="d1f0f9195a64b466ff80c6f0abf12d5d"
              hint="Painel Cloudflare → R2 → lado direito"
            />
            <Field
              label="Bucket Name"
              value={config.r2_bucket_name || ""}
              onChange={set("r2_bucket_name")}
              placeholder="cha-de-casa-nova"
            />
            <Field
              label="Access Key ID"
              value={config.r2_access_key_id || ""}
              onChange={set("r2_access_key_id")}
              placeholder="43b7b9f5b4ab518e..."
              hint="Gerado ao criar o API Token R2"
            />
            <Field
              label="Secret Access Key"
              type="password"
              value={config.r2_secret_access_key || ""}
              onChange={set("r2_secret_access_key")}
              placeholder="••••••••  (deixe em branco para manter)"
            />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700">
            <strong>Importante:</strong> as imagens são servidas via URLs pré-assinadas (expiram em 1h).
            O bucket <strong>não</strong> precisa ter acesso público ativado.
          </div>
        </SectionCard>

        {/* ── Mercado Pago ── */}
        <SectionCard title="Mercado Pago" badge="Pagamentos">
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Access Token"
              type="password"
              value={config.mp_access_token || ""}
              onChange={set("mp_access_token")}
              placeholder="APP_USR-...  (deixe em branco para manter)"
              hint="Painel MP → Configurações → Credenciais"
            />
            <Field
              label="Public Key"
              value={config.mp_public_key || ""}
              onChange={set("mp_public_key")}
              placeholder="APP_USR-..."
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">URL do Webhook</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3">
              <code className="text-xs text-gray-500 flex-1 truncate">
                {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}
                /api/webhook/mercadopago
              </code>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhook/mercadopago`)
                }
                className="text-xs text-[#6DB567] hover:underline flex-shrink-0"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Configure no painel do Mercado Pago em Seu negócio → Configurações → Notificações.
            </p>
          </div>
        </SectionCard>

        {/* ── Personalização ── */}
        <SectionCard title="Personalização do Site">
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Nome do Casal"
              value={config.couple_names || ""}
              onChange={set("couple_names")}
              placeholder="João & Maria"
            />
            <Field
              label="Data do Evento"
              value={config.event_date || ""}
              onChange={set("event_date")}
              placeholder="Sábado, 15 de Março de 2025"
            />
          </div>
          <Field
            label="Música de fundo (URL do YouTube)"
            value={config.youtube_music_url || ""}
            onChange={set("youtube_music_url")}
            placeholder="https://www.youtube.com/watch?v=..."
            hint="Cole a URL do vídeo/música. O vídeo fica oculto — só o áudio toca."
          />

          {/* Foto do casal — upload para R2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto do Casal (hero)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#D4EED1] overflow-hidden flex-shrink-0 border-2 border-white shadow">
                {heroPreview ? (
                  <Image
                    src={heroPreview}
                    alt="Foto do casal"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
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
                  {heroUploading ? "Enviando..." : "Fazer upload para o R2"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeroUpload}
                    disabled={heroUploading}
                  />
                </label>
                <input
                  type="text"
                  value={heroKey}
                  onChange={(e) => set("hero_image")(e.target.value)}
                  placeholder="ou cole uma URL externa / key do R2"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
                />
                {heroKey && (
                  <button
                    type="button"
                    onClick={() => set("hero_image")("")}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nossa História</label>
            <textarea
              value={config.couple_story || ""}
              onChange={(e) => set("couple_story")(e.target.value)}
              rows={5}
              placeholder="Conte a história de vocês e a conquista da nova casa..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4] resize-none"
            />
          </div>
        </SectionCard>

        {/* ── Redes Sociais ── */}
        <SectionCard title="Redes Sociais" badge="Rodapé do site">
          <p className="text-xs text-gray-400 -mt-2">
            Os links configurados aparecem no rodapé da página pública. Deixe em branco para ocultar.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
              </label>
              <input
                type="url"
                value={config.social_instagram || ""}
                onChange={(e) => set("social_instagram")(e.target.value)}
                placeholder="https://instagram.com/seuperfil"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </label>
              <input
                type="text"
                value={config.social_whatsapp || ""}
                onChange={(e) => set("social_whatsapp")(e.target.value)}
                placeholder="5511999990000 ou https://wa.me/..."
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
              <p className="text-xs text-gray-400 mt-1">Número com DDI+DDD ou link wa.me completo</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </label>
              <input
                type="url"
                value={config.social_facebook || ""}
                onChange={(e) => set("social_facebook")(e.target.value)}
                placeholder="https://facebook.com/seuperfil"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Novo Admin ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-lg">Adicionar Administrador</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                type="text"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                placeholder="Maria Silva"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário <span className="text-gray-400 text-xs">(nome.sobrenome)</span>
              </label>
              <input
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                placeholder="maria.silva"
                pattern="^[a-z]+\.[a-z]+$"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="mínimo 6 caracteres"
                minLength={6}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9DCA4]"
              />
            </div>
          </div>
          {adminError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
              {adminError}
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAdminCreate}
              disabled={adminSaving}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-2xl transition-colors disabled:opacity-60 text-sm"
            >
              {adminSaving ? "Criando..." : "Criar administrador"}
            </button>
            {adminSaved && (
              <span className="text-sm text-[#6DB567] font-medium">✓ Admin criado!</span>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
