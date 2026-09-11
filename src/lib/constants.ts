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

/** Fuso em que o grupo opera e em que as abas da planilha são nomeadas. */
const FUSO_DO_GRUPO = "America/Sao_Paulo";

/**
 * Mês (0-11) e ano no fuso do grupo.
 *
 * `getMonth()` usa o fuso da máquina. No Vercel ela roda em UTC, então entre
 * 21h e meia-noite do último dia do mês o servidor já achava que era o mês
 * seguinte enquanto o navegador, no Brasil, ainda não — a API pedia a aba
 * errada e a tela hidratava com um mês diferente do que o servidor desenhou.
 */
function mesEAnoDoGrupo(ref: Date): { mes: number; ano: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_DO_GRUPO,
    year: "numeric",
    month: "numeric",
  }).formatToParts(ref);
  return {
    mes: Number(partes.find((p) => p.type === "month")?.value) - 1,
    ano: Number(partes.find((p) => p.type === "year")?.value),
  };
}

/** Nome da aba do mês corrente, no padrão da planilha: "Agosto26". */
export function abaDoMesAtual(ref: Date = new Date()): string {
  const { mes, ano } = mesEAnoDoGrupo(ref);
  return `${MESES[mes]}${String(ano).slice(-2)}`;
}

/** Últimos N meses em ordem decrescente — fallback quando o Sheets não responde. */
export function abasRecentes(quantidade = 5, ref: Date = new Date()): string[] {
  const { mes, ano } = mesEAnoDoGrupo(ref);
  return Array.from({ length: quantidade }, (_, i) => {
    // Só aritmética de mês: dia 1 não cruza fuso nenhum.
    const d = new Date(ano, mes - i, 1);
    return `${MESES[d.getMonth()]}${String(d.getFullYear()).slice(-2)}`;
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

/** URL pública do site — base de canonical, sitemap, robots e og:image. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://geogetips.vercel.app";

/** Aba aceita pela API: o agregado ou um mês no padrão da planilha. */
export function abaValida(nome: string): boolean {
  return nome === ABA_TODOS || ordemDaAba(nome) > 0;
}

/**
 * A aba dentro de uma frase. O agregado não é uma aba: sem isto a tela dizia
 * "atividades da aba TODOS" e "Ranking de Adms (TODOS)".
 */
export function trechoDaAba(nome: string): { prefixo: string; nome: string } {
  return nome === ABA_TODOS
    ? { prefixo: "de", nome: "todos os meses" }
    : { prefixo: "da aba", nome };
}

/** Rótulo curto, para títulos entre parênteses: "Geral" ou "Agosto26". */
export function rotuloDaAba(nome: string): string {
  return nome === ABA_TODOS ? "Geral" : nome;
}
