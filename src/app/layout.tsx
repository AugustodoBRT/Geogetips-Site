import { CORES } from "@/lib/cores";
import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { UnidadeProvider } from "@/hooks/useUnidade";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://geogetips.vercel.app";

const TITULO = "GeogeTips — Matemática para ganhar";
const DESCRICAO =
  "Histórico aberto de apostas esportivas: cada uma planilhada, com ROI, " +
  "taxa de acerto e evolução da banca. Grupo gratuito no Telegram.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITULO,
    template: "%s · GeogeTips",
  },
  description: DESCRICAO,
  applicationName: "GeogeTips",
  // "tipster" fica só aqui: o site chama de adm, mas é o termo que as pessoas
  // digitam no Google. Palavra-chave de busca, não rótulo de interface.
  keywords: [
    "apostas esportivas",
    "grupo de apostas",
    "tipster",
    "gestão de banca",
    "análise de apostas",
    "palpites",
    "ROI apostas",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "GeogeTips",
    title: TITULO,
    description: DESCRICAO,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: CORES.bg,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        {/* Os elementos animados saem do servidor com opacity 0, e só o JS os
            revela. Sem JS o título da home ficaria invisível — isto garante
            que a página continue legível de qualquer forma. */}
        <noscript>
          <style>{`
            [style*="opacity:0"], [style*="opacity: 0"] {
              opacity: 1 !important;
              filter: none !important;
              transform: none !important;
            }
          `}</style>
        </noscript>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--text)] focus:text-[var(--bg)] focus:rounded-full focus:text-xs focus:font-bold"
        >
          Pular para o conteúdo
        </a>
        <UnidadeProvider>
          <Navigation />
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <Footer />
        </UnidadeProvider>
      </body>
    </html>
  );
}
