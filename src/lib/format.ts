/** Formatação pt-BR centralizada — evita o `.toFixed(2).replace(".", ",")` espalhado. */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BRL_SINAL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  signDisplay: "always",
});

/** 9.22 -> "R$ 9,22" */
export function formatarReais(valor: number): string {
  return BRL.format(valor);
}

/** 9.22 -> "+R$ 9,22"  ·  -9.22 -> "-R$ 9,22" */
export function formatarReaisComSinal(valor: number): string {
  return BRL_SINAL.format(valor);
}

const INTEIRO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/**
 * Contagem inteira com separador de milhar.
 *
 * Os valores em real já saíam pelo Intl, mas as contagens iam cruas ao lado
 * deles: a home mostrava "+R$ 39.867,60" e, no mesmo cartão, "1970 green".
 */
export function formatarInteiro(valor: number): string {
  return INTEIRO.format(valor);
}

/**
 * Menor e maior unidade que o site aceita de quem digita.
 *
 * O teto não é frescura: com 1u = R$ 1 bilhão, o KPI vira uma tira de dígitos
 * que atravessa o card, e nenhuma banca real chega perto. O piso é um centavo.
 */
export const UNIDADE_MINIMA = 0.01;
export const UNIDADE_MAXIMA = 1_000_000;

/**
 * Lê um número escrito como se escreve no Brasil.
 *
 * O campo de unidade só trocava vírgula por ponto e entregava a `parseFloat`.
 * Quem digitava **"1.000"**, pensando em mil reais, recebia **R$ 1,00** — e daí
 * em diante o site inteiro mostrava valores cem vezes menores, em silêncio, num
 * site cuja promessa é bater com a planilha.
 *
 * As regras, na ordem em que decidem:
 *
 * - vírgula é sempre decimal, e ponto antes dela é milhar: "1.500,50" → 1500.5
 * - só pontos, em grupos de três ("1.000", "12.345.678"): milhar → 1000
 * - um ponto só, com uma ou duas casas ("1.5", "12.34"): decimal, porque é
 *   assim que sai de teclado de celular e de copiar-colar
 * - texto sem dígito, zero, negativo ou fora dos limites: `null`, e quem chamou
 *   decide o que fazer
 */
export function lerNumeroBR(texto: string): number | null {
  const limpo = texto.replace(/\s|R\$/g, "").trim();
  if (!/\d/.test(limpo) || /[^\d.,-]/.test(limpo)) return null;

  let normalizado: string;
  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) {
    normalizado = limpo.replace(/\./g, "");
  } else {
    normalizado = limpo;
  }

  const n = Number.parseFloat(normalizado);
  if (!Number.isFinite(n) || n < UNIDADE_MINIMA || n > UNIDADE_MAXIMA) return null;
  return n;
}

/** 1.72 -> "1,72" */
export function formatarOdd(odd: number): string {
  return odd.toFixed(2).replace(".", ",");
}

/** 2.5 -> "+2,50u" */
export function formatarUnidades(unidades: number): string {
  const sinal = unidades >= 0 ? "+" : "";
  return `${sinal}${unidades.toFixed(2).replace(".", ",")}u`;
}

/**
 * -9.35 -> "9,35u": o tamanho, para ir ao lado de um valor em reais que já
 * leva o sinal e a cor. "-R$ 935,00 (-9,35u)" diria o sinal duas vezes.
 */
export function formatarUnidadesSemSinal(unidades: number): string {
  return `${Math.abs(unidades).toFixed(2).replace(".", ",")}u`;
}

/**
 * Classe de tamanho para o número grande de um card de KPI.
 *
 * O card tem largura fixa e o valor cresce com a banca: "+R$ 461,00" cabe em
 * 4xl, "+R$ 38.898,40" já encosta na borda, e o conversor de unidade permite
 * valores bem maiores. Encolher a fonte conforme o texto cresce evita estouro
 * sem precisar quebrar linha no meio de um valor monetário.
 */
export function tamanhoDoValor(texto: string, compacto = false): string {
  const n = texto.length;
  // Compacto é o cartão de meia largura do celular (~130 px de miolo): um
  // degrau abaixo na base, e o mesmo tamanho de sempre a partir de `sm`.
  if (compacto) {
    if (n <= 10) return "text-2xl sm:text-4xl";
    if (n <= 13) return "text-xl sm:text-3xl";
    if (n <= 16) return "text-lg sm:text-2xl";
    return "text-base sm:text-xl";
  }
  if (n <= 10) return "text-3xl sm:text-4xl";
  if (n <= 13) return "text-2xl sm:text-3xl";
  if (n <= 16) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}

/**
 * "há 3 min" a partir de um ISO. Usado no selo de frescura do painel.
 *
 * A precisão é limitada pelo cache da API: o carimbo marca quando o servidor
 * montou a resposta, e ela vale até a leitura da planilha expirar (60 s). Por isso o menor
 * degrau é "agora" em vez de contar segundos, que daria falsa precisão.
 */
export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const seg = Math.max(0, Math.floor((agora.getTime() - new Date(iso).getTime()) / 1000));
  if (seg < 90) return "agora";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas} h`;
  return `há ${Math.floor(horas / 24)} d`;
}

/**
 * Reparte 100% entre os valores sem sobrar nem faltar ponto.
 *
 * Arredondar cada fatia por conta própria não fecha a conta: 305, 623, 107 e 64
 * de 1.099 apostas viravam 28 + 57 + 10 + 6 = **101%** na legenda da rosca.
 * Aqui cada fatia leva a parte inteira, e os pontos que sobram vão para quem
 * tem a maior fração descartada — o método do maior resto, que é o jeito
 * clássico de repartir cadeira em eleição pelo mesmo motivo.
 */
export function percentuaisRedondos(valores: readonly number[]): number[] {
  const total = valores.reduce((acc, v) => acc + v, 0);
  if (total <= 0) return valores.map(() => 0);

  const exatos = valores.map((v) => (v / total) * 100);
  const inteiros = exatos.map(Math.floor);
  let sobra = 100 - inteiros.reduce((acc, v) => acc + v, 0);

  const porResto = exatos
    .map((exato, i) => ({ i, resto: exato - Math.floor(exato) }))
    .sort((a, b) => b.resto - a.resto);

  for (let k = 0; sobra > 0 && k < porResto.length; k++, sobra--) {
    inteiros[porResto[k].i] += 1;
  }
  return inteiros;
}
