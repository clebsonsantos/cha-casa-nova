import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/r2";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const { contentType, size } = await request.json();

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPG, PNG, WebP ou GIF." },
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
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      console.error("Upload error:", error.message);
    }
    return NextResponse.json({ error: "Erro ao gerar URL de upload" }, { status: 500 });
  }
}
