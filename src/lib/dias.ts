import { inicioDeHoje, parseDateTimestamp } from "./date";
import type { BetItem } from "./types";

/** Um dia do feed: as apostas dele e o resultado somado. */
export interface Dia {
  data: string;
  apostas: BetItem[];
  lucro: number;
}

/**
 * Agrupa o feed em dias, quase sem reordenar.
 *
 * Cada dia fica onde aparece a primeira aposta dele, e a ordem das apostas já
 * vem do servidor (`ordenarApostas`): as mais recentes primeiro e as de longo
 * prazo — pendentes com data futura — no fim. Ordenar os dias por data de novo
 * punha a aposta do dia 30 no topo do feed do dia 18, que é exatamente o que
 * aquela regra existe para evitar.
 *
 * **Dia que ainda não chegou vai para o fim**, em ordem de quem resolve antes.
 * Sem esta parte, bastava uma aposta já resolvida num dia futuro para puxar o
 * dia inteiro ao topo: o servidor manda as 32 pendentes de amanhã para o fim,
 * mas uma delas estava VOID, voltava à posição da data dela — a mais recente de
 * todas — e as outras 32 subiam junto, porque o dia é posicionado pela primeira
 * aposta. O feed abria em "amanhã".
 *
 * Recebe as apostas **já filtradas**: a contagem e o resultado de cada dia são
 * os do recorte na tela, e não os da aba inteira.
 */
export function agruparPorDia(
  apostas: readonly BetItem[],
  ref: Date = new Date()
): Dia[] {
  const porData = new Map<string, BetItem[]>();
  for (const aposta of apostas) {
    const lista = porData.get(aposta.data);
    if (lista) lista.push(aposta);
    else porData.set(aposta.data, [aposta]);
  }

  const hoje = inicioDeHoje(ref);
  const passado: Dia[] = [];
  const futuro: { dia: Dia; ts: number }[] = [];

  for (const [data, doDia] of porData) {
    const dia: Dia = {
      data,
      apostas: doDia,
      lucro: doDia.reduce((acc, a) => acc + a.lucro, 0),
    };
    const ts = parseDateTimestamp(data);
    // ts 0 é data que não deu para ler: fica onde está, e não no fim.
    if (ts > hoje) futuro.push({ dia, ts });
    else passado.push(dia);
  }

  futuro.sort((a, b) => a.ts - b.ts);
  return [...passado, ...futuro.map((f) => f.dia)];
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
