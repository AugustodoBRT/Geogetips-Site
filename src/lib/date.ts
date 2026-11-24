/**
 * Utilidades de data sem dependência de servidor — client components
 * não podem importar de sheets.ts, que puxa fs/googleapis.
 *
 * ## A convenção deste módulo, que é contrato com quem o usa
 *
 * `parseDateTimestamp`, `timestampDoISO` e `inicioDeHoje` devolvem **meia-noite
 * UTC** da data de calendário — nunca um instante do relógio de quem roda. Por
 * isso são comparáveis entre si em qualquer máquina e para qualquer leitor, a
 * diferença entre duas é exatamente a diferença em dias, e nenhum horário de
 * verão as desloca.
 *
 * Em troca, três regras:
 *
 * 1. Quem lê um desses timestamps de volta usa acessor `getUTC*`, nunca
 *    `getDate()` ou `getMonth()` — ou `isoDoTimestamp`, que já faz isso.
 * 2. Quem precisa saber **o que já aconteceu** compara com `inicioDeHoje()`,
 *    nunca com `new Date()` nem com `Date.now()`. O relógio de quem lê não é o
 *    dia do grupo, e esse era o defeito da #124: o painel decidia o que era
 *    futuro pelo fuso do navegador, então o mesmo dado dava números diferentes
 *    para leitores em fusos diferentes.
 * 3. Quem faz conta de dia usa `MS_POR_DIA`.
 *
 * `date.test.ts` roda a invariante com `TZ` deslocado e fica vermelho se
 * alguma das três funções voltar a depender do fuso do processo.
 */

import { SEM_DATA } from "./padroes";

/** Um dia em milissegundos. Exato, porque os timestamps são meia-noite UTC. */
export const MS_POR_DIA = 86_400_000;

/** Converte "DD/MM/YYYY" em timestamp. Devolve 0 para entradas inválidas. */
export function parseDateTimestamp(dateStr: string): number {
  if (!dateStr || dateStr === SEM_DATA) return 0;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return 0;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return 0;

  return Date.UTC(year, month, day);
}

/**
 * "DD/MM/YYYY" -> "YYYY-MM-DD", que é o formato que input[type=date] usa.
 * Devolve "" para entradas inválidas.
 */
export function paraISO(dateStr: string): string {
  if (!dateStr || dateStr === SEM_DATA) return "";
  const [d, m, a] = dateStr.split("/");
  if (!d || !m || !a) return "";
  return `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** "YYYY-MM-DD" -> meia-noite UTC daquele dia. 0 para entradas inválidas. */
export function timestampDoISO(iso: string): number {
  if (!iso) return 0;
  const [a, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!a || !m || !d) return 0;
  return Date.UTC(a, m - 1, d);
}

/**
 * O caminho de volta: meia-noite UTC -> "YYYY-MM-DD". Par de `timestampDoISO`.
 *
 * Existe para ninguém precisar escrever `getUTCFullYear()` na mão — foi
 * exatamente onde o acessor local se escondeu antes.
 */
export function isoDoTimestamp(ts: number): string {
  const d = new Date(ts);
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mes}-${dia}`;
}

/**
 * Meia-noite de hoje, no fuso do grupo.
 *
 * Serve para decidir o que é "futuro" sem perguntar ao relógio de quem roda: a
 * Vercel roda em UTC, e entre 21h e meia-noite de São Paulo ela já virou o dia.
 * Sem isto, uma aposta lançada para amanhã seria tratada como futura durante o
 * dia e como passada à noite, e o feed mudaria de ordem sozinho.
 *
 * O mesmo valia, e pior, para o leitor: com o público fora do Brasil, o relógio
 * do navegador não é o dia do grupo, e o painel somava um dia a mais ou a menos
 * conforme de onde a página fosse aberta.
 *
 * O `Intl` descobre a data de calendário em São Paulo — isso independe do fuso
 * do processo —, e `Date.UTC` a transforma em timestamp sem reintroduzir esse
 * fuso. É o que torna o resultado igual em qualquer máquina.
 */
export function inicioDeHoje(ref: Date = new Date()): number {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);
  const [ano, mes, dia] = partes.split("-").map((n) => Number.parseInt(n, 10));
  return Date.UTC(ano, mes - 1, dia);
}

/**
 * Descreve um intervalo em palavras, para o cabeçalho dizer o que está na tela.
 *
 * Vazio quando não há intervalo — quem chama decide se mostra algo no lugar. Os
 * dois lados são independentes: só `de` é "a partir de", só `até` é "até", e os
 * dois iguais são um dia só.
 */
export function rotuloDoPeriodo(de: string, ate: string): string {
  if (de && ate) return de === ate ? `dia ${doISO(de)}` : `${doISO(de)} a ${doISO(ate)}`;
  if (de) return `a partir de ${doISO(de)}`;
  if (ate) return `até ${doISO(ate)}`;
  return "";
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY", para exibir no padrão do grupo. */
export function doISO(iso: string): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}
