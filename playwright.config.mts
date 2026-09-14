import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de tela.
 *
 * **Roda contra o build de produção, não contra o `next dev`.** Os três últimos
 * defeitos de tela do site dependiam disso: o Suspense se comporta diferente
 * entre os dois, os pedaços de JavaScript são divididos de outro jeito, e o
 * Fast Refresh deixa elementos do framer parados no estado inicial no meio de
 * uma verificação. Testar em desenvolvimento daria resposta que não vale para
 * quem visita o site.
 *
 * Porta 3100 e pasta de build separada de propósito: a 3000 costuma estar
 * ocupada pelo `npm run dev`, e um build na `.next` derrubaria esse servidor.
 */

const PORTA = 3100;
const BASE = `http://localhost:${PORTA}`;

export default defineConfig({
  testDir: "./e2e",
  // Um navegador só. O site não usa nada que o Chromium renderize diferente do
  // resto, e três navegadores triplicariam o tempo do CI sem achar mais nada.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Falha de tela raramente é intermitente; quando é, é sinal de corrida de
  // verdade e merece investigação em vez de repetição. Uma tentativa a mais no
  // CI absorve lentidão de máquina compartilhada, e só.
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: BASE,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: {
    // O build vai por `scripts/preparar-e2e.mjs`, que o manda para uma pasta
    // separada e devolve tsconfig.json e next-env.d.ts ao estado anterior — o
    // Next reescreve os dois ao mudar a pasta de saída. O porquê está lá.
    command: `node scripts/preparar-e2e.mjs && npx next start --port ${PORTA}`,
    url: BASE,
    env: { NEXT_DIST_DIR: ".next-e2e", NEXT_PUBLIC_USE_MOCK: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 5 * 60 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
