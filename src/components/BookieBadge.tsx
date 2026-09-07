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
  /**
   * Arquivo em /public/casas com a logo NEGATIVA (branca) da casa.
   *
   * SVG de preferência: medido nas duas primeiras, sai 82% e 37% menor que o
   * PNG depois de arredondar as coordenadas para uma casa decimal, e fica
   * nítido em qualquer densidade de tela.
   *
   * É a versão que as casas publicam para uso sobre fundo colorido, e é a que
   * funciona aqui: medida sobre branco, a da Betano dá 1,08 de contraste — some.
   * Sobre o laranja da própria marca dá 3,29. Por isso a logo vai direto na
   * pílula colorida, sem círculo branco atrás.
   *
   * Quando existe, substitui monograma E nome: a logo já diz quem é.
   */
  logo?: string;
  /** Proporção largura/altura da logo, para reservar o espaço certo. */
  logoRatio?: number;
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
  {
    nome: "4play",
    // Fundo escurecido de propósito. A logo tem um triângulo no mesmo vermelho
    // da marca: sobre o #FF2442 original ele dava 1,03 de contraste e sumia,
    // deixando "4 Play.bet" com um buraco no meio. Sobre este preto avermelhado
    // o triângulo dá 5,27 e o branco 19,18.
    bg: "#1A0A10",
    fg: "#FFFFFF",
    logo: "4play.svg",
    logoRatio: 300 / 120,
  },
  {
    nome: "4win",
    bg: "#3D1A06",
    fg: "#FFFFFF",
    logo: "4win.svg",
    logoRatio: 156 / 62,
  },
  {
    nome: "7Games",
    bg: "#0A2E12",
    fg: "#FFFFFF",
    logo: "7games.svg",
    logoRatio: 500 / 158,
  }, // cor da marca
  {
    nome: "7K Bet",
    bg: "#26330F",
    fg: "#FFFFFF",
    alias: ["7K"],
    logo: "7k.svg",
    logoRatio: 65 / 34,
  },
  {
    nome: "Aposta Ganha",
    bg: "#FFF3EE",
    fg: "#16131F",
    logo: "aposta-ganha.svg",
    logoRatio: 757 / 68,
  }, // cor da marca
  {
    nome: "Aposta Tudo",
    bg: "#280AA3",
    fg: "#FFFFFF",
    logo: "aposta-tudo.svg",
    logoRatio: 263 / 65,
  },
  {
    nome: "Aposta1",
    bg: "#0F2E0D",
    fg: "#FFFFFF",
    logo: "aposta1.svg",
    logoRatio: 120 / 120,
  },
  {
    nome: "Apostou",
    bg: "#172448",
    fg: "#FFFFFF",
    logo: "apostou.svg",
    logoRatio: 291 / 58,
  },
  { nome: "B2X", bg: "#5B21B6", fg: "#FFFFFF" },
  {
    nome: "Band",
    // No azul original 59% da logo sumia: o "BET" é azul e encostava no
    // fundo. Escurecido, 0%.
    bg: "#00111E",
    fg: "#FFFFFF",
    logo: "band.svg",
    logoRatio: 422 / 64,
  },
  {
    nome: "Bateu",
    bg: "#570433",
    fg: "#FFFFFF",
    logo: "bateu.svg",
    logoRatio: 208 / 46,
  },
  { nome: "Bet MGM", bg: "#B19661", fg: "#16131F", alias: ["BetMGM"] }, // cor da marca
  {
    nome: "Bet365",
    bg: "#007B40",
    fg: "#FFDF1B",
    logo: "bet365.svg",
    logoRatio: 800 / 178,
  },
  { nome: "Betaki", bg: "#A3E635", fg: "#16131F" }, // verde limão, escolha do grupo
  {
    nome: "Betano",
    bg: "#FF3C00",
    fg: "#16131F",
    logo: "betano.svg",
    logoRatio: 775 / 169,
  }, // cor da marca
  {
    nome: "Betao",
    bg: "#0F2425",
    fg: "#FFFFFF",
    alias: ["Betão"],
    logo: "betao.svg",
    logoRatio: 145 / 42,
  },
  {
    nome: "Betboo",
    bg: "#CA3B1B",
    fg: "#FFFFFF",
    logo: "betboo.svg",
    logoRatio: 141 / 21,
  },
  {
    nome: "BetBoom",
    bg: "#B91C1C",
    fg: "#FFFFFF",
    logo: "betboom.svg",
    logoRatio: 134 / 23,
  },
  {
    nome: "BetBra",
    bg: "#022104",
    fg: "#16131F",
    logo: "betbra.svg",
    logoRatio: 170 / 43,
  },
  { nome: "BETesporte", bg: "#1D2F72", fg: "#FFFFFF", alias: ["Betesporte"] },
  { nome: "Betfair", bg: "#665327", fg: "#FFFFFF" }, // cor da marca
  { nome: "Betfast", bg: "#D61F26", fg: "#FFFFFF" }, // cor da marca
  { nome: "Betnacional", bg: "#FCC135", fg: "#16131F" }, // cor da marca
  { nome: "Betou", bg: "#062B45", fg: "#FFFFFF" },
  { nome: "Betpix", bg: "#EDC317", fg: "#16131F" }, // cor da marca
  { nome: "BetPonto", bg: "#2A1545", fg: "#FFFFFF" },
  { nome: "Betsson", bg: "#FE6600", fg: "#16131F" }, // cor da marca
  { nome: "Betsul", bg: "#7329C9", fg: "#FFFFFF" },
  { nome: "Betvip", bg: "#035E01", fg: "#FFFFFF" },
  { nome: "Bingo Plus", bg: "#21093D", fg: "#FFFFFF" },
  { nome: "Bolsa de Aposta", bg: "#3EAD64", fg: "#16131F", alias: ["Bolsa de Apostas"] },
  { nome: "Br4", bg: "#0D162D", fg: "#FFFFFF" },
  { nome: "Brasil Bet", bg: "#FCDC00", fg: "#16131F" },
  { nome: "Brasil da Sorte", bg: "#05B962", fg: "#16131F" },
  { nome: "Bravo", bg: "#F03F45", fg: "#16131F" },
  { nome: "BrBet", bg: "#02AD21", fg: "#16131F" },
  { nome: "Brx", bg: "#22B573", fg: "#16131F" },
  { nome: "Buffalos", bg: "#2A2540", fg: "#FFFFFF" },
  { nome: "Bulls", bg: "#01FE7B", fg: "#16131F" },
  { nome: "Casa de Apostas", bg: "#EE3C42", fg: "#16131F", alias: ["Casa de Aposta"] },
  { nome: "Cassino", bg: "#2773B8", fg: "#FFFFFF" },
  { nome: "CBEsporte", bg: "#41C1EE", fg: "#16131F" },
  { nome: "Donald", bg: "#059669", fg: "#16131F" },
  { nome: "Donos", bg: "#FE5400", fg: "#16131F" },
  { nome: "Esportes da Sorte", bg: "#02003A", fg: "#FFFFFF", alias: ["Esporte da Sorte"] }, // cor da marca
  { nome: "Esportiva", bg: "#FF3901", fg: "#16131F" },
  { nome: "Estrela", bg: "#C3985A", fg: "#16131F" }, // cor da marca
  { nome: "EVip", bg: "#312E81", fg: "#FFFFFF" },
  { nome: "F12", bg: "#59DA00", fg: "#16131F" },
  { nome: "Falcons", bg: "#130138", fg: "#FFFFFF" },
  { nome: "Faz1", bg: "#FDC418", fg: "#16131F" },
  { nome: "Fla / Ganhei", bg: "#FFD700", fg: "#16131F", alias: ["Fla/Ganhei", "Fla Ganhei", "Ganhei"] },
  { nome: "Fullt", bg: "#FDB80F", fg: "#16131F" },
  { nome: "Galera", bg: "#000A17", fg: "#FFFFFF" },
  { nome: "Ginga", bg: "#FEE403", fg: "#16131F" },
  { nome: "Gol de Bet", bg: "#FBCA03", fg: "#16131F", alias: ["GoldeBet"] },
  { nome: "Gorillas", bg: "#C8FF00", fg: "#16131F" },
  { nome: "Hiper", bg: "#DE002F", fg: "#FFFFFF" },
  { nome: "Ice", bg: "#66C6E6", fg: "#16131F" },
  { nome: "Jogo de Ouro", bg: "#FFC32A", fg: "#16131F" },
  { nome: "King Panda", bg: "#F5F4EA", fg: "#16131F" },
  { nome: "KTO", bg: "#DA0000", fg: "#FFFFFF" }, // cor da marca
  { nome: "Lance de Sorte", bg: "#5400B2", fg: "#FFFFFF" },
  { nome: "Lider", bg: "#D01917", fg: "#FFFFFF", alias: ["Líder"] },
  { nome: "Loto", bg: "#00D225", fg: "#16131F" },
  { nome: "Lottoland", bg: "#4EFF83", fg: "#16131F" }, // cor da marca
  { nome: "Lottu", bg: "#F2B74B", fg: "#16131F" }, // cor da marca
  { nome: "Match", bg: "#C51A1B", fg: "#FFFFFF" },
  { nome: "Maxima", bg: "#00FF99", fg: "#16131F", alias: ["Máxima"] },
  { nome: "MC Games", bg: "#FB212F", fg: "#16131F" },
  { nome: "Meridian", bg: "#A9090D", fg: "#FFFFFF" },
  { nome: "Milhao", bg: "#001F23", fg: "#FFFFFF", alias: ["Milhão"] },
  { nome: "Multi", bg: "#F7F716", fg: "#16131F" },
  { nome: "Nossa", bg: "#1C0244", fg: "#FFFFFF" },
  { nome: "Novibet", bg: "#0A1324", fg: "#FFFFFF" }, // cor da marca
  { nome: "Ona", bg: "#FE263D", fg: "#16131F" }, // cor da marca
  { nome: "Pagol", bg: "#13D299", fg: "#16131F" },
  { nome: "Pinnacle", bg: "#FE5500", fg: "#16131F" }, // cor da marca
  { nome: "Pixbet", bg: "#035FAF", fg: "#FFFFFF" }, // cor da marca
  { nome: "R7", bg: "#FD9800", fg: "#16131F" }, // cor da marca
  { nome: "Rei do Pitaco", bg: "#261168", fg: "#FFFFFF" }, // cor da marca
  { nome: "Seguro", bg: "#DAA00E", fg: "#16131F" },
  { nome: "Seu Bet", bg: "#01AF4E", fg: "#16131F", alias: ["SeuBet"] },
  { nome: "Sorte na Bet", bg: "#26380E", fg: "#FFFFFF" },
  { nome: "SportingBet", bg: "#035C8E", fg: "#FFFFFF", alias: ["Sporting Bet", "Sporting"] }, // cor da marca
  { nome: "Stake", bg: "#1A2C38", fg: "#FFFFFF" }, // cor da marca
  { nome: "Superbet", bg: "#350103", fg: "#FFFFFF" }, // cor da marca
  { nome: "Suprema", bg: "#009D1F", fg: "#16131F" },
  { nome: "Tivo", bg: "#000E1D", fg: "#FFFFFF" },
  { nome: "Ultra", bg: "#FF3D00", fg: "#16131F" },
  { nome: "Vai de Bet", bg: "#FFC300", fg: "#16131F", alias: ["VaideBet"] }, // cor da marca
  { nome: "Vbet", bg: "#D80D83", fg: "#FFFFFF" },
  { nome: "Vera", bg: "#00E054", fg: "#16131F" },
  { nome: "Versus", bg: "#06FFD8", fg: "#16131F" },
  { nome: "Viva", bg: "#FE7811", fg: "#16131F" },
  { nome: "Vupi", bg: "#C4A0E8", fg: "#16131F" }, // lilás, escolha do grupo
  { nome: "Warrior", bg: "#661700", fg: "#FFFFFF" },
  { nome: "ZeroUm", bg: "#CC0036", fg: "#FFFFFF" },
];

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

