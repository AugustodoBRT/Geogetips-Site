import { inicioDeHoje, parseDateTimestamp } from "./date";
import type { BetItem } from "./types";

/**
 * Os grupos do GeogeTips: o canal gratuito e o GeogeTips - Sigma, o pago (#72).
 *
 * Cada grupo tem a própria planilha, e os resultados nunca se misturam: o
 * site mostra um de cada vez, com um seletor. O endereço da planilha do Sigma
 * é configuração do servidor (`GOOGLE_SPREADSHEET_ID_SIGMA`, em sheets.ts):
 * enquanto ela não existir, o grupo fica desligado e o site é o de sempre.
 *
 * Este arquivo não lê variável de servidor, de propósito: as telas também o
 * importam.
 */

export type IdGrupo = "gratis" | "sigma";

export interface Grupo {
  id: IdGrupo;
  /** Nome inteiro, para frases: "Resultados do GeogeTips - Sigma". */
  nome: string;
  /** Nome curto, para o seletor. */
  curto: string;
  /**
   * Quantos dias a aposta leva para aparecer no site.
   *
   * É o que protege quem paga: sem atraso, as entradas do grupo pago estariam
   * de graça no site no mesmo dia. Aplicado no servidor, na API — um atraso
   * só visual deixaria as apostas recentes legíveis no JSON.
   */
  atrasoDias: number;
}

export const GRUPO_PADRAO: IdGrupo = "gratis";

export const GRUPOS: readonly Grupo[] = [
  { id: "gratis", nome: "Canal gratuito", curto: "Grátis", atrasoDias: 0 },
  { id: "sigma", nome: "GeogeTips - Sigma", curto: "Sigma", atrasoDias: 3 },
];

/**
 * Onde a lista de espera do Sigma leva: a página dele na prop.ag, que é onde o
 * grupo vai ser vendido. Vazio enquanto a página não existe, e aí o botão não
 * aparece.
 */
export const URL_LISTA_DE_ESPERA = process.env.NEXT_PUBLIC_SIGMA_URL ?? "";

export function ehGrupo(valor: unknown): valor is IdGrupo {
  return GRUPOS.some((g) => g.id === valor);
}

export function grupoDoId(id: IdGrupo): Grupo {
  return GRUPOS.find((g) => g.id === id) ?? GRUPOS[0];
}

/**
 * O último dia que já pode aparecer, para um atraso de `dias`.
 *
 * Com 3 dias, no dia 21 aparecem as apostas até o dia 18. A data é a da
 * planilha, que é a do jogo: aposta de amanhã lançada hoje também espera três
 * dias depois do jogo.
 */
export function ultimoDiaVisivel(dias: number, ref: Date = new Date()): number {
  const hoje = new Date(inicioDeHoje(ref));
  hoje.setDate(hoje.getDate() - dias);
  return hoje.getTime();
}

/**
 * Tira do recorte as apostas que ainda estão dentro do atraso do grupo.
 *
 * Sem atraso, devolve a lista como veio. Com atraso, sai também a aposta de
 * data ilegível: sem saber o dia, não dá para garantir que ela não é de hoje.
 */
export function aplicarAtraso(
  bets: readonly BetItem[],
  dias: number,
  ref: Date = new Date()
): BetItem[] {
  if (dias <= 0) return [...bets];
  const limite = ultimoDiaVisivel(dias, ref);
  return bets.filter((b) => {
    const ts = parseDateTimestamp(b.data);
    return ts > 0 && ts <= limite;
  });
}

/** O grupo no endereço: vazio no padrão, para o link de quem não escolheu nada seguir limpo. */
export function grupoParaEndereco(id: IdGrupo): string {
  return id === GRUPO_PADRAO ? "" : id;
}
