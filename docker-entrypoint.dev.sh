#!/bin/sh
set -e

# ── Instala dependências só se package-lock.json mudou ─────────────────────
LOCK_HASH=$(md5sum package-lock.json | cut -d' ' -f1)
HASH_FILE=/app/node_modules/.install-hash

if [ -f "$HASH_FILE" ] && [ "$(cat $HASH_FILE)" = "$LOCK_HASH" ]; then
  echo "▶ [dev] Dependências já instaladas, pulando npm install..."
else
  echo "▶ [dev] Instalando dependências (package-lock mudou)..."
  npm install --legacy-peer-deps --silent
  echo "$LOCK_HASH" > "$HASH_FILE"
  echo "▶ [dev] Regenerando Prisma Client..."
  npx prisma generate
fi

# ── Garante Prisma Client no volume (primeira vez ou após limpeza) ──────────
if [ ! -f /app/node_modules/.prisma/client/index.js ]; then
  echo "▶ [dev] Regenerando Prisma Client (não encontrado)..."
  npx prisma generate
fi

# ── Aguarda o banco ─────────────────────────────────────────────────────────
echo "▶ [dev] Aguardando o banco de dados..."
until npx prisma db execute --stdin <<'SQL' > /dev/null 2>&1
SELECT 1;
SQL
do
  echo "   banco ainda não disponível, aguardando 2s..."
  sleep 2
done

# ── Schema e seed ───────────────────────────────────────────────────────────
echo "▶ [dev] Aplicando schema (db push)..."
npx prisma db push --skip-generate

echo "▶ [dev] Rodando seed (pula se dados já existem)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const existing = await prisma.admin.findUnique({ where: { username: 'admin.master' } });
  if (!existing) {
    const password = await bcrypt.hash('admin123', 12);
    await prisma.admin.create({ data: { username: 'admin.master', password, name: 'Admin Master' } });
    console.log('  ✓ Admin padrão criado: admin.master / admin123');
    console.log('  ⚠  Troque a senha em /admin/settings!');
  } else {
    console.log('  ✓ Admin já existe, pulando seed');
  }

  const defaults = [
    { key: 'couple_names', value: 'João & Maria' },
    { key: 'couple_story', value: 'Estamos realizando o sonho de ter nosso lar! Cada presente que você escolher será guardado com muito carinho.' },
    { key: 'event_date',   value: '' },
    { key: 'hero_image',   value: '' },
  ];
  for (const cfg of defaults) {
    await prisma.siteConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    });
  }
  console.log('  ✓ Configs padrão aplicadas');
  await prisma.\$disconnect();
}

seed().catch(e => { console.error('Seed falhou:', e.message); process.exit(1); });
"

echo "▶ [dev] Iniciando Next.js em modo desenvolvimento..."
exec "$@"