/** Altura da logo dentro da pílula, em pixels. */
const ALTURA_LOGO = 15;

/**
 * Faixa de largura da logo.
 *
 * As proporções vão de quadrada (Aposta1, 1:1) a 11:1 (Aposta Ganha). Só
 * respeitando a altura, as pílulas iam de 37px a 84px — variação de 2,3x, que
 * deixava o alinhamento do feed visivelmente irregular.
 *
 * A faixa aperta isso para 1,3x. Logo estreita ganha folga em vez de virar um
 * selo minúsculo; logo comprida encolhe em altura, mantendo a proporção.
 * Largura fixa daria uniformidade perfeita, mas deixava as estreitas perdidas
 * num vazio grande demais.
 *
 * As proporções no registro são do CONTEÚDO, não do arquivo: os viewBox foram
 * recortados até a arte. Nove tinham margem vazia — a Betboo chegava a 62% —
 * o que encolhia a logo e falseava a proporção usada nesta conta.
 */
const LARGURA_MIN_LOGO = 44;
const LARGURA_MAX_LOGO = 64;

/** Caixa da logo, com a largura presa à faixa e a altura seguindo a proporção. */
function dimensoesDaLogo(ratio: number): { width: number; height: number } {
  const natural = ALTURA_LOGO * ratio;
  const width = Math.round(
    Math.min(LARGURA_MAX_LOGO, Math.max(LARGURA_MIN_LOGO, natural))
  );
  // Nunca estica além da altura padrão: fica o menor entre ela e o que a
  // proporção pede para a largura escolhida.
  const height = Math.round(Math.min(ALTURA_LOGO, width / ratio));
  return { width, height };
}

