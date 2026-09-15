/**
 * Build de produção para os testes de tela, numa pasta separada.
 *
 * Por que não usar a pasta padrão: o `npm run dev` de quem está trabalhando
 * escreve na `.next`, e um build por cima dela derruba o servidor no meio da
 * sessão. A pasta separada deixa as duas coisas conviverem.
 *
 * Por que este script existe em vez de uma variável de ambiente solta: ao
 * mudar a pasta, o Next **reescreve `tsconfig.json` e `next-env.d.ts`** para
 * apontar para ela. Se essas mudanças ficassem, o build normal passaria a
 * procurar tipos numa pasta que só existe durante o teste. Aqui os dois
 * arquivos são lidos antes e devolvidos depois, byte a byte — sem depender do
 * git, para não atropelar alteração que alguém tenha em andamento neles.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PASTA = ".next-e2e";
const REESCRITOS = ["tsconfig.json", "next-env.d.ts"];

const antes = new Map(REESCRITOS.map((f) => [f, readFileSync(f)]));

const build = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_DIST_DIR: PASTA,
    // Dado de demonstração: o teste de tela não pode depender do Google estar
    // no ar. Precisa entrar já no build, porque `NEXT_PUBLIC_*` é embutido no
    // pacote do cliente em tempo de compilação.
    NEXT_PUBLIC_USE_MOCK: "1",
  },
});

for (const [arquivo, conteudo] of antes) {
  if (!readFileSync(arquivo).equals(conteudo)) writeFileSync(arquivo, conteudo);
}

process.exit(build.status ?? 1);
