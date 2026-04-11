"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const isSuccess = status === "success";
  const isPending = status === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#A9DCA4] via-[#D4EED1] to-[#fafafa] p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4EED1] flex items-center justify-center">
              <svg className="w-10 h-10 text-[#6DB567]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-gray-800 mb-3">
              Muito obrigado!
            </h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              Seu presente foi confirmado com sucesso! Ficamos muito felizes com
              sua contribuição para nosso novo lar. 💚
            </p>
          </>
        ) : isPending ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-gray-800 mb-3">
              Aguardando pagamento
            </h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              Seu pagamento está sendo processado. Assim que confirmado,
              registraremos seu presente com muito carinho!
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-gray-800 mb-3">
              Pagamento não concluído
            </h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              Ocorreu um problema com o pagamento. Você pode tentar novamente
              quando quiser.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-block bg-[#A9DCA4] hover:bg-[#6DB567] text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
        >
          Voltar à vitrine
        </Link>
      </div>
    </div>
  );
}

export default function ObrigadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
