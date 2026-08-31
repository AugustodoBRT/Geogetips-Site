import React from "react";
import { normalizarTexto } from "@/lib/texto";

interface BookieBadgeProps {
  bookie?: string;
  className?: string;
}

interface Casa {
  /** Rótulo exibido, na grafia oficial da casa. */
  nome: string;
  bg: string;
  fg: string;
  /** Grafias alternativas que aparecem na planilha. */
  alias?: string[];
  /** Marca desenhada à parte, quando o monograma não faz jus. */
  marca?: React.ReactNode;
}

/**
 * Registro das casas usadas pelo grupo.
 *
 * As marcadas com "cor da marca" usam a cor real da casa; as demais recebem
 * uma cor da paleta do site, escolhida para dar contraste entre vizinhas no
 * feed. Trocar qualquer uma é editar um hex aqui.
 *
 * A busca é por nome EXATO normalizado, não por substring: com quase cem
 * casas, "Ona" casaria dentro de "Betnacional" e "Loto" dentro de "Lottoland".
 *
 * O `fg` de cada casa foi escolhido pela luminância do fundo, para o texto de
 * 10,5px passar em 4,5:1 de contraste. Ao trocar um `bg`, confira o `fg`
 * junto — laranja e verde claro precisam de texto escuro, não branco.
 * A Bet365 é a única exceção: fica na combinação oficial da marca.
 */
