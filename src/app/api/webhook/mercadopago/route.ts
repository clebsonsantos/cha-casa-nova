import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MercadoPago sends different event types
    const { type, data, action } = body;

    // Handle payment notifications
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
    // Return 200 to prevent MP from retrying on our processing errors
    return NextResponse.json({ received: true });
  }
}

export async function GET(request: NextRequest) {
  // MercadoPago sometimes does a GET to verify the webhook URL
  return NextResponse.json({ ok: true });
}
