import type { NextConfig } from "next";
import path from "path";

/**
 * Headers enviados em todas as respostas — antes o site não mandava nenhum.
 *
 * Sem Content-Security-Policy de propósito: o Next e o framer-motion injetam
 * estilo inline, e uma política que os bloqueasse quebraria a página em
 * silêncio. Estes quatro não têm esse risco.
 */
const HEADERS_DE_SEGURANCA = [
  // Impede o navegador de "adivinhar" o tipo de um arquivo e executá-lo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Link para fora leva só o domínio, não o caminho da página de origem.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Outro domínio não consegue embutir o site num iframe para induzir clique.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // O site não usa câmera, microfone nem localização.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Não anuncia o framework em toda resposta (X-Powered-By: Next.js).
  poweredByHeader: false,
  // Existe um package-lock.json no diretório pai; sem isto o Next infere a raiz errada.
  outputFileTracingRoot: path.resolve(__dirname),
  // `next build` e `next dev` escrevem na mesma .next, e buildar com o dev no ar
  // derruba o servidor. Com NEXT_DIST_DIR o build vai para outra pasta e dá
  // para conferi-lo sem parar ninguém. Sem a variável, nada muda.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [{ source: "/:path*", headers: HEADERS_DE_SEGURANCA }];
  },
};

export default nextConfig;
