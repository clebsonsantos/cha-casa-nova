import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/lib/mercadopago";
import { z } from "zod";

const checkoutSchema = z.object({
  itemId: z.string().min(1),
  paymentMethod: z.enum(["PIX", "CARD"]),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, paymentMethod, buyerName, buyerEmail, message } =
      checkoutSchema.parse(body);

    const item = await prisma.item.findUnique({ where: { id: itemId, active: true } });
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    const amount = paymentMethod === "PIX" ? item.pixPrice : item.cardPrice;

    const payment = await prisma.payment.create({
      data: {
        itemId,
        paymentMethod,
        amount,
        buyerName,
        buyerEmail: buyerEmail || null,
        message,
        status: "PENDING",
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const preference = await createPreference({
      itemId: item.id,
      itemName: item.name,
      amount,
      paymentMethod,
      buyerName,
      buyerEmail,
      message,
      paymentDbId: payment.id,
      appUrl,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { preferenceId: preference.id || null },
    });

    return NextResponse.json({
      paymentId: payment.id,
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 });
  }
}
