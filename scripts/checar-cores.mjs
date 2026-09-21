/**
 * Garante que src/lib/cores.ts e o globals.css não divirjam.
 *
 * As duas listas existem porque o Satori não resolve CSS variable (ver o
 * comentário em cores.ts). Duas fontes para o mesmo valor é exatamente o
 * tipo de coisa que sai do lugar sem ninguém perceber — daí esta checagem.
 *
 * Cada objeto do cores.ts é conferido com o seu bloco: `CORES` com o `:root`,
 * `CORES_ESCURO` com o do tema escuro. Ler o arquivo inteiro de uma vez não
 * serve mais: o mesmo token aparece nos dois blocos, com valores diferentes.
 */
import { readFileSync } from "node:fs";

const ts = readFileSync("src/lib/cores.ts", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

const PARES = [
  { objeto: "CORES", seletor: ":root" },
  { objeto: "CORES_ESCURO", seletor: ':root[data-tema="escuro"]' },
];

function blocoCss(seletor) {
  const inicio = css.indexOf(`\n${seletor} {`);
  if (inicio === -1) return null;
  return css.slice(inicio, css.indexOf("\n}", inicio));
}

function objetoTs(nome) {
  return ts.match(new RegExp(`export const ${nome} = \\{([\\s\\S]*?)\\} as const`))?.[1];
}

const paraToken = (chave) =>
  `--${chave
    .replace(/([A-Z])/g, "-$1")
    .replace(/(\d)/g, "-$1")
    .toLowerCase()}`;

const problemas = [];
for (const { objeto, seletor } of PARES) {
  const bloco = blocoCss(seletor);
  const corpo = objetoTs(objeto);
  if (!bloco) {
    problemas.push(`bloco ${seletor} não existe no globals.css`);
    continue;
  }
  if (!corpo) {
    problemas.push(`${objeto} não existe no cores.ts`);
    continue;
  }

  const emCss = new Map();
  for (const [, nome, valor] of bloco.matchAll(
    /(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/g
  )) {
    emCss.set(nome, valor.toUpperCase());
  }

  for (const [, chave, valor] of corpo.matchAll(
    /^\s{2}(\w+):\s*"(#[0-9A-Fa-f]{6})",/gm
  )) {
    const token = paraToken(chave);
    const doCss = emCss.get(token);
    if (!doCss) problemas.push(`${objeto}.${chave}: ${token} não existe em ${seletor}`);
    else if (doCss !== valor.toUpperCase())
      problemas.push(
        `${objeto}.${chave}: cores.ts diz ${valor}, ${seletor} diz ${doCss}`
      );
  }
}

if (problemas.length) {
  console.error("Paleta fora de sincronia:");
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("Paleta sincronizada entre cores.ts e globals.css, nos dois temas.");
