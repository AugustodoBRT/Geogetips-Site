import type { BetItem } from "./types";

/** Um dia do feed: as apostas dele e o resultado somado. */
export interface Dia {
  data: string;
  apostas: BetItem[];
  lucro: number;
}

/**
 * Agrupa o feed em dias, sem reordenar.
 *
 * Cada dia fica onde aparece a primeira aposta dele, e a ordem das apostas já
 * vem do servidor (`ordenarApostas`): as mais recentes primeiro e as de longo
 * prazo — pendentes com data futura — no fim. Ordenar os dias por data de novo
 * punha a aposta do dia 30 no topo do feed do dia 18, que é exatamente o que
 * aquela regra existe para evitar.
 *
 * Recebe as apostas **já filtradas**: a contagem e o resultado de cada dia são
 * os do recorte na tela, e não os da aba inteira.
 */
export function agruparPorDia(apostas: readonly BetItem[]): Dia[] {
  const porData = new Map<string, BetItem[]>();
  for (const aposta of apostas) {
    const lista = porData.get(aposta.data);
    if (lista) lista.push(aposta);
    else porData.set(aposta.data, [aposta]);
  }
  return Array.from(porData, ([data, doDia]) => ({
    data,
    apostas: doDia,
    lucro: doDia.reduce((acc, a) => acc + a.lucro, 0),
  }));
}

/**
 * Os dias que abrem de saída: os primeiros, até somar `limite` apostas.
 *
 * O primeiro abre sempre, mesmo que sozinho passe do limite — um feed que abre
 * inteiro recolhido não mostra nada. Um dia só entra se a soma **anterior** a
 * ele ainda não chegou ao limite, então o total aberto passa do limite no
 * máximo pelo tamanho de um dia, e nunca corta um dia ao meio.
 */
export function diasAbertosDeSaida(dias: readonly Dia[], limite: number): Set<string> {
  const abertos = new Set<string>();
  let soma = 0;
  for (const dia of dias) {
    if (abertos.size > 0 && soma >= limite) break;
    abertos.add(dia.data);
    soma += dia.apostas.length;
  }
  return abertos;
}
