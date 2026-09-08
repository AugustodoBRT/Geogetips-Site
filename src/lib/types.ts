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
  taxaAcerto: number;
  totalApostas: number;
  lucroUnidades: number;
  roi: number;
  /** Odd média das apostas já resolvidas do adm. */
  oddMedia: number;
  /**
   * Composição das tips do adm por resultado.
   *
   * É o que explica a taxa de acerto: 0% de acerto em 11 tips soa terrível,
   * mas muda de sentido se 8 delas ainda estão pendentes. Substituiu o antigo
   * "ponto de equilíbrio" (100 / odd média), que só vale quando toda entrada
   * usa a mesma stake e a mesma odd — não é o caso aqui, onde a stake varia
   * por aposta, e o número saía enganoso.
   */
  greens: number;
  reds: number;
  voids: number;
  pendentes: number;
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
