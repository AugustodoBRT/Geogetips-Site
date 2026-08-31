/**
 * Cálculos puros sobre apostas. Sem dependência de servidor, para que
 * client components possam importar as mesmas contas que a API usa.
 */
import { BetItem, TipsterStat, SportBreakdown, BookieBreakdown } from "./types";
import { reaisParaUnidades } from "./constants";

/**
 * Taxa de acerto sobre apostas FINALIZADAS.
 * Pendente não conta como perdida — é a única definição usada no site.
 */
export function taxaDeAcerto(greens: number, reds: number): number {
  const finalizadas = greens + reds;
  if (finalizadas === 0) return 0;
  return parseFloat(((greens / finalizadas) * 100).toFixed(1));
}

/**
 * ROI = lucro ÷ investido, em %.
 *
 * É a métrica que o mercado usa para comparar grupos, e não é intercambiável
 * com taxa de acerto: 32% de acerto em odds 5 rende mais que 63% em odds 1,5.
 *
 * O denominador é o investido de TODAS as apostas, incluindo anuladas e
 * pendentes — é assim que a planilha do grupo calcula, e os números do site
 * precisam bater com ela linha a linha.
 */
export function calcularRoi(bets: BetItem[]): number {
  const investido = bets.reduce((acc, b) => acc + b.valor, 0);
  if (investido === 0) return 0;
  const lucro = bets.reduce((acc, b) => acc + b.lucro, 0);
  return parseFloat(((lucro / investido) * 100).toFixed(2));
}

/** Média de odd de um conjunto de apostas. 0 se vazio. */
export function mediaDeOdd(bets: BetItem[]): number {
  if (bets.length === 0) return 0;
  const soma = bets.reduce((acc, b) => acc + b.odd, 0);
  return parseFloat((soma / bets.length).toFixed(2));
}

const CORES_AVATAR = [
  "from-[#2D8659] to-[#34d399]",
  "from-[#3b82f6] to-[#60a5fa]",
  "from-[#B8860B] to-[#f59e0b]",
  "from-[#C23B22] to-[#f87171]",
  "from-[#8b5cf6] to-[#a78bfa]",
];

