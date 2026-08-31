/**
 * Valor em reais de 1 unidade (1u) na planilha do grupo.
 * Toda conversão de R$ para unidades passa por aqui.
 */
export const VALOR_UNIDADE = 100.0;

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Nome da aba do mês corrente, no padrão da planilha: "Agosto26". */
export function abaDoMesAtual(ref: Date = new Date()): string {
  return `${MESES[ref.getMonth()]}${String(ref.getFullYear()).slice(-2)}`;
}

/** Últimos N meses em ordem decrescente — fallback quando o Sheets não responde. */
export function abasRecentes(quantidade = 5, ref: Date = new Date()): string[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    return abaDoMesAtual(d);
  });
}

/**
 * Canal gratuito no Telegram — hoje é o único caminho de entrada no grupo.
 * Quando existir VIP, isto vira uma lista de destinos.
 */
export const TELEGRAM_URL = "https://t.me/vemproGeogeTips";

/** Perfil no X. */
export const X_URL = "https://x.com/GeogeTips";

/**
 * Planilha pública de resultados, em modo somente-leitura.
 * É a prova de que o painel não maquia número: dá para conferir linha a linha.
 */
export const PLANILHA_URL =
  "https://docs.google.com/spreadsheets/d/1wIUWUDb4EjV2BfXZgIpYqOwxtjUEpkS46glw0nwdFEc/edit?usp=sharing";

/** Valor especial que agrega todas as abas. */
export const ABA_TODOS = "TODOS";

/**
 * Converte "Agosto26" em um número ordenável (202608).
 * Devolve 0 para abas que não seguem o padrão mês+ano, que assim
 * caem para o fim da ordenação em vez de quebrá-la.
 */
export function ordemDaAba(nome: string): number {
  const m = nome.trim().match(/^([A-Za-zÀ-ÿ]+)(\d{2})$/);
  if (!m) return 0;
  const idx = MESES.findIndex(
    (mes) => mes.toLowerCase() === m[1].toLowerCase()
  );
  if (idx < 0) return 0;
  return (2000 + parseInt(m[2], 10)) * 100 + idx + 1;
}

/** "Agosto26" -> "ago/26" */
export function abaCurta(nome: string): string {
  const m = nome.trim().match(/^([A-Za-zÀ-ÿ]+)(\d{2})$/);
  if (!m) return nome;
  return `${m[1].slice(0, 3).toLowerCase()}/${m[2]}`;
}

export function reaisParaUnidades(valor: number): number {
  return parseFloat((valor / VALOR_UNIDADE).toFixed(2));
}
