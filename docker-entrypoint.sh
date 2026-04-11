#!/bin/sh
set -e

echo "▶ [prod] Aguardando o banco de dados..."
until node -e "
const net = require('net');
const url = new URL(process.env.DATABASE_URL);
const port = parseInt(url.port) || 5432;
const host = url.hostname;
const c = net.connect(port, host, () => { c.destroy(); process.exit(0); });
c.on('error', () => process.exit(1));
" 2>/dev/null; do
  echo "   banco ainda não disponível, aguardando 2s..."
  sleep 2
done
echo "   banco disponível!"

echo "▶ [prod] Rodando migrations..."
# migrate deploy aplica migrations existentes (não altera esquema direto)
# db push é fallback para projetos sem pasta migrations/
if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy --schema=./prisma/schema.prisma
else
  npx prisma db push --schema=./prisma/schema.prisma --skip-generate
fi

echo "▶ [prod] Rodando seed (pula se dados já existem)..."
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

echo "▶ [prod] Iniciando Next.js..."
exec "\$@"
