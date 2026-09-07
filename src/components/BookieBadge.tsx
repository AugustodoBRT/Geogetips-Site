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
   * Arquivo em /public/casas com a logo da casa, de preferência a negativa.
   *
   * SVG de preferência: medido nas duas primeiras, sai 82% e 37% menor que o
   * PNG depois de arredondar as coordenadas para uma casa decimal, e fica
   * nítido em qualquer densidade de tela. Todo arquivo precisa de viewBox —
   * sem ele o Chrome ainda escala, mas Safari e Firefox recortam a arte.
   *
   * A logo vai direto na pílula colorida, sem círculo branco atrás. Quando a
   * casa publica a negativa, o fundo é a cor da marca: a da Betano sobre
   * branco dá 1,08 de contraste — some; sobre o laranja da própria marca dá
   * 3,29. Quando só existe a colorida, o `bg` é uma versão escurecida do
   * mesmo matiz, medida até a cor dominante da logo passar de 4,5:1 — os
   * comentários de cada casa registram o número. Duas fogem disso: a Betfair,
   * cuja logo é preta e usa o amarelo oficial da marca, e a Bravo, que mistura
   * preto e vermelho e só fecha no branco.
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
  {
    nome: "Bet MGM",
    // O dourado #B19661 do registro era quase o mesmo tom do leão e das letras
    // da marca: 63% da logo sumia, a 1,0 de contraste. Este marrom escuro
    // devolve 4,2.
    bg: "#191409",
    fg: "#FFFFFF",
    alias: ["BetMGM"],
    logo: "bet-mgm.svg",
    logoRatio: 99.8 / 48.3,
  },
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
  {
    nome: "BETesporte",
    bg: "#1D2F72",
    fg: "#FFFFFF",
    alias: ["Betesporte"],
    logo: "betesporte.svg",
    logoRatio: 764.5 / 155.2,
  },
  {
    nome: "Betfair",
    // A logo da Betfair é preta, não negativa. Sobre o dourado antigo dava 2,5 e
    // saía embaçada; sobre o amarelo oficial da casa dá 10,9 — e é o par de
    // cores que a própria Betfair usa.
    bg: "#FFB80C",
    fg: "#16131F",
    logo: "betfair.svg",
    logoRatio: 709.7 / 123.2,
  },
  {
    nome: "Betfast",
    // A logo é vermelha e o fundo era o mesmo vermelho: 1,0 de contraste, a
    // pílula ficava vazia. O vermelho da marca não passa de 4,2 sobre nenhum
    // fundo escuro — este quase-preto chega a 4,0, o teto prático.
    bg: "#120305",
    fg: "#FFFFFF",
    logo: "betfast.svg",
    logoRatio: 201.6 / 38.4,
  },
  {
    nome: "Betnacional",
    // Sobre o amarelo #FCC135 nem o branco da marca se salvava: 1,6. Este
    // marrom escuro dá 5,6.
    bg: "#372701",
    fg: "#FFFFFF",
    logo: "betnacional.svg",
    logoRatio: 153.5 / 29.2,
  },
  {
    nome: "Betou",
    bg: "#062B45",
    fg: "#FFFFFF",
    logo: "betou.svg",
    logoRatio: 196.8 / 32,
  },
  {
    nome: "Betpix",
    // Amarelo sobre amarelo: 100% da logo sumia. Escurecido, 4,5.
    bg: "#675713",
    fg: "#FFFFFF",
    logo: "betpix.svg",
    logoRatio: 200.8 / 38.4,
  },
  {
    nome: "BetPonto",
    bg: "#2A1545",
    fg: "#FFFFFF",
    logo: "betponto.svg",
    logoRatio: 114.2 / 34,
  },
  {
    nome: "Betsson",
    // Laranja sobre o mesmo laranja: 1,0. Este marrom queimado dá 4,7.
    bg: "#492208",
    fg: "#FFFFFF",
    logo: "betsson.svg",
    logoRatio: 126.5 / 24.3,
  },
  {
    nome: "Betsul",
    bg: "#7329C9",
    fg: "#FFFFFF",
    logo: "betsul.svg",
    logoRatio: 74.8 / 23.8,
  },
  {
    nome: "Betvip",
    bg: "#035E01",
    fg: "#FFFFFF",
    logo: "betvip.svg",
    logoRatio: 98.3 / 36.2,
  },
  {
    nome: "Bingo Plus",
    bg: "#21093D",
    fg: "#FFFFFF",
    logo: "bingo-plus.svg",
    logoRatio: 173.5 / 34.5,
  },
  {
    nome: "Bolsa de Aposta",
    // O verde da marca encostava no verde do fundo e comia 37% da logo.
    // Escurecido, 4,5.
    bg: "#183522",
    fg: "#FFFFFF",
    alias: ["Bolsa de Apostas"],
    logo: "bolsa-de-aposta.svg",
    logoRatio: 124.8 / 42.7,
  },
  {
    nome: "Br4",
    bg: "#0D162D",
    fg: "#FFFFFF",
    logo: "br4.svg",
    logoRatio: 218 / 37.7,
  },
  {
    nome: "Brasil Bet",
    // Amarelo sobre amarelo: some inteira. Este ocre escuro dá 4,6.
    bg: "#6E620C",
    fg: "#FFFFFF",
    logo: "brasil-bet.svg",
    logoRatio: 176.5 / 45.7,
  },
  {
    nome: "Brasil da Sorte",
    // Metade da logo é o mesmo verde do fundo. Escurecido, 4,5.
    bg: "#094327",
    fg: "#FFFFFF",
    logo: "brasil-da-sorte.svg",
    logoRatio: 116.3 / 37.7,
  },
  {
    nome: "Bravo",
    // Única clara do lote: a marca é "BRAVO." em preto com "BET" em vermelho.
    // Em fundo escuro some o preto, em fundo vermelho some o BET — no branco
    // os dois passam (21,0 e 4,3).
    bg: "#FFFFFF",
    fg: "#16131F",
    logo: "bravo.svg",
    logoRatio: 357.4 / 32.2,
  },
  {
    nome: "BrBet",
    // Verde sobre verde comia 41% da logo. Escurecido, 4,6.
    bg: "#06320E",
    fg: "#FFFFFF",
    logo: "brbet.svg",
    logoRatio: 130.2 / 46.7,
  },
  {
    nome: "Brx",
    // Verde sobre verde comia 42%. Escurecido, 4,5.
    bg: "#14432E",
    fg: "#FFFFFF",
    logo: "brx.svg",
    logoRatio: 65.7 / 50.7,
  },
  {
    nome: "Buffalos",
    bg: "#2A2540",
    fg: "#FFFFFF",
    logo: "buffalos.svg",
    logoRatio: 243.7 / 37.1,
  },
  {
    nome: "Bulls",
    // Verde neon sobre verde neon: 1,0. Escurecido, 4,7.
    bg: "#0D6E3B",
    fg: "#FFFFFF",
    logo: "bulls.svg",
    logoRatio: 172.5 / 40.7,
  },
  {
    nome: "Casa de Apostas",
    // O vermelho da marca sumia no vermelho do fundo. Escurecido, 4,5.
    bg: "#2F0406",
    fg: "#FFFFFF",
    alias: ["Casa de Aposta"],
    logo: "casa-de-apostas.svg",
    logoRatio: 109.3 / 38.2,
  },
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
 * As proporções vão de quadrada (Aposta1, 1:1) a 11:1 (Aposta Ganha e Bravo).
 * Só respeitando a altura, as pílulas iam de 15px a 167px — variação de 11x,
 * que deixava o alinhamento do feed visivelmente irregular.
 *
 * A faixa aperta isso para 1,45x. Logo estreita ganha folga em vez de virar um
 * selo minúsculo; logo comprida encolhe em altura, mantendo a proporção.
 * Largura fixa daria uniformidade perfeita, mas deixava as estreitas perdidas
 * num vazio grande demais.
 *
 * As proporções no registro são do CONTEÚDO, não do arquivo: os viewBox foram
 * recortados até a arte. A maioria dos arquivos vem com margem — a Betboo
 * chegava a 62% e a Bravo a 70% — o que encolhia a logo e falseava a proporção
 * usada nesta conta. O preço de uma logo muito comprida é a altura: a Bravo,
 * a 11:1, fica com 6px contra os 15px de quem é mais quadrada.
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
