import { NextRequest, NextResponse } from "next/server";
import { getPresignedImageUrl, isR2Key } from "@/lib/r2";

/**
 * GET /api/image?key=uploads/xxx.jpg
 *
 * Gera uma URL pré-assinada de leitura e faz redirect 302.
 * O browser/CDN armazena a imagem em cache até o TTL expirar.
 * Não requer autenticação — as imagens de itens são públicas na vitrine.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key || !isR2Key(key)) {
    return NextResponse.json({ error: "Key inválida" }, { status: 400 });
  }

  // Previne path traversal
  const safe = key.replace(/\.\./g, "").replace(/\/\//g, "/");

  try {
    const url = await getPresignedImageUrl(safe, 3600);

    return NextResponse.redirect(url, {
      status: 302,
      headers: {
        // Permite que o browser faça cache por 55 min (margem antes do TTL de 1h)
        "Cache-Control": "public, max-age=3300, s-maxage=3300",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("não configurado")) {
      return NextResponse.json(
        { error: "R2 não configurado" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }
}
