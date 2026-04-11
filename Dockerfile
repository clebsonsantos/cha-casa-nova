# ─── Stage 1: deps ───────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# OpenSSL 1.1 necessário para o Prisma engine no Alpine
RUN apk add --no-cache openssl libc6-compat ca-certificates

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ─── Stage 2: builder ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat ca-certificates

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera Prisma Client compatível com musl/Alpine
RUN npx prisma generate

RUN npm run build

# ─── Stage 3: runner (produção) ──────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat ca-certificates

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Build output standalone
COPY --from=builder /app/public           ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static

# Prisma: schema + engine + client + CLI
COPY --from=builder /app/prisma                    ./prisma
COPY --from=builder /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma      ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma       ./node_modules/prisma

# bcryptjs necessário para o entrypoint de seed
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Entrypoint que roda migrate + seed antes de iniciar
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
