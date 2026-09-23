/** Formatação pt-BR centralizada — evita o `.toFixed(2).replace(".", ",")` espalhado. */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BRL_SINAL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  signDisplay: "exceptZero",
});

/** 9.22 -> "R$ 9,22" */
export function formatarReais(valor: number): string {
  return BRL.format(valor);
}

/**
 * 9.22 -> "+R$ 9,22"  ·  -9.22 -> "-R$ 9,22"  ·  0 -> "R$ 0,00"
 *
 * Zero sai sem sinal. Com `signDisplay: "always"`, o dia só com apostas
 * pendentes aparecia no feed como "+R$ 0,00", que se lê como lucro, e um zero
 * negativo de soma de ponto flutuante sairia "-R$ 0,00". `exceptZero` decide
 * depois de arredondar: -0,001 também vira "R$ 0,00".
 */
export function formatarReaisComSinal(valor: number): string {
  return BRL_SINAL.format(valor);
}

/**
 * Os mesmos formatos, para os números animados (`NumeroAnimado`), que recebem
 * as opções do `Intl` em vez de texto pronto.
 *
 * ROI com duas casas e taxa de acerto com uma, sempre: sem o mínimo, um ROI de
 * 5,10% aparecia "+5,1%" no cartão e "+5,10%" na tabela logo abaixo.
 */
export const FORMATO_REAIS_COM_SINAL = {
  style: "currency",
  currency: "BRL",
  signDisplay: "exceptZero",
} as const satisfies Intl.NumberFormatOptions;

export const FORMATO_ROI = {
  signDisplay: "exceptZero",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const satisfies Intl.NumberFormatOptions;

export const FORMATO_TAXA = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
} as const satisfies Intl.NumberFormatOptions;

/**
 * A cor de um resultado: verde acima de zero, vermelho abaixo, neutro no zero.
 *
 * Zero não é ganho nem perda. Espalhado como `valor >= 0 ? verde : vermelho`,
 * ele saía verde em toda lista do site — a casa que só tem aposta pendente, o
 * adm que empatou, o mês em andamento.
 */
export function corDoValor(valor: number): string {
  if (ehZero(valor)) return "text-[var(--text)]";
  return valor > 0 ? "text-[var(--green)]" : "text-[var(--red)]";
}

/**
 * A mesma regra de `corDoValor` para quem pinta por atributo, e não por classe:
 * o SVG do gráfico, que preenche com `fill` e `stroke`.
 *
 * O neutro aqui é `--text-3`, não `--text`: é o cinza das marcas desenhadas, o
 * mesmo da barra zerada em /estatisticas e /historico. Para texto, `corDoValor`.
 */
export function varDoValor(valor: number): string {
  if (ehZero(valor)) return "var(--text-3)";
  return valor > 0 ? "var(--green)" : "var(--red)";
}

const PORCENTAGEM = new Intl.NumberFormat("pt-BR", FORMATO_ROI);

/** "+9,69%", "-9,17%" e "0,00%" — o zero sem sinal, como nos reais. */
export function formatarPorcentagem(valor: number): string {
  return `${PORCENTAGEM.format(valor)}%`;
}

/**
 * O valor em reais é zero depois de arredondar ao centavo?
 *
 * Para a cor: zero não é ganho nem perda. O dia só com pendentes saía verde.
 */
export function ehZero(valor: number): boolean {
  return Math.abs(valor) < 0.005;
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

/**
 * Odd como a casa escreve: duas casas, ou três quando a terceira existe.
 * 2 -> "2,00", 1.875 -> "1,875", 1.85 -> "1,85". É a odd digitada na
 * calculadora, que aceita três casas: com duas, 1,875 viraria "1,88".
 */
export function formatarOddExata(odd: number): string {
  const tres = odd.toFixed(3);
  return (tres.endsWith("0") ? odd.toFixed(2) : tres).replace(".", ",");
}

/**
 * Odd justa, sempre com três casas: 2.7811 -> "2,781".
 *
 * É a régua contra a qual se compara a odd encontrada, que pode ter três
 * casas. Com duas, a odd justa de 2,781 aparecia como "2,78", e a tela dizia
 * "Sem valor" para uma odd de 2,78 e, na mesma frase, "tem valor qualquer odd
 * acima de 2,78".
 */
export function formatarOddJusta(odd: number): string {
  return odd.toFixed(3).replace(".", ",");
}

/** 2.5 -> "+2,50u"  ·  -1.25 -> "-1,25u"  ·  0 -> "0,00u", sem sinal, como nos reais. */
export function formatarUnidades(unidades: number): string {
  const tamanho = Math.abs(unidades).toFixed(2).replace(".", ",");
  if (tamanho === "0,00") return "0,00u";
  return `${unidades > 0 ? "+" : "-"}${tamanho}u`;
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
