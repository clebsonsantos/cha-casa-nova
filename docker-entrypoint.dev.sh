#!/bin/sh
set -e

echo "▶ [dev] Instalando dependências (caso package.json mudou)..."
npm install --legacy-peer-deps --silent

echo "▶ [dev] Regenerando Prisma Client para o ambiente Alpine..."
npx prisma generate

echo "▶ [dev] Aguardando o banco de dados..."
until npx prisma db execute --stdin <<'SQL' > /dev/null 2>&1
SELECT 1;
SQL
do
  echo "   banco ainda não disponível, aguardando 2s..."
  sleep 2
done

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
