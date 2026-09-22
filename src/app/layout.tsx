import { CORES, CORES_ESCURO } from "@/lib/cores";
import { SITE_URL } from "@/lib/constants";
import { SCRIPT_TEMA_INICIAL } from "@/lib/tema";
import type { Metadata, Viewport } from "next";
import { Fragment } from "react";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ProvedorDeMovimento } from "@/components/ProvedorDeMovimento";
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
  alternates: { canonical: "/" },
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
    site: "@GeogeTips",
    title: TITULO,
    description: DESCRICAO,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  // Pelo aparelho, para a primeira pintura. Quando a pessoa escolhe o
  // contrário do aparelho, o BotaoTema reescreve as duas tags.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: CORES.bg },
    { media: "(prefers-color-scheme: dark)", color: CORES_ESCURO.bg },
  ],
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
      // O script abaixo põe `data-tema` antes de o React chegar, e o servidor
      // não tem como saber o valor. A diferença é esperada; o aviso só vale
      // para os atributos deste elemento, não para os filhos.
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: texto fixo, montado no código a partir de uma constante; não passa nada vindo de fora. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
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
        <ProvedorDeMovimento>
          <UnidadeProvider>
            <Navigation />
            <main id="conteudo" className="flex-1">
              {/* O Fragment com chave não é enfeite (#86). Este `children` é o
                  roteador do Next, que recebe o componente do error.tsx como
                  propriedade: se o chunk dele ainda não carregou quando o React
                  chega aqui, o elemento fica pendente e a hidratação suspende.
                  Suspendendo direto no <main>, o React do Next 15 às vezes
                  retoma sem voltar o cursor e acusa o erro 418 de hidratação
                  (react/react#37584); no Fragment, que vira nó próprio, retomar
                  não mexe no cursor. Sem a chave o React desfaz o Fragment e o
                  defeito volta. Vale o mesmo para um error.tsx num segmento
                  cujo layout ponha `children` dentro de um elemento HTML.
                  Pode sair quando o react-dom embutido no Next já tiver
                  `popHydrationStateOnInterruptedWork` (react/react#35494, no
                  react-dom 19.3.0). */}
              <Fragment key="pagina">{children}</Fragment>
            </main>
            <Footer />
          </UnidadeProvider>
        </ProvedorDeMovimento>
      </body>
    </html>
  );
}
