import { normalizarTexto } from "@/lib/texto";

interface SportBadgeProps {
  sport?: string;
  className?: string;
}

interface RegraEsporte {
  padroes: string[];
  rotulo: string;
  estilo: string;
  ponto: string;
}

/**
 * O texto de cada selo é um tom abaixo da cor do ponto. Seis deles, na cor
 * cheia, ficavam abaixo de 4,5:1 sobre a própria tinta a 11px — o de basquete
 * dava 2,90. Os tons atuais passam de 4,6.
 *
 * No escuro esses tons somem: marrom, vinho e azul-marinho sobre o fundo
 * escuro davam de 1,8 a 2,6:1 só no ponto. Cada esporte tem um tom mais claro
 * da mesma cor para o escuro, que passa de 5,2:1 sobre a própria tinta.
 *
 * Ordem importa: padrão específico antes de genérico.
 * "corrida de cavalos" precisa vir antes de "corrida", que identificava F1.
 */
const REGRAS: RegraEsporte[] = [
  {
    padroes: ["corrida de cavalo", "turfe", "jockey", "galope"],
    rotulo: "Turfe",
    estilo:
      "bg-[#92400E]/10 text-[#92400E] border-[#92400E]/25 dark:bg-[#92400E]/[0.16] dark:text-[#BA8767] dark:border-[#92400E]/40",
    ponto: "bg-[#92400E] dark:bg-[#BA8767]",
  },
  {
    padroes: ["futebol americano", "nfl"],
    rotulo: "NFL",
    estilo:
      "bg-[#7F1D1D]/10 text-[#7F1D1D] border-[#7F1D1D]/25 dark:bg-[#7F1D1D]/[0.16] dark:text-[#B78080] dark:border-[#7F1D1D]/40",
    ponto: "bg-[#7F1D1D] dark:bg-[#B78080]",
  },
  {
    padroes: ["futebol", "soccer", "football"],
    rotulo: "Futebol",
    estilo:
      "bg-[#2D8659]/10 text-[#27734C] border-[#2D8659]/25 dark:bg-[#2D8659]/[0.16] dark:text-[#62A483] dark:border-[#2D8659]/40",
    ponto: "bg-[#2D8659] dark:bg-[#62A483]",
  },
  {
    padroes: ["nba", "basquete", "basket", "ncaa"],
    rotulo: "Basquete",
    estilo:
      "bg-[#EA580C]/10 text-[#B24309] border-[#EA580C]/25 dark:bg-[#EA580C]/[0.16] dark:text-[#EE7638] dark:border-[#EA580C]/40",
    ponto: "bg-[#EA580C] dark:bg-[#EE7638]",
  },
  {
    padroes: ["tenis", "tennis", "atp", "wta"],
    rotulo: "Tênis",
    estilo:
      "bg-[#65A30D]/10 text-[#46710E] border-[#65A30D]/25 dark:bg-[#65A30D]/[0.16] dark:text-[#71AA20] dark:border-[#65A30D]/40",
    ponto: "bg-[#65A30D] dark:bg-[#71AA20]",
  },
  {
    padroes: [
      "esports",
      "e-sports",
      "cs2",
      "csgo",
      "counter",
      "lol",
      "league of legends",
      "valorant",
      "dota",
    ],
    rotulo: "eSports",
    estilo:
      "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/25 dark:bg-[#7C3AED]/[0.16] dark:text-[#A97DF3] dark:border-[#7C3AED]/40",
    ponto: "bg-[#7C3AED] dark:bg-[#A97DF3]",
  },
  {
    padroes: ["mma", "ufc", "boxe", "boxing", "luta"],
    rotulo: "MMA / Luta",
    estilo:
      "bg-[#DC2626]/10 text-[#C42020] border-[#DC2626]/25 dark:bg-[#DC2626]/[0.16] dark:text-[#E86E6E] dark:border-[#DC2626]/40",
    ponto: "bg-[#DC2626] dark:bg-[#E86E6E]",
  },
  {
    padroes: ["volei", "volleyball"],
    rotulo: "Vôlei",
    estilo:
      "bg-[#0284C7]/10 text-[#026BA1] border-[#0284C7]/25 dark:bg-[#0284C7]/[0.16] dark:text-[#3CA0D4] dark:border-[#0284C7]/40",
    ponto: "bg-[#0284C7] dark:bg-[#3CA0D4]",
  },
  {
    padroes: ["hoquei", "hockey", "nhl"],
    rotulo: "NHL",
    estilo:
      "bg-[#0F766E]/10 text-[#0E716A] border-[#0F766E]/25 dark:bg-[#0F766E]/[0.16] dark:text-[#59A09B] dark:border-[#0F766E]/40",
    ponto: "bg-[#0F766E] dark:bg-[#59A09B]",
  },
  {
    padroes: ["beisebol", "baseball", "mlb"],
    rotulo: "MLB",
    estilo:
      "bg-[#1E40AF]/10 text-[#1E40AF] border-[#1E40AF]/25 dark:bg-[#1E40AF]/[0.16] dark:text-[#7A8ED0] dark:border-[#1E40AF]/40",
    ponto: "bg-[#1E40AF] dark:bg-[#7A8ED0]",
  },
  {
    padroes: ["f1", "formula", "nascar", "automobilismo", "corrida"],
    rotulo: "Fórmula 1",
    estilo:
      "bg-[#475569]/10 text-[#334155] border-[#475569]/25 dark:bg-[#475569]/[0.16] dark:text-[#89929F] dark:border-[#475569]/40",
    ponto: "bg-[#334155] dark:bg-[#89929F]",
  },
];

export function SportBadge({ sport = "Futebol", className = "" }: SportBadgeProps) {
  const nome = (sport || "").trim();
  if (!nome) return null;

  const alvo = normalizarTexto(nome);
  const regra = REGRAS.find((r) => r.padroes.some((p) => alvo.includes(p)));

  const rotulo = regra?.rotulo ?? nome;
  const estilo =
    regra?.estilo ?? "bg-[var(--text-2-soft)] text-[var(--text)] border-tinta/10";
  const ponto = regra?.ponto ?? "bg-[var(--text-2)]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border transition-all whitespace-nowrap ${estilo} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ponto}`} />
      <span>{rotulo}</span>
    </span>
  );
}
