/**
 * Garante que src/lib/cores.ts e o :root do globals.css não divirjam.
 *
 * As duas listas existem porque o Satori não resolve CSS variable (ver o
 * comentário em cores.ts). Duas fontes para o mesmo valor é exatamente o
 * tipo de coisa que sai do lugar sem ninguém perceber — daí esta checagem.
 */
import { readFileSync } from "node:fs";

const ts = readFileSync("src/lib/cores.ts", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

const emCss = new Map();
for (const [, nome, valor] of css.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
  emCss.set(nome, valor.toUpperCase());
}

const paraToken = (chave) =>
  "--" + chave.replace(/([A-Z])/g, "-$1").replace(/(\d)/g, "-$1").toLowerCase();

const problemas = [];
for (const [, chave, valor] of ts.matchAll(/^\s{2}(\w+):\s*"(#[0-9A-Fa-f]{6})",/gm)) {
  const token = paraToken(chave);
  const doCss = emCss.get(token);
  if (!doCss) problemas.push(`${chave}: ${token} não existe no globals.css`);
  else if (doCss !== valor.toUpperCase())
    problemas.push(`${chave}: cores.ts diz ${valor}, globals.css diz ${doCss}`);
}

if (problemas.length) {
  console.error("Paleta fora de sincronia:");
  for (const p of problemas) console.error("  - " + p);
  process.exit(1);
}
console.log("Paleta sincronizada entre cores.ts e globals.css.");