const CASAS: Casa[] = [
  { nome: "4play", bg: "#FF2442", fg: "#1A1715" },
  { nome: "4win", bg: "#DA5E15", fg: "#1A1715" },
  { nome: "7Games", bg: "#DCF7D9", fg: "#1A1715" }, // cor da marca
  { nome: "7K Bet", bg: "#A1CD3D", fg: "#1A1715", alias: ["7K"] },
  { nome: "Aposta Ganha", bg: "#FF3D00", fg: "#1A1715" }, // cor da marca
  { nome: "Aposta Tudo", bg: "#280AA3", fg: "#FFFFFF" },
  { nome: "Aposta1", bg: "#4EB548", fg: "#1A1715" },
  { nome: "Apostou", bg: "#172448", fg: "#FFFFFF" },
  { nome: "B2X", bg: "#5B21B6", fg: "#FFFFFF" },
  { nome: "Band", bg: "#005498", fg: "#FFFFFF" },
  { nome: "Bateu", bg: "#570433", fg: "#FFFFFF" },
  { nome: "Bet MGM", bg: "#B19661", fg: "#1A1715", alias: ["BetMGM"] }, // cor da marca
  { nome: "Bet365", bg: "#007B40", fg: "#FFDF1B" }, // cor da marca
  { nome: "Betaki", bg: "#A3E635", fg: "#1A1715" }, // verde limão, escolha do grupo
  { nome: "Betano", bg: "#FF3C00", fg: "#1A1715" }, // cor da marca
  { nome: "Betao", bg: "#0F2425", fg: "#FFFFFF", alias: ["Betão"] },
  { nome: "Betboo", bg: "#CA3B1B", fg: "#FFFFFF" }, // cor da marca
  { nome: "BetBoom", bg: "#B91C1C", fg: "#FFFFFF" },
  { nome: "BetBra", bg: "#0AA614", fg: "#1A1715" },
  { nome: "BETesporte", bg: "#1D2F72", fg: "#FFFFFF", alias: ["Betesporte"] },
  { nome: "Betfair", bg: "#665327", fg: "#FFFFFF" }, // cor da marca
  { nome: "Betfast", bg: "#D61F26", fg: "#FFFFFF" }, // cor da marca
  { nome: "Betnacional", bg: "#FCC135", fg: "#1A1715" }, // cor da marca
  { nome: "Betou", bg: "#062B45", fg: "#FFFFFF" },
  { nome: "Betpix", bg: "#EDC317", fg: "#1A1715" }, // cor da marca
  { nome: "BetPonto", bg: "#2A1545", fg: "#FFFFFF" },
  { nome: "Betsson", bg: "#FE6600", fg: "#1A1715" }, // cor da marca
  { nome: "Betsul", bg: "#7329C9", fg: "#FFFFFF" },
  { nome: "Betvip", bg: "#035E01", fg: "#FFFFFF" },
  { nome: "Bingo Plus", bg: "#21093D", fg: "#FFFFFF" },
  { nome: "Bolsa de Aposta", bg: "#3EAD64", fg: "#1A1715", alias: ["Bolsa de Apostas"] },
  { nome: "Br4", bg: "#0D162D", fg: "#FFFFFF" },
  { nome: "Brasil Bet", bg: "#FCDC00", fg: "#1A1715" },
  { nome: "Brasil da Sorte", bg: "#05B962", fg: "#1A1715" },
  { nome: "Bravo", bg: "#F03F45", fg: "#1A1715" },
  { nome: "BrBet", bg: "#02AD21", fg: "#1A1715" },
  { nome: "Brx", bg: "#22B573", fg: "#1A1715" },
  { nome: "Buffalos", bg: "#2A2540", fg: "#FFFFFF" },
  { nome: "Bulls", bg: "#01FE7B", fg: "#1A1715" },
  { nome: "Casa de Apostas", bg: "#EE3C42", fg: "#1A1715", alias: ["Casa de Aposta"] },
  { nome: "Cassino", bg: "#2773B8", fg: "#FFFFFF" },
  { nome: "CBEsporte", bg: "#41C1EE", fg: "#1A1715" },
  { nome: "Donald", bg: "#059669", fg: "#1A1715" },
  { nome: "Donos", bg: "#FE5400", fg: "#1A1715" },
  { nome: "Esportes da Sorte", bg: "#02003A", fg: "#FFFFFF", alias: ["Esporte da Sorte"] }, // cor da marca
  { nome: "Esportiva", bg: "#FF3901", fg: "#1A1715" },
  { nome: "Estrela", bg: "#C3985A", fg: "#1A1715" }, // cor da marca
  { nome: "EVip", bg: "#312E81", fg: "#FFFFFF" },
  { nome: "F12", bg: "#59DA00", fg: "#1A1715" },
  { nome: "Falcons", bg: "#130138", fg: "#FFFFFF" },
  { nome: "Faz1", bg: "#FDC418", fg: "#1A1715" },
  { nome: "Fla / Ganhei", bg: "#FFD700", fg: "#1A1715", alias: ["Fla/Ganhei", "Fla Ganhei", "Ganhei"] },
  { nome: "Fullt", bg: "#FDB80F", fg: "#1A1715" },
  { nome: "Galera", bg: "#000A17", fg: "#FFFFFF" },
  { nome: "Ginga", bg: "#FEE403", fg: "#1A1715" },
  { nome: "Gol de Bet", bg: "#FBCA03", fg: "#1A1715", alias: ["GoldeBet"] },
  { nome: "Gorillas", bg: "#C8FF00", fg: "#1A1715" },
  { nome: "Hiper", bg: "#DE002F", fg: "#FFFFFF" },
  { nome: "Ice", bg: "#66C6E6", fg: "#1A1715" },
  { nome: "Jogo de Ouro", bg: "#FFC32A", fg: "#1A1715" },
  { nome: "King Panda", bg: "#F5F4EA", fg: "#1A1715" },
  { nome: "KTO", bg: "#DA0000", fg: "#FFFFFF" }, // cor da marca
  { nome: "Lance de Sorte", bg: "#5400B2", fg: "#FFFFFF" },
  { nome: "Lider", bg: "#D01917", fg: "#FFFFFF", alias: ["Líder"] },
  { nome: "Loto", bg: "#00D225", fg: "#1A1715" },
  { nome: "Lottoland", bg: "#4EFF83", fg: "#1A1715" }, // cor da marca
  { nome: "Lottu", bg: "#F2B74B", fg: "#1A1715" }, // cor da marca
  { nome: "Match", bg: "#C51A1B", fg: "#FFFFFF" },
  { nome: "Maxima", bg: "#00FF99", fg: "#1A1715", alias: ["Máxima"] },
  { nome: "MC Games", bg: "#FB212F", fg: "#1A1715" },
  { nome: "Meridian", bg: "#A9090D", fg: "#FFFFFF" },
  { nome: "Milhao", bg: "#001F23", fg: "#FFFFFF", alias: ["Milhão"] },
  { nome: "Multi", bg: "#F7F716", fg: "#1A1715" },
  { nome: "Nossa", bg: "#1C0244", fg: "#FFFFFF" },
  { nome: "Novibet", bg: "#0A1324", fg: "#FFFFFF" }, // cor da marca
  { nome: "Ona", bg: "#FE263D", fg: "#1A1715" }, // cor da marca
  { nome: "Pagol", bg: "#13D299", fg: "#1A1715" },
  { nome: "Pinnacle", bg: "#FE5500", fg: "#1A1715" }, // cor da marca
  { nome: "Pixbet", bg: "#035FAF", fg: "#FFFFFF" }, // cor da marca
  { nome: "R7", bg: "#FD9800", fg: "#1A1715" }, // cor da marca
  { nome: "Rei do Pitaco", bg: "#261168", fg: "#FFFFFF" }, // cor da marca
  { nome: "Seguro", bg: "#DAA00E", fg: "#1A1715" },
  { nome: "Seu Bet", bg: "#01AF4E", fg: "#1A1715", alias: ["SeuBet"] },
  { nome: "Sorte na Bet", bg: "#26380E", fg: "#FFFFFF" },
  { nome: "SportingBet", bg: "#035C8E", fg: "#FFFFFF", alias: ["Sporting Bet", "Sporting"] }, // cor da marca
  { nome: "Stake", bg: "#1A2C38", fg: "#FFFFFF" }, // cor da marca
  { nome: "Superbet", bg: "#350103", fg: "#FFFFFF" }, // cor da marca
  { nome: "Suprema", bg: "#009D1F", fg: "#1A1715" },
  { nome: "Tivo", bg: "#000E1D", fg: "#FFFFFF" },
  { nome: "Ultra", bg: "#FF3D00", fg: "#1A1715" },
  { nome: "Vai de Bet", bg: "#FFC300", fg: "#1A1715", alias: ["VaideBet"] }, // cor da marca
  { nome: "Vbet", bg: "#D80D83", fg: "#FFFFFF" },
  { nome: "Vera", bg: "#00E054", fg: "#1A1715" },
  { nome: "Versus", bg: "#06FFD8", fg: "#1A1715" },
  { nome: "Viva", bg: "#FE7811", fg: "#1A1715" },
  { nome: "Vupi", bg: "#C4A0E8", fg: "#1A1715" }, // lilás, escolha do grupo
  { nome: "Warrior", bg: "#661700", fg: "#FFFFFF" },
  { nome: "ZeroUm", bg: "#CC0036", fg: "#FFFFFF" },
];

