import { prisma } from "@/lib/prisma";
import { isR2Key } from "@/lib/r2";
import StoreFront from "@/components/StoreFront";
import Footer from "@/components/Footer";
import Image from "next/image";

async function getSiteConfig() {
  const configs = await prisma.siteConfig.findMany({
    where: {
      key: {
        in: [
          "hero_image",
          "couple_story",
          "couple_names",
          "event_date",
          "social_instagram",
          "social_whatsapp",
          "social_facebook",
        ],
      },
    },
  });
  const result: Record<string, string> = {};
  configs.forEach((c) => (result[c.key] = c.value));
  return result;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getSiteConfig();

  const coupleNames = config.couple_names || "Nosso Casal";
  const coupleStory =
    config.couple_story ||
    "Estamos realizando o sonho de ter nosso lar! Cada presente que você escolher será guardado com muito carinho e fará parte da nossa história juntos. Obrigado por celebrar essa conquista conosco!";
  const eventDate = config.event_date || "";

  // Mesma lógica dos itens: key R2 → /api/image?key=, URL externa → usa direto
  const rawHero = config.hero_image || "";
  const heroImage = rawHero
    ? isR2Key(rawHero)
      ? `/api/image?key=${encodeURIComponent(rawHero)}`
      : rawHero
    : "";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#A9DCA4] via-[#D4EED1] to-[#fafafa] pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C9A84C] font-medium tracking-widest text-sm uppercase mb-4">
            Chá de Casa Nova
          </p>
          <h1 className="font-[var(--font-playfair)] text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            {coupleNames}
          </h1>
          {eventDate && (
            <p className="text-gray-500 text-lg mb-6">{eventDate}</p>
          )}

          {/* Couple photo */}
          {heroImage ? (
            <div className="relative w-48 h-48 mx-auto mb-8 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <Image src={heroImage} alt={coupleNames} fill sizes="192px" className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto mb-8 rounded-full bg-white/60 border-4 border-white shadow-xl flex items-center justify-center">
              <svg className="w-20 h-20 text-[#A9DCA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          )}

          {/* Story */}
          <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white">
            <h2 className="font-[var(--font-playfair)] text-xl text-[#6DB567] mb-3">
              Nossa História
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{coupleStory}</p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-[#C9A84C]/20 blur-xl" />
        <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full bg-[#A9DCA4]/40 blur-2xl" />
      </section>

      {/* Store */}
      <section className="flex-1 py-12 px-4 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-[var(--font-playfair)] text-3xl font-bold text-gray-800 mb-2">
              Lista de Presentes
            </h2>
            <p className="text-gray-500">
              Escolha um item e nos surpreenda com seu carinho
            </p>
          </div>
          <StoreFront />
        </div>
      </section>

      <Footer
        instagram={config.social_instagram}
        whatsapp={config.social_whatsapp}
        facebook={config.social_facebook}
      />
    </div>
  );
}
