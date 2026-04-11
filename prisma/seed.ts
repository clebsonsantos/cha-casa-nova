import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const existing = await prisma.admin.findUnique({
    where: { username: "admin.master" },
  });

  if (!existing) {
    const password = await bcrypt.hash("admin123", 12);
    await prisma.admin.create({
      data: {
        username: "admin.master",
        password,
        name: "Admin Master",
      },
    });
    console.log("✓ Admin criado: admin.master / admin123");
    console.log("  IMPORTANTE: Troque a senha imediatamente!");
  } else {
    console.log("✓ Admin já existe");
  }

  // Seed default site configs
  const configs = [
    { key: "couple_names", value: "João & Maria" },
    { key: "couple_story", value: "Estamos realizando o sonho de ter nosso lar! Cada presente que você escolher será guardado com muito carinho e fará parte da nossa história juntos. Obrigado por celebrar essa conquista conosco!" },
    { key: "event_date", value: "Sábado, 15 de Março de 2025" },
  ];

  for (const cfg of configs) {
    await prisma.siteConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    });
  }
  console.log("✓ Configurações padrão criadas");

  // Seed sample items
  const sampleItems = [
    { name: "Jogo de panelas", description: "Jogo com 5 peças antiaderentes, ideal para o dia a dia", pixPrice: 189.9, cardPrice: 209.9 },
    { name: "Cafeteira elétrica", description: "Cafeteira com capacidade para 30 xícaras", pixPrice: 99.9, cardPrice: 109.9 },
    { name: "Jogo de toalhas", description: "Kit com 4 toalhas de banho em algodão", pixPrice: 79.9, cardPrice: 89.9 },
    { name: "Liquidificador", description: "1000W com 5 velocidades e copo de vidro", pixPrice: 129.9, cardPrice: 144.9 },
    { name: "Jogo de cama casal", description: "Lençol, fronha e capa de edredom", pixPrice: 149.9, cardPrice: 164.9 },
    { name: "Ferro de passar", description: "Ferro a vapor com solado de cerâmica", pixPrice: 89.9, cardPrice: 99.9 },
  ];

  for (const item of sampleItems) {
    const existing = await prisma.item.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.item.create({ data: item });
    }
  }
  console.log(`✓ ${sampleItems.length} itens de exemplo criados`);

  console.log("\nSeed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
