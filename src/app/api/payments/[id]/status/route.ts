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

// Endpoint público — retorna só o status do pagamento (sem dados sensíveis)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { id: true, status: true, mercadoPagoId: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
    }

    // Se ainda está pendente e temos o ID do MP, consulta direto a API
    if (payment.status === "PENDING" && payment.mercadoPagoId) {
      try {
        const mpPayment = await getPaymentStatus(payment.mercadoPagoId);
        const newStatus = MP_STATUS_MAP[mpPayment.status || "pending"] || "PENDING";

        if (newStatus !== "PENDING") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: newStatus },
          });
          return NextResponse.json({ status: newStatus });
        }
      } catch {
        // Falha silenciosa — retorna o status do banco
      }
    }

    return NextResponse.json({ status: payment.status });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
