import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { getPaymentStatus } from "@/lib/mercadopago";

const MP_STATUS_MAP: Record<string, "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING"> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  pending: "PENDING",
  in_process: "PENDING",
  in_mediation: "PENDING",
  charged_back: "REJECTED",
};

async function getWebhookSecret(): Promise<string | null> {
  const row = await prisma.siteConfig.findUnique({ where: { key: "mp_webhook_secret" } });
  return row?.value || process.env.MP_WEBHOOK_SECRET || null;
}

async function verifySignature(request: NextRequest): Promise<NextResponse | null> {
  const secret = await getWebhookSecret();
  // Se não há secret configurado, pula a verificação (compatibilidade com ambientes sem assinatura)
  if (!secret) return null;

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    return NextResponse.json(
      { error: "Missing x-signature or x-request-id header" },
      { status: 400 }
    );
  }

  let ts = "";
  let v1 = "";
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key.trim() === "ts") ts = value.trim();
    else if (key.trim() === "v1") v1 = value.trim();
  });

  if (!ts || !v1) {
    return NextResponse.json(
      { error: "Invalid x-signature header format" },
      { status: 400 }
    );
  }

  const dataId = new URL(request.url).searchParams.get("data.id");
  let manifest = "";
  if (dataId) manifest += `id:${dataId};`;
  manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const generatedHash = createHmac("sha256", secret).update(manifest).digest("hex");

  if (generatedHash !== v1) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  return null; // assinatura válida
}

export async function POST(request: NextRequest) {
  try {
    const signatureError = await verifySignature(request);
    if (signatureError) return signatureError;

    const body = await request.json();
    const { type, data, action } = body;

    if (
      (type === "payment" || action === "payment.updated") &&
      data?.id
    ) {
      const mpPaymentId = String(data.id);
      const mpPayment = await getPaymentStatus(mpPaymentId);
      const externalRef = mpPayment.external_reference;

      if (!externalRef) {
        return NextResponse.json({ received: true });
      }

      const status = MP_STATUS_MAP[mpPayment.status || "pending"] || "PENDING";

      await prisma.payment.updateMany({
        where: {
          OR: [
            { id: externalRef },
            { mercadoPagoId: mpPaymentId },
          ],
        },
        data: {
          mercadoPagoId: mpPaymentId,
          status,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
