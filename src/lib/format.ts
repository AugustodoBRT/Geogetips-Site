/** Formatação pt-BR centralizada — evita o `.toFixed(2).replace(".", ",")` espalhado. */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BRL_SINAL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  signDisplay: "always",
});

/** 9.22 -> "R$ 9,22" */
export function formatarReais(valor: number): string {
  return BRL.format(valor);
}

/** 9.22 -> "+R$ 9,22"  ·  -9.22 -> "-R$ 9,22" */
export function formatarReaisComSinal(valor: number): string {
  return BRL_SINAL.format(valor);
}

/** 1.72 -> "1,72" */
export function formatarOdd(odd: number): string {
  return odd.toFixed(2).replace(".", ",");
}

/** 2.5 -> "+2,50u" */
export function formatarUnidades(unidades: number): string {
  const sinal = unidades >= 0 ? "+" : "";
  return `${sinal}${unidades.toFixed(2).replace(".", ",")}u`;
}

/**
 * Classe de tamanho para o número grande de um card de KPI.
 *
 * O card tem largura fixa e o valor cresce com a banca: "+R$ 461,00" cabe em
 * 4xl, "+R$ 38.898,40" já encosta na borda, e o conversor de unidade permite
 * valores bem maiores. Encolher a fonte conforme o texto cresce evita estouro
 * sem precisar quebrar linha no meio de um valor monetário.
 */
export function tamanhoDoValor(texto: string): string {
  const n = texto.length;
  if (n <= 10) return "text-3xl sm:text-4xl";
  if (n <= 13) return "text-2xl sm:text-3xl";
  if (n <= 16) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}
