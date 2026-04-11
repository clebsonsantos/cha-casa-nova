"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Missing {
  mp: boolean;
  r2: boolean;
}

export default function SetupAlert() {
  const [missing, setMissing] = useState<Missing | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("setup-alert-dismissed") === "1") {
      setDismissed(true);
      return;
    }
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        // "••••••••" significa que o valor existe mas foi mascarado — está configurado
        const hasValue = (v?: string) => !!v && v.length > 0;
        const hasMp = hasValue(cfg.mp_access_token);
        const hasR2 = hasValue(cfg.r2_account_id) && hasValue(cfg.r2_bucket_name);
        if (!hasMp || !hasR2) setMissing({ mp: !hasMp, r2: !hasR2 });
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("setup-alert-dismissed", "1");
    setDismissed(true);
  };

  if (dismissed || !missing) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-amber-400 px-6 py-5 flex items-start gap-3">
          <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Configuração pendente</h2>
            <p className="text-white/90 text-sm mt-0.5">
              {[missing.mp && "Mercado Pago", missing.r2 && "Cloudflare R2"]
                .filter(Boolean).join(" e ")}{" "}
              {missing.mp && missing.r2 ? "precisam" : "precisa"} ser configurado{missing.mp && missing.r2 ? "s" : ""} para o site funcionar corretamente.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Mercado Pago */}
          {missing.mp && (
            <div className="border border-blue-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">MP</span>
                <span className="font-semibold text-gray-800">Mercado Pago</span>
                <span className="ml-auto text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Não configurado</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Acesse <a href="https://www.mercadopago.com.br/developers/pt/docs" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">mercadopago.com.br/developers</a></li>
                <li>Vá em <span className="font-medium">Suas integrações → Credenciais de produção</span></li>
                <li>Copie o <span className="font-mono text-xs bg-gray-100 px-1 rounded">Access Token</span> e a <span className="font-mono text-xs bg-gray-100 px-1 rounded">Public Key</span></li>
                <li>Cole em <span className="font-medium">Settings → Pagamentos</span></li>
              </ol>
              <Link
                href="/admin/settings?tab=Pagamentos"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline"
              >
                Ir para Pagamentos →
              </Link>
            </div>
          )}

          {/* Cloudflare R2 */}
          {missing.r2 && (
            <div className="border border-orange-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                  </svg>
                </span>
                <span className="font-semibold text-gray-800">Cloudflare R2</span>
                <span className="ml-auto text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Não configurado</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Acesse <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-medium">dash.cloudflare.com</a> → <span className="font-medium">R2</span></li>
                <li>Crie um bucket e anote o <span className="font-medium">Account ID</span> e o nome do bucket</li>
                <li>Em <span className="font-medium">Manage R2 API Tokens</span>, crie um token com permissão <span className="font-mono text-xs bg-gray-100 px-1 rounded">Object Read & Write</span></li>
                <li>Adicione a política de CORS no bucket para permitir uploads do browser</li>
              </ol>
              <Link
                href="/admin/settings?tab=Armazenamento"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 text-sm text-orange-600 font-medium hover:underline"
              >
                Ir para Armazenamento →
              </Link>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={dismiss}
            className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-2xl transition-colors"
          >
            Dispensar
          </button>
          <Link
            href="/admin/settings"
            onClick={dismiss}
            className="bg-amber-400 hover:bg-amber-500 text-white font-semibold px-5 py-2 rounded-2xl text-sm transition-colors"
          >
            Abrir Configurações
          </Link>
        </div>
      </div>
    </div>
  );
}
