import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getR2Config } from "@/lib/r2";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WebP ou GIF." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    const config = await getR2Config();
    if (!config) {
      return NextResponse.json(
        { error: "Cloudflare R2 não configurado. Acesse /admin/settings." },
        { status: 503 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ContentLength: buffer.length,
      })
    );

    return NextResponse.json({ key });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      console.error("Upload error:", error.message);
    }
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
