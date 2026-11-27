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
 *
 * E, antes de tudo isso, garante que a comparação ACONTECEU (#135). A versão
 * anterior casava `#RRGGBB` nos dois lados: um token que deixasse de ser
 * hexadecimal de seis dígitos — `oklch()`, `color-mix()`, `rgb()` — saía do
 * laço sem erro e sem aviso, e o script imprimia "Paleta sincronizada" sem ter
 * olhado justamente o token que mudou. Isso não é hipótese remota: o
 * comentário de globals.css:33-42 explica por que o projeto vai querer outra
 * sintaxe de cor, e qualquer caminho que resolva aquilo encosta no formato.
 *
 * Agora os dois lados são lidos com qualquer valor, e o que a comparação não
 * sabe ler é reclamado em voz alta. Um portão que não distingue "está tudo
 * igual" de "não sei ler isto" é pior que portão nenhum: ele dá a senha.
 */
import { readFileSync } from "node:fs";

const ts = readFileSync("src/lib/cores.ts", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

/**
 * Os tokens que existem duas vezes, declarados aqui de propósito.
 *
 * É a terceira cópia dos NOMES — não dos valores — e é ela que faz a conta
 * fechar nos dois sentidos. Derivar a lista de um dos dois arquivos devolveria
 * o furo: o laço antigo era dirigido pelas entradas do cores.ts, então apagar
 * uma chave de lá encolhia a comparação e o script continuava verde. Com a
 * lista aqui, falta em qualquer um dos lados aparece.
 *
 * Token que passa a precisar de literal (ou deixa de precisar) se acrescenta
 * ou se tira aqui também, e o script diz qual lado ficou sozinho.
 */
const PARES = [
  {
    objeto: "CORES",
    seletor: ":root",
    espelhados: [
      "bg",
      "bgCard",
      "text",
      "text2",
      "text3",
      "accent",
      "green",
      "red",
      "amber",
    ],
  },
  {
    objeto: "CORES_ESCURO",
    seletor: ':root[data-tema="escuro"]',
    espelhados: ["bg"],
  },
];

/** O único formato que esta comparação sabe ler — e dizer isso é o ponto. */
const HEXADECIMAL = /^#[0-9A-Fa-f]{6}$/;

function blocoCss(seletor) {
  const inicio = css.indexOf(`\n${seletor} {`);
  if (inicio === -1) return null;
  // Comentário fora antes de procurar declaração: o `:root` tem comentário com
  // hexadecimal e com nome de token dentro (o de `--text-3` cita #736C82 e
  // `--bg-alt`), e o que se confere é o que está declarado, não o que está
  // explicado. Hoje nenhum deles casaria a forma `--token: valor;`, mas a
  // checagem não deve depender de como os comentários estão escritos.
  return css.slice(inicio, css.indexOf("\n}", inicio)).replace(/\/\*[\s\S]*?\*\//g, "");
}

function objetoTs(nome) {
  return ts.match(new RegExp(`export const ${nome} = \\{([\\s\\S]*?)\\} as const`))?.[1];
}

/** Toda declaração do bloco, com o valor cru. Qualquer sintaxe entra. */
function declaracoesDoCss(bloco) {
  const mapa = new Map();
  for (const [, nome, valor] of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    mapa.set(nome, valor.trim());
  }
  return mapa;
}

/** Toda entrada do objeto, com o valor cru. Qualquer sintaxe entra. */
function entradasDoTs(corpo) {
  const mapa = new Map();
  for (const [, chave, valor] of corpo.matchAll(/^\s{2}(\w+):\s*"([^"]*)",/gm)) {
    mapa.set(chave, valor);
  }
  return mapa;
}

const paraToken = (chave) =>
  `--${chave
    .replace(/([A-Z])/g, "-$1")
    .replace(/(\d)/g, "-$1")
    .toLowerCase()}`;

const problemas = [];
let comparados = 0;

for (const { objeto, seletor, espelhados } of PARES) {
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

  const doCss = declaracoesDoCss(bloco);
  const doTs = entradasDoTs(corpo);

  // O outro sentido: chave que entrou no cores.ts sem entrar na lista acima
  // não seria conferida por ninguém, e é assim que uma cópia nasce fora do
  // alcance do portão.
  for (const chave of doTs.keys()) {
    if (!espelhados.includes(chave)) {
      problemas.push(
        `${objeto}.${chave} existe no cores.ts e não está na lista de espelhados deste script`
      );
    }
  }

  for (const chave of espelhados) {
    const token = paraToken(chave);
    const valorTs = doTs.get(chave);
    const valorCss = doCss.get(token);

    if (valorTs === undefined) {
      problemas.push(
        `${objeto}.${chave} está na lista de espelhados e não existe no cores.ts`
      );
      continue;
    }
    if (valorCss === undefined) {
      problemas.push(`${token} não existe em ${seletor}, e ${objeto}.${chave} copia ele`);
      continue;
    }
    if (!HEXADECIMAL.test(valorTs)) {
      problemas.push(
        `${objeto}.${chave} vale "${valorTs}", e esta checagem só sabe comparar #RRGGBB`
      );
      continue;
    }
    if (!HEXADECIMAL.test(valorCss)) {
      problemas.push(
        `${seletor} diz ${token}: "${valorCss}", e esta checagem só sabe comparar #RRGGBB`
      );
      continue;
    }
    if (valorTs.toUpperCase() !== valorCss.toUpperCase()) {
      problemas.push(
        `${objeto}.${chave}: cores.ts diz ${valorTs}, ${seletor} diz ${valorCss}`
      );
      continue;
    }
    comparados += 1;
  }
}

const esperados = PARES.reduce((n, { espelhados }) => n + espelhados.length, 0);
// Rede por baixo das reclamações acima: se algum caminho deixar de comparar um
// token sem ter dito por quê, a conta não fecha e o portão não passa.
if (comparados !== esperados && problemas.length === 0) {
  problemas.push(`comparou ${comparados} de ${esperados} tokens sem dizer o que faltou`);
}

if (problemas.length) {
  console.error("Paleta fora de sincronia:");
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `Paleta sincronizada entre cores.ts e globals.css: ${comparados} tokens conferidos nos dois temas.`
);
