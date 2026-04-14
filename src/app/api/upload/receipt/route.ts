import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2";

const MAX_SIZE_MB = 15;
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// Endpoint público — sem auth. Usado pelo comprador para enviar comprovante.
export async function POST(request: NextRequest) {
  try {
    const { contentType, size } = await request.json();

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPG, PNG, WebP ou PDF." },
        { status: 400 }
      );
    }
    if (size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    const ext = EXT_MAP[contentType] || "jpg";
    const { key, uploadUrl } = await getPresignedUploadUrl(contentType, ext);

    return NextResponse.json({ key, uploadUrl });
  } catch (error) {
    if (error instanceof Error && error.message.includes("não configurado")) {
      return NextResponse.json({ error: "R2 não configurado" }, { status: 503 });
    }
    console.error("Receipt upload error:", error);
    return NextResponse.json({ error: "Erro ao gerar URL de upload" }, { status: 500 });
  }
}
