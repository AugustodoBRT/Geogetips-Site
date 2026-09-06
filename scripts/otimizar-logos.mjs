/**
 * Reduz os SVG de logo em public/casas.
 *
 * As logos que as casas publicam costumam vir vetorizadas a partir do bitmap,
 * com coordenadas de oito casas decimais — puro ruído do tracer. Arredondar
 * para uma casa cortou 82% no arquivo da Betano e 37% no da 4play, sem
 * diferença visível nem a 4x de ampliação.
 *
 * Roda de novo com segurança: já otimizado, não muda nada.
 *
 * Cuidado que motivou este arquivo: a primeira versão arredondava o documento
 * inteiro e transformava <?xml version="1.0"?> em version="1", XML inválido
 * que o navegador recusa em silêncio. Por isso o arredondamento só toca os
 * atributos `d` dos caminhos.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const PASTA = "public/casas";
const CASAS_DECIMAIS = 1;

/**
 * Comandos minúsculos (m l h v c s q t a) são RELATIVOS: cada ponto parte do
 * anterior. Arredondar ali soma o erro a cada segmento e o caminho vai
 * derivando — foi assim que o "65" sumiu do logo da bet365, que tem 56
 * comandos relativos. Em comando absoluto cada ponto é independente e o erro
 * não se propaga, então só nesse caso o arredondamento é seguro.
 */
function temComandoRelativo(d) {
  return /[mlhvcsqta]/.test(d);
}

function otimizar(svg) {
  const fator = 10 ** CASAS_DECIMAIS;
  return svg
    .replace(/<\?xml[^?]*\?>\s*/, "")
    .replace(/\sd="([^"]+)"/g, (inteiro, d) => {
      if (temComandoRelativo(d)) return inteiro;
      return ` d="${d.replace(/-?\d+\.\d+/g, (n) =>
        String(Math.round(parseFloat(n) * fator) / fator)
      )}"`;
    })
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

const kb = (n) => (n / 1024).toFixed(1).padStart(6) + " KB";

let arquivos;
try {
  arquivos = readdirSync(PASTA).filter((f) => f.endsWith(".svg"));
} catch {
  console.log(`Pasta ${PASTA} não existe ainda — nada a fazer.`);
  process.exit(0);
}

if (arquivos.length === 0) {
  console.log("Nenhum SVG em " + PASTA + ".");
  process.exit(0);
}

let antesTotal = 0;
let depoisTotal = 0;

for (const nome of arquivos) {
  const caminho = join(PASTA, nome);
  const original = readFileSync(caminho, "utf8");
  const reduzido = otimizar(original);

  // Não grava se não mudou nada: mantém o diff limpo em execuções repetidas.
  if (reduzido !== original) writeFileSync(caminho, reduzido, "utf8");

  const a = Buffer.byteLength(original);
  const d = Buffer.byteLength(reduzido);
  antesTotal += a;
  depoisTotal += d;

  const ganho = a > 0 ? Math.round(((a - d) / a) * 100) : 0;
  console.log(
    `  ${nome.padEnd(24)} ${kb(a)} -> ${kb(d)}  ${
      ganho > 0 ? `(-${ganho}%)` : "(já otimizado)"
    }`
  );
}

const gz = arquivos.reduce(
  (soma, f) => soma + gzipSync(readFileSync(join(PASTA, f))).length,
  0
);

console.log("");
console.log(`  ${arquivos.length} logo(s): ${kb(antesTotal)} -> ${kb(depoisTotal)}`);
console.log(`  servido comprimido: ${kb(gz)}`);
if (arquivos.length > 0) {
  const projecao = (gz / arquivos.length) * 98;
  console.log(`  projeção para as 98 casas: ~${Math.round(projecao / 1024)} KB`);
}
