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
  /** Odd média das apostas já resolvidas do adm. */
  oddMedia: number;
  /**
   * Taxa de acerto que zera o resultado, em %: 100 / oddMedia.
   *
   * Sem ela não dá para julgar um acerto de 31%. Com odd média 5, o empate
   * fica em 20% e 31% é excelente; com odd média 1,5, o empate é 67% e 31%
   * seria desastroso. É o número que dá sentido a todos os outros.
   */
  acertoDeEquilibrio: number;
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
