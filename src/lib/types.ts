/**
 * VOID = aposta anulada pela casa (jogo cancelado, mercado invalidado).
 * Stake devolvida, lucro zero. Não conta como acerto nem como erro —
 * fica fora do denominador da taxa de acerto e do ROI.
 */
export type BetResult = "GREEN" | "RED" | "PENDENTE" | "VOID";

export interface BetItem {
  id: string;
  data: string; // DD/MM/YYYY
  esporte: "Futebol" | "NBA" | "Tênis" | string;
  tipster: string;
  partida: string;
  tip: string;
  casa: string;
  odd: number;
  valor: number;
  unidades: number;
  resultado: BetResult;
  lucro: number;
}

export interface TipsterStat {
  nome: string;
  esportes: string[];
  avatarColor: string;
  initial: string;
  taxaAcerto: number;
  totalApostas: number;
  lucroUnidades: number;
  roi: number;
}

export interface SportBreakdown {
  esporte: string;
  icone: "soccer" | "basketball" | "tennis";
  apostas: number;
  taxaAcerto: number;
  lucro: number;
  roi: number;
}

export interface BookieBreakdown {
  casa: string;
  apostas: number;
  percentual: number;
}
