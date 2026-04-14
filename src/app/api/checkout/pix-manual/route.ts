import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const pixManualSchema = z.object({
  itemId: z.string().min(1),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(500).optional(),
  receiptKey: z.string().optional(), // key do R2 do comprovante
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, buyerName, buyerEmail, message, receiptKey } =
      pixManualSchema.parse(body);

    const item = await prisma.item.findUnique({ where: { id: itemId, active: true } });
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    const receiptUrl = receiptKey
      ? `/api/image?key=${encodeURIComponent(receiptKey)}`
      : null;

    const payment = await prisma.payment.create({
      data: {
        itemId,
        paymentMethod: "PIX",
        amount: item.pixPrice,
        buyerName: buyerName || null,
        buyerEmail: buyerEmail || null,
        message: message || null,
        status: "APPROVED",
        receiptUrl,
      },
    });

    return NextResponse.json({ paymentId: payment.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("PIX manual checkout error:", error);
    return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 });
  }
}
