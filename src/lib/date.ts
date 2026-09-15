/**
 * Utilidades de data sem dependência de servidor — client components
 * não podem importar de sheets.ts, que puxa fs/googleapis.
 */

/** Converte "DD/MM/YYYY" em timestamp. Devolve 0 para entradas inválidas. */
export function parseDateTimestamp(dateStr: string): number {
  if (!dateStr || dateStr === "—") return 0;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return 0;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return 0;

  return new Date(year, month, day).getTime();
}

/**
 * "DD/MM/YYYY" -> "YYYY-MM-DD", que é o formato que input[type=date] usa.
 * Devolve "" para entradas inválidas.
 */
export function paraISO(dateStr: string): string {
  if (!dateStr || dateStr === "—") return "";
  const [d, m, a] = dateStr.split("/");
  if (!d || !m || !a) return "";
  return `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** "YYYY-MM-DD" -> timestamp local. 0 para entradas inválidas. */
export function timestampDoISO(iso: string): number {
  if (!iso) return 0;
  const [a, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!a || !m || !d) return 0;
  return new Date(a, m - 1, d).getTime();
}

/**
 * Meia-noite de hoje, no fuso do grupo.
 *
 * Serve para decidir o que é "futuro" sem perguntar ao relógio do servidor: a
 * Vercel roda em UTC, e entre 21h e meia-noite de São Paulo ela já virou o dia.
 * Sem isto, uma aposta lançada para amanhã seria tratada como futura durante o
 * dia e como passada à noite, e o feed mudaria de ordem sozinho.
 *
 * O timestamp sai no fuso do servidor, igual ao de `parseDateTimestamp` — os
 * dois são comparáveis porque ambos representam meia-noite local de uma data.
 */
export function inicioDeHoje(ref: Date = new Date()): number {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);
  const [ano, mes, dia] = partes.split("-").map((n) => Number.parseInt(n, 10));
  return new Date(ano, mes - 1, dia).getTime();
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY", para exibir no padrão do grupo. */
export function doISO(iso: string): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}
