import { NextRequest, NextResponse } from "next/server";
import { getPresignedImageUrl, isR2Key } from "@/lib/r2";

/**
 * GET /api/image?key=uploads/xxx.jpg
 *
 * Busca a imagem do R2 e retorna os bytes diretamente (proxy).
 * Funciona em qualquer dispositivo/rede sem necessidade de o browser
 * acessar o R2 diretamente.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key || !isR2Key(key)) {
    return NextResponse.json({ error: "Key inválida" }, { status: 400 });
  }

  const safe = key.replace(/\.\./g, "").replace(/\/\//g, "/");

  try {
    const presignedUrl = await getPresignedImageUrl(safe, 3600);
    const r2Response = await fetch(presignedUrl);

    if (!r2Response.ok) {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
    }

    const contentType = r2Response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(r2Response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3300, s-maxage=3300",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("não configurado")) {
      return NextResponse.json({ error: "R2 não configurado" }, { status: 503 });
    }
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }
}
