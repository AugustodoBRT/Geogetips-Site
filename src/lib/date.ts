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
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

  return new Date(year, month, day).getTime();
}

/** Ordena datas "DD/MM/YYYY" da mais recente para a mais antiga. */
export function ordenarPorDataDesc(a: string, b: string): number {
  return parseDateTimestamp(b) - parseDateTimestamp(a);
}

/** "27/08/2026" -> "27/08" */
export function diaEMes(dateStr: string): string {
  const parts = dateStr.split("/");
  return parts.length === 3 ? `${parts[0]}/${parts[1]}` : dateStr;
}
