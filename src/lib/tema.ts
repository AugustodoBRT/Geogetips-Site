/**
 * Tema claro ou escuro, escolhido pela pessoa ou herdado do aparelho.
 *
 * A escolha mora no localStorage. Sem escolha, vale o `prefers-color-scheme`
 * do aparelho — e continua valendo se ele trocar com a página aberta. O tema
 * aplicado fica em `data-tema` no <html>, que é o que o CSS lê.
 */

export type Tema = "claro" | "escuro";

export const CHAVE_TEMA = "geogetips-tema";

export function ehTema(valor: unknown): valor is Tema {
  return valor === "claro" || valor === "escuro";
}

/** Escolha guardada, se for uma escolha válida; senão, o que o aparelho pede. */
export function resolverTema(escolha: string | null, aparelhoEscuro: boolean): Tema {
  if (ehTema(escolha)) return escolha;
  return aparelhoEscuro ? "escuro" : "claro";
}

/**
 * Roda no <head>, antes de qualquer pintura, e põe o tema no <html>.
 *
 * Esperar o React hidratar para isso faria a página abrir branca e escurecer
 * um instante depois. É a mesma regra de `resolverTema`, repetida em texto
 * porque roda solta, sem módulo; o teste de unidade executa este texto e
 * confere que as duas concordam. Se o localStorage estiver bloqueado (aba
 * anônima de alguns navegadores), cai no aparelho.
 */
export const SCRIPT_TEMA_INICIAL = `(function(){var d=document.documentElement,e=null;try{e=localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA
)})}catch(_){}d.dataset.tema=e==="claro"||e==="escuro"?e:matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro"})()`;