export function BookieBadge({ bookie = "", className = "" }: BookieBadgeProps) {
  const nomeCru = bookie.trim();
  if (!nomeCru) return null;

  const casa = encontrarCasa(nomeCru);

  // Casa fora do registro: mantém o nome como veio da planilha, em cinza, para
  // ficar evidente que falta cadastrar em vez de inventar uma cor.
  if (!casa) {
    return (
      <span
        className={`${BASE} bg-[var(--bg-tinted)] text-[var(--text)] ${className}`}
        title={`${nomeCru} — casa ainda não cadastrada`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-2)]" />
        <span>{nomeCru}</span>
      </span>
    );
  }

  return (
    <span
      className={`${BASE} ${className}`}
      style={{ backgroundColor: casa.bg, color: casa.fg }}
      title={casa.nome}
    >
      {casa.logo ? (
        /* Logo negativa da casa: já traz o nome escrito, então substitui
           monograma e texto. alt vazio porque o title do elemento pai já
           anuncia a casa — repetir daria leitura dupla no leitor de tela. */
        <img
          src={`/casas/${casa.logo}`}
          alt=""
          loading="lazy"
          decoding="async"
          className="block object-contain mx-auto"
          style={dimensoesDaLogo(casa.logoRatio ?? 3)}
        />
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
