import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getPresignedImageUrl, isR2Key } from "@/lib/r2";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  pixPrice: z.number().positive("Preço PIX deve ser positivo"),
  cardPrice: z.number().positive("Preço Cartão deve ser positivo"),
  imageUrl: z.string().optional().or(z.literal("")),
  active: z.boolean().optional().default(true),
});

/** Resolve a imageUrl de um item: key R2 → URL pré-assinada, URL externa → mantém */
async function resolveImageUrl(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null;
  if (isR2Key(imageUrl)) {
    try {
      return await getPresignedImageUrl(imageUrl);
    } catch {
      return null;
    }
  }
  // URL externa (legado ou hero_image de URL direta)
  return imageUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const adminView = searchParams.get("admin") === "true";

  const where = {
    ...(adminView ? {} : { active: true }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy =
    sortBy === "pixPrice" || sortBy === "cardPrice" || sortBy === "name"
      ? { [sortBy]: order as "asc" | "desc" }
      : { createdAt: order as "asc" | "desc" };

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { payments: { where: { status: "APPROVED" } } } },
      },
    }),
    prisma.item.count({ where }),
  ]);

  // Resolve URLs pré-assinadas em paralelo
  const resolved = await Promise.all(
    items.map(async (item: typeof items[number]) => ({
      ...item,
      imageUrl: await resolveImageUrl(item.imageUrl),
    }))
  );

  return NextResponse.json({ items: resolved, total, page, limit });
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const data = itemSchema.parse(body);

    const item = await prisma.item.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