/** Marca própria da Bet365, que o monograma não representa bem. */
const MARCA_BET365 = (
  <>
    <span className="text-white font-black text-[9.5px]">bet</span>
    <span className="font-black">365</span>
  </>
);

/**
 * Índice de busca: nome normalizado -> casa. Montado uma vez, na carga do
 * módulo, para a renderização de cada linha do feed ser O(1).
 */
const INDICE = new Map<string, Casa>();
for (const casa of CASAS) {
  INDICE.set(normalizarTexto(casa.nome).replace(/\s+/g, ""), casa);
  for (const a of casa.alias ?? []) {
    INDICE.set(normalizarTexto(a).replace(/\s+/g, ""), casa);
  }
}

/** Iniciais para o monograma: "Rei do Pitaco" -> "RP", "Betano" -> "B". */
function monograma(nome: string): string {
  const palavras = nome
    .split(/[\s/]+/)
    .filter((p) => p && !["de", "da", "do", "na", "e"].includes(p.toLowerCase()));
  if (palavras.length >= 2) {
    return (palavras[0][0] + palavras[1][0]).toUpperCase();
  }
  return nome.slice(0, 1).toUpperCase();
}

export function encontrarCasa(bookie: string): Casa | undefined {
  const chave = normalizarTexto(bookie).replace(/\s+/g, "");
  return INDICE.get(chave);
}

const BASE =
  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight shadow-sm whitespace-nowrap";

export function BookieBadge({ bookie = "", className = "" }: BookieBadgeProps) {
  const nomeCru = bookie.trim();
  if (!nomeCru) return null;

  const casa = encontrarCasa(nomeCru);

  // Casa fora do registro: mantém o nome como veio da planilha, em cinza, para
  // ficar evidente que falta cadastrar em vez de inventar uma cor.
  if (!casa) {
    return (
      <span
        className={`${BASE} bg-[#EFECE6] text-[#1A1715] ${className}`}
        title={`${nomeCru} — casa ainda não cadastrada`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B645A]" />
        <span>{nomeCru}</span>
      </span>
    );
  }

  const ehBet365 = casa.nome === "Bet365";

  return (
    <span
      className={`${BASE} ${className}`}
      style={{ backgroundColor: casa.bg, color: casa.fg }}
      title={casa.nome}
    >
      {ehBet365 ? (
        MARCA_BET365
      ) : (
        <>
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-black shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
          >
            {monograma(casa.nome)}
          </span>
          <span>{casa.nome}</span>
        </>
      )}
    </span>
  );
}
