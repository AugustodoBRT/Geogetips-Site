import { inicioDeHoje, parseDateTimestamp } from "./date";
import type { BetItem } from "./types";

/**
 * Desde quando o histórico existe (#70).
 *
 * "7.500 apostas" pode ser um ano ou cinco meses; sem a data, quem visita não
 * sabe o tamanho real do histórico. Tudo sai das próprias apostas, nunca de
 * texto fixo: o dia em que a planilha ganhar um mês mais antigo, a frase muda
 * sozinha.
 */

const MESES = [
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

export interface PeriodoDoHistorico {
  /** Primeiro dia com aposta, "DD/MM/YYYY". */
  primeiroDia: string;
  /** "abril de 2026" */
  desde: string;
  /** Dias distintos com aposta, até hoje. */
  diasComAposta: number;
}

/**
 * O primeiro dia com aposta e quantos dias tiveram aposta.
 *
 * Só dias já vividos: aposta de longo prazo, com a data do evento lá na
 * frente, não é dia de histórico. `null` sem nenhuma aposta com data.
 */
export function periodoDoHistorico(
  bets: readonly BetItem[],
  ref: Date = new Date()
): PeriodoDoHistorico | null {
  const hoje = inicioDeHoje(ref);
  const dias = new Map<string, number>();
  for (const b of bets) {
    const ts = parseDateTimestamp(b.data);
    if (ts === 0 || ts > hoje) continue;
    dias.set(b.data, ts);
  }
  if (dias.size === 0) return null;

  let primeiroDia = "";
  let menor = Number.POSITIVE_INFINITY;
  for (const [data, ts] of dias) {
    if (ts < menor) {
      menor = ts;
      primeiroDia = data;
    }
  }
  const [, mes, ano] = primeiroDia.split("/").map(Number);
  return {
    primeiroDia,
    desde: `${MESES[mes - 1]} de ${ano}`,
    diasComAposta: dias.size,
  };
}
