import { ordemDaAba } from "./constants";
import { inicioDeHoje, paraISO, parseDateTimestamp } from "./date";
import type { BetItem } from "./types";

/**
 * O calendário de lucro por dia do Painel (#67).
 *
 * Só contas e datas, sem React: a grade do mês, o resultado de cada dia e o
 * texto curto que cabe numa célula de 45 px no celular.
 */

export interface Mes {
  ano: number;
  /** De 1 a 12. */
  mes: number;
}

export interface DiaDoCalendario {
  dia: number;
  /** "DD/MM/YYYY", como a planilha escreve. */
  data: string;
  /** "YYYY-MM-DD", como o endereço do feed de Apostas recebe. */
  iso: string;
  lucro: number;
  apostas: number;
  futuro: boolean;
  hoje: boolean;
}

export interface MesDoCalendario extends Mes {
  /** Semanas de domingo a sábado; `null` é casa de outro mês. */
  semanas: (DiaDoCalendario | null)[][];
  lucro: number;
  apostas: number;
  diasComAposta: number;
}

const NOMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** { ano: 2026, mes: 9 } → "setembro de 2026" */
export function nomeDoMes({ ano, mes }: Mes): string {
  return `${NOMES[mes - 1]} de ${ano}`;
}

/** "Setembro26" → { ano: 2026, mes: 9 }; `null` para o agregado e para nome fora do padrão. */
export function mesDaAba(aba: string): Mes | null {
  const ordem = ordemDaAba(aba);
  return ordem > 0 ? { ano: Math.floor(ordem / 100), mes: ordem % 100 } : null;
}

/**
 * Os meses que têm aposta em dia já vivido, do mais antigo ao mais novo.
 *
 * Dia futuro não conta: é aposta de longo prazo, pendente, e abriria um mês
 * vazio lá na frente — campeão do campeonato em dezembro.
 */
export function mesesComAposta(bets: readonly BetItem[], ref: Date = new Date()): Mes[] {
  const hoje = inicioDeHoje(ref);
  const chaves = new Set<number>();
  for (const b of bets) {
    const ts = parseDateTimestamp(b.data);
    if (ts === 0 || ts > hoje) continue;
    const [, m, a] = b.data.split("/").map(Number);
    chaves.add(a * 100 + m);
  }
  return Array.from(chaves)
    .sort((x, y) => x - y)
    .map((c) => ({ ano: Math.floor(c / 100), mes: c % 100 }));
}

/** Os dois meses são o mesmo? */
export function mesmoMes(a: Mes | null, b: Mes | null): boolean {
  return Boolean(a && b && a.ano === b.ano && a.mes === b.mes);
}

/**
 * A grade de um mês, de domingo a sábado, com o resultado de cada dia.
 *
 * Cada dia soma as apostas com aquela data. O total do mês é a soma dos dias,
 * então fecha com a curva do Painel no mesmo período.
 */
export function montarMes(
  bets: readonly BetItem[],
  { ano, mes }: Mes,
  ref: Date = new Date()
): MesDoCalendario {
  const hoje = inicioDeHoje(ref);
  const porDia = new Map<number, { lucro: number; apostas: number }>();
  for (const b of bets) {
    const [d, m, a] = b.data.split("/").map(Number);
    if (a !== ano || m !== mes || !d) continue;
    const dia = porDia.get(d) ?? { lucro: 0, apostas: 0 };
    dia.lucro += b.lucro;
    dia.apostas += 1;
    porDia.set(d, dia);
  }

  const primeiroDiaDaSemana = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const casas: (DiaDoCalendario | null)[] = Array(primeiroDiaDaSemana).fill(null);

  let lucro = 0;
  let apostas = 0;
  let diasComAposta = 0;
  for (let d = 1; d <= diasNoMes; d++) {
    const data = `${String(d).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
    const ts = new Date(ano, mes - 1, d).getTime();
    const somado = porDia.get(d) ?? { lucro: 0, apostas: 0 };
    const futuro = ts > hoje;
    casas.push({
      dia: d,
      data,
      iso: paraISO(data),
      lucro: Math.round(somado.lucro * 100) / 100,
      apostas: somado.apostas,
      futuro,
      hoje: ts === hoje,
    });
    if (!futuro && somado.apostas > 0) {
      lucro += somado.lucro;
      apostas += somado.apostas;
      diasComAposta += 1;
    }
  }
  while (casas.length % 7 !== 0) casas.push(null);

  const semanas: (DiaDoCalendario | null)[][] = [];
  for (let i = 0; i < casas.length; i += 7) semanas.push(casas.slice(i, i + 7));

  return {
    ano,
    mes,
    semanas,
    lucro: Math.round(lucro * 100) / 100,
    apostas,
    diasComAposta,
  };
}

/**
 * O valor de um dia no espaço de uma célula: "+459", "-2,3k", "+12k".
 *
 * Arredonda para inteiro abaixo de mil e para uma casa em milhar, sem ",0"
 * sobrando. O valor exato vai no nome acessível da célula.
 */
export function compacto(valor: number): string {
  const sinal = valor > 0 ? "+" : valor < 0 ? "-" : "";
  const abs = Math.abs(valor);
  if (Math.round(abs) < 1000) return `${sinal}${Math.round(abs)}`;
  const mil = (Math.round(abs / 100) / 10).toString().replace(".", ",");
  return `${sinal}${mil}k`;
}
