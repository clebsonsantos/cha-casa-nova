import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "./prisma";

// ─── Chaves sensíveis que devem ser mascaradas na API de config ────────────
export const R2_SENSITIVE_KEYS = [
  "r2_secret_access_key",
  "r2_access_key_id",
] as const;

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

/** Lê config do R2 do banco (prioridade) com fallback para env vars */
export async function getR2Config(): Promise<R2Config | null> {
  const rows = await prisma.siteConfig.findMany({
    where: {
      key: {
        in: [
          "r2_account_id",
          "r2_access_key_id",
          "r2_secret_access_key",
          "r2_bucket_name",
        ],
      },
    },
  });

  const db: Record<string, string> = {};
  rows.forEach((r) => (db[r.key] = r.value));

  const accountId =
    db["r2_account_id"] || process.env.R2_ACCOUNT_ID || "";
  const accessKeyId =
    db["r2_access_key_id"] || process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey =
    db["r2_secret_access_key"] || process.env.R2_SECRET_ACCESS_KEY || "";
  const bucketName =
    db["r2_bucket_name"] || process.env.R2_BUCKET_NAME || "";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

/** Cria um cliente S3 com as credenciais atuais */
async function makeClient(): Promise<{ client: S3Client; bucket: string }> {
  const config = await getR2Config();
  if (!config) {
    throw new Error(
      "Cloudflare R2 não configurado. Acesse /admin/settings para configurar."
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client, bucket: config.bucketName };
}

/**
 * Gera URL pré-assinada para LEITURA (GET) — expira em 1h por padrão.
 * Use sempre que for exibir uma imagem armazenada no R2.
 */
export async function getPresignedImageUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const { client, bucket } = await makeClient();

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

/** Remove um objeto do bucket */
export async function deleteObject(key: string): Promise<void> {
  const { client, bucket } = await makeClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}

/** Retorna true se o valor parece ser uma key do R2 (não uma URL completa) */
export function isR2Key(value: string): boolean {
  return !!value && !value.startsWith("http");
}
