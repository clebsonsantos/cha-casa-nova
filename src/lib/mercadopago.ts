import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { prisma } from "./prisma";

/** Mercado Pago rejeita localhost/IPs privados para auto_return e notification_url */
function isPublicUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname !== "localhost" &&
      !hostname.startsWith("127.") &&
      !hostname.startsWith("192.168.") &&
      !hostname.startsWith("10.") &&
      hostname !== "0.0.0.0"
    );
  } catch {
    return false;
  }
}

export async function getMPConfig(): Promise<{
  accessToken: string;
  publicKey: string;
} | null> {
  const [tokenRow, keyRow] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: "mp_access_token" } }),
    prisma.siteConfig.findUnique({ where: { key: "mp_public_key" } }),
  ]);

  const accessToken =
    tokenRow?.value || process.env.MP_ACCESS_TOKEN;
  const publicKey = keyRow?.value || process.env.MP_PUBLIC_KEY;

  if (!accessToken || !publicKey) return null;
  return { accessToken, publicKey };
}

export async function createPreference(params: {
  itemId: string;
  itemName: string;
  itemDescription?: string;
  amount: number;
  paymentMethod: "PIX" | "CARD";
  buyerName?: string;
  buyerEmail?: string;
  message?: string;
  paymentDbId: string;
  appUrl: string;
}) {
  const config = await getMPConfig();
  if (!config) throw new Error("Mercado Pago não configurado");

  const client = new MercadoPagoConfig({ accessToken: config.accessToken });
  const preference = new Preference(client);

  // Tipos de pagamento existentes no Mercado Pago Brasil:
  //   credit_card | debit_card | bank_transfer (PIX) | ticket (boleto) | prepaid_card | atm
  const ALL_EXCEPT_PIX = [
    { id: "credit_card" },
    { id: "debit_card" },
    { id: "ticket" },
    { id: "prepaid_card" },
    { id: "atm" },
  ];
  const ALL_EXCEPT_CARD = [
    { id: "bank_transfer" },
    { id: "ticket" },
    { id: "prepaid_card" },
    { id: "atm" },
    { id: "debit_card" },
  ];

  const paymentMethods =
    params.paymentMethod === "PIX"
      ? {
          excluded_payment_types: ALL_EXCEPT_PIX,
          installments: 1,
        }
      : {
          excluded_payment_types: ALL_EXCEPT_CARD,
          installments: 12,
          default_installments: 1,
        };

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.itemId,
          title: params.itemName,
          description: params.itemDescription,
          category_id: "gift",
          quantity: 1,
          unit_price: params.amount,
          currency_id: "BRL",
        },
      ],
      payer: params.buyerEmail
        ? {
            name: params.buyerName,
            email: params.buyerEmail,
          }
        : undefined,
      payment_methods: paymentMethods,
      back_urls: {
        success: `${params.appUrl}/obrigado?payment_id=${params.paymentDbId}&status=success`,
        failure: `${params.appUrl}/obrigado?payment_id=${params.paymentDbId}&status=failure`,
        pending: `${params.appUrl}/obrigado?payment_id=${params.paymentDbId}&status=pending`,
      },
      // auto_return só funciona com URLs públicas (não localhost).
      // Em produção redireciona automaticamente após pagamento aprovado.
      ...(isPublicUrl(params.appUrl) && { auto_return: "approved" as const }),
      external_reference: params.paymentDbId,
      // notification_url também exige URL pública — omite em desenvolvimento
      ...(isPublicUrl(params.appUrl) && {
        notification_url: `${params.appUrl}/api/webhook/mercadopago`,
      }),
      metadata: {
        payment_db_id: params.paymentDbId,
        message: params.message,
      },
    },
  });

  return result;
}

export async function getPaymentStatus(mercadoPagoId: string) {
  const config = await getMPConfig();
  if (!config) throw new Error("Mercado Pago não configurado");

  const client = new MercadoPagoConfig({ accessToken: config.accessToken });
  const payment = new Payment(client);
  return payment.get({ id: mercadoPagoId });
}
