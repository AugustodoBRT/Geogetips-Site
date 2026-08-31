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
