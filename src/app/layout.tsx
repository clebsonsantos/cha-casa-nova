import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import MusicPlayerWrapper from "@/components/MusicPlayerWrapper";
import { prisma } from "@/lib/prisma";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chá de Casa Nova",
  description: "Celebre conosco! Escolha um presente para a nossa nova casa.",
  openGraph: {
    title: "Chá de Casa Nova",
    description: "Celebre conosco! Escolha um presente para a nossa nova casa.",
  },
};

async function getYoutubeUrl(): Promise<string | undefined> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { key: "youtube_music_url" },
    });
    return row?.value || undefined;
  } catch {
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const youtubeUrl = await getYoutubeUrl();

  return (
    <html lang="pt-BR" className={`${playfair.variable} ${lato.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-gray-800 font-[var(--font-lato)]">
        {children}
        <MusicPlayerWrapper youtubeUrl={youtubeUrl} />
      </body>
    </html>
  );
}
