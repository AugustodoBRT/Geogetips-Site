/** Normaliza para comparar sem acento, caixa ou espaço extra. */
export function normalizarTexto(valor: string): string {
  return Array.from(valor.toLowerCase().normalize("NFD"))
    // descarta marcas de acentuação combinantes (U+0300 a U+036F)
    .filter((c) => {
      const cp = c.codePointAt(0) ?? 0;
      return cp < 0x0300 || cp > 0x036f;
    })
    .join("")
    .trim();
}
