import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .regex(/^[a-z]+\.[a-z]+$/, "Username deve ser no formato nome.sobrenome"),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const { username, password, name } = registerSchema.parse(body);

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username já existe" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { username, password: hashed, name },
    });

    return NextResponse.json({ success: true, id: admin.id });
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