export function computeStatsFromBets(bets: BetItem[]) {
  const totalBets = bets.length;
  const greenBets = bets.filter((b) => b.resultado === "GREEN");
  const redBets = bets.filter((b) => b.resultado === "RED");
  const greens = greenBets.length;
  const reds = redBets.length;
  const pendings = bets.filter((b) => b.resultado === "PENDENTE").length;
  const voids = bets.filter((b) => b.resultado === "VOID").length;

  const totalLucro = bets.reduce((acc, b) => acc + b.lucro, 0);
  // Investido = todas as apostas, na mesma definição da planilha
  const totalApostado = bets.reduce((acc, b) => acc + b.valor, 0);

  const lucros = bets
    .filter((b) => b.resultado === "GREEN" || b.resultado === "RED")
    .map((b) => b.lucro);
  const maiorGreen = lucros.length > 0 ? Math.max(...lucros, 0) : 0;
  const maiorRed = lucros.length > 0 ? Math.min(...lucros, 0) : 0;

  // Tipsters
  const tipsterMap = new Map<
    string,
    {
      esportes: Set<string>;
      greens: number;
      reds: number;
      total: number;
      lucro: number;
      apostado: number;
    }
  >();

  bets.forEach((b) => {
    const t = tipsterMap.get(b.tipster) || {
      esportes: new Set<string>(),
      greens: 0,
      reds: 0,
      total: 0,
      lucro: 0,
      apostado: 0,
    };
    t.total += 1;
    t.lucro += b.lucro;
    if (b.esporte) t.esportes.add(b.esporte);
    if (b.resultado === "GREEN") t.greens += 1;
    if (b.resultado === "RED") t.reds += 1;
    t.apostado += b.valor;
    tipsterMap.set(b.tipster, t);
  });

  const tipsters: TipsterStat[] = Array.from(tipsterMap.entries())
    .map(([nome, d], idx) => ({
      nome,
      esportes: Array.from(d.esportes),
      avatarColor: CORES_AVATAR[idx % CORES_AVATAR.length],
      initial: nome.charAt(0).toUpperCase() || "T",
      taxaAcerto: taxaDeAcerto(d.greens, d.reds),
      totalApostas: d.total,
      lucroUnidades: reaisParaUnidades(d.lucro),
      roi:
        d.apostado > 0
          ? parseFloat(((d.lucro / d.apostado) * 100).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.lucroUnidades - a.lucroUnidades);

  // Esportes
  const sportMap = new Map<
    string,
    { total: number; greens: number; reds: number; lucro: number; apostado: number }
  >();
  bets.forEach((b) => {
    let cleanSport = (b.esporte || "Outros").trim() || "Outros";
    cleanSport = cleanSport.charAt(0).toUpperCase() + cleanSport.slice(1);
    const s = sportMap.get(cleanSport) || {
      total: 0,
      greens: 0,
      reds: 0,
      lucro: 0,
      apostado: 0,
    };
    s.total += 1;
    s.lucro += b.lucro;
    if (b.resultado === "GREEN") s.greens += 1;
    if (b.resultado === "RED") s.reds += 1;
    s.apostado += b.valor;
    sportMap.set(cleanSport, s);
  });

  const sports: SportBreakdown[] = Array.from(sportMap.entries())
    .map(([esporte, d]) => {
      let icone: "soccer" | "basketball" | "tennis" = "soccer";
      const lower = esporte.toLowerCase();
      if (lower.includes("nba") || lower.includes("basquete")) icone = "basketball";
      else if (lower.includes("tênis") || lower.includes("tenis")) icone = "tennis";

      return {
        esporte,
        icone,
        apostas: d.total,
        taxaAcerto: taxaDeAcerto(d.greens, d.reds),
        lucro: parseFloat(d.lucro.toFixed(2)),
        roi:
          d.apostado > 0
            ? parseFloat(((d.lucro / d.apostado) * 100).toFixed(2))
            : 0,
      };
    })
    .sort((a, b) => b.apostas - a.apostas);

  // Casas
  const bookieMap = new Map<string, number>();
  bets.forEach((b) => {
    if (b.casa) bookieMap.set(b.casa, (bookieMap.get(b.casa) || 0) + 1);
  });

  const maxBookie = Math.max(...Array.from(bookieMap.values()), 1);
  const bookies: BookieBreakdown[] = Array.from(bookieMap.entries())
    .map(([casa, apostas]) => ({
      casa,
      apostas,
      percentual: Math.round((apostas / maxBookie) * 100),
    }))
    .sort((a, b) => b.apostas - a.apostas)
    .slice(0, 8);

  return {
    totalBets,
    greens,
    reds,
    pendings,
    voids,
    totalLucro: parseFloat(totalLucro.toFixed(2)),
    totalUnidades: reaisParaUnidades(totalLucro),
    totalApostado: parseFloat(totalApostado.toFixed(2)),
    taxaAcerto: taxaDeAcerto(greens, reds),
    roi: calcularRoi(bets),
    maiorGreen: parseFloat(maiorGreen.toFixed(2)),
    maiorRed: parseFloat(maiorRed.toFixed(2)),
    // Odds reais — antes eram três literais escritos no JSX da página de estatísticas
    somaOdds: parseFloat(bets.reduce((acc, b) => acc + b.odd, 0).toFixed(2)),
    oddMediaGeral: mediaDeOdd(bets),
    oddMediaGreen: mediaDeOdd(greenBets),
    oddMediaRed: mediaDeOdd(redBets),
    tipsters,
    sports,
    bookies,
  };
}

export type BetStats = ReturnType<typeof computeStatsFromBets>;
