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
  {
    nome: "Cassino",
    // O azul da marca era o mesmo do losango da logo: o símbolo sumia e sobrava
    // só "CASSINO". Neste azul-noite o losango dá 3,6 e o branco 17,1.
    bg: "#0A1D2E",
    fg: "#FFFFFF",
    logo: "cassino.svg",
    logoRatio: 213.9 / 37.3,
  },
  {
    nome: "CBEsporte",
    // Logo branca sobre o ciano claro da marca: 2,1 de contraste, ilegível.
    // Escurecido, 4,6.
    bg: "#08475E",
    fg: "#FFFFFF",
    logo: "cb-esportes.svg",
    logoRatio: 192.6 / 38.3,
  },
  {
    nome: "Donald",
    // Verde só um tom mais escuro que o da marca: leva o branco de 3,8 a 4,6.
    bg: "#04855D",
    fg: "#FFFFFF",
    logo: "donald.svg",
    logoRatio: 156.5 / 36.3,
  },
  {
    nome: "Donos",
    // "DonosDa" é laranja e o fundo era o mesmo laranja: 65% da logo sumia.
    // Escurecido, 4,5.
    bg: "#4D1900",
    fg: "#FFFFFF",
    logo: "donos.svg",
    logoRatio: 213.9 / 26.7,
  },
  {
    nome: "Esportes da Sorte",
    bg: "#02003A", // cor da marca
    fg: "#FFFFFF",
    alias: ["Esporte da Sorte"],
    logo: "esportes-da-sorte.svg",
    logoRatio: 188.5 / 65.5,
  },
  {
    nome: "Esportiva",
    // Laranja um tom mais fechado: leva o branco de 3,6 a 4,6.
    bg: "#E03100",
    fg: "#FFFFFF",
    logo: "esportiva.svg",
    logoRatio: 230.9 / 23.5,
  },
  {
    nome: "Estrela",
    // O bege da marca engolia a estrela dourada da logo, a 1,0. Neste marrom
    // escuro ela dá 4,6.
    bg: "#47351A",
    fg: "#FFFFFF",
    logo: "estrela.svg",
    logoRatio: 196.8 / 33,
  },
  {
    nome: "EVip",
    bg: "#312E81",
    fg: "#FFFFFF",
    logo: "e-vip.svg",
    logoRatio: 205 / 30.9,
  },
  {
    nome: "F12",
    // Verde-limão sobre verde-limão: o "12" sumia. Escurecido, 4,8.
    bg: "#235700",
    fg: "#FFFFFF",
    logo: "f12.svg",
    logoRatio: 148.3 / 39,
  },
  {
    nome: "Falcons",
    // Fica no roxo da marca: as letras brancas dão 19,3 e a águia dourada 3,1.
    // O contorno escuro das letras encosta no fundo, mas é detalhe interno —
    // quem desenha a silhueta é o branco.
    bg: "#130138",
    fg: "#FFFFFF",
    logo: "falcons.svg",
    logoRatio: 137.2 / 35,
  },
  {
    nome: "Faz1",
    // Logo branca sobre o amarelo da marca: 1,6. Escurecido, 4,7.
    bg: "#6F5401",
    fg: "#FFFFFF",
    logo: "faz1.svg",
    logoRatio: 171.7 / 42.7,
  },
  {
    nome: "Fla / Ganhei",
    // Amarelo sobre amarelo: a logo sumia inteira. Escurecido, 4,7.
    bg: "#705F00",
    fg: "#FFFFFF",
    alias: ["Fla/Ganhei", "Fla Ganhei", "Ganhei"],
    logo: "ganhei.svg",
    logoRatio: 98.3 / 35.3,
  },
  {
    nome: "Fullt",
    // Fica no amarelo da marca: a logo da Fullt é preta, não negativa, e aqui
    // dá 12,0. Num fundo escuro ela desapareceria.
    bg: "#FDB80F",
    fg: "#16131F",
    logo: "fullt.svg",
    logoRatio: 143 / 19,
  },
  {
    nome: "Galera",
    bg: "#000A17",
    fg: "#FFFFFF",
    logo: "galera.svg",
    logoRatio: 277.1 / 57.1,
  },
  {
    nome: "Ginga",
    // Amarelo sobre amarelo: 1,1. Escurecido, 4,6.
    bg: "#756900",
    fg: "#FFFFFF",
    logo: "ginga.svg",
    logoRatio: 158 / 39.2,
  },
  {
    nome: "Gol de Bet",
    // Logo branca sobre o amarelo da marca: 1,5. Escurecido, 4,6.
    bg: "#8D7202",
    fg: "#FFFFFF",
    alias: ["GoldeBet"],
    logo: "gol-de-bet.svg",
    logoRatio: 154.8 / 27.8,
  },
  {
    nome: "Gorillas",
    // Verde-limão sobre verde-limão: sumia inteira. Escurecido, 4,8.
    bg: "#587000",
    fg: "#FFFFFF",
    logo: "gorillas.svg",
    logoRatio: 124.5 / 17.7,
  },
  {
    nome: "Hiper",
    // O "BET" é vermelho e o fundo era o mesmo vermelho: sobrava só "HIPER".
    // Neste vinho escuro o BET dá 3,5 — o teto para esse vermelho é 4,0 — e o
    // branco 17,9.
    bg: "#38000C",
    fg: "#FFFFFF",
    logo: "hiper.svg",
    logoRatio: 213.8 / 52.9,
  },
  {
    nome: "Ice",
    // Logo branca sobre o azul-claro da marca: 1,9. Escurecido, 4,6.
    bg: "#115369",
    fg: "#FFFFFF",
    logo: "ice.svg",
    logoRatio: 126.3 / 35,
  },
  {
    nome: "Jogo de Ouro",
    // Dourado sobre dourado: sumia inteira. Escurecido, 4,7.
    bg: "#664900",
    fg: "#FFFFFF",
    logo: "jogo-de-ouro.svg",
    logoRatio: 174.2 / 31.2,
  },
  {
    nome: "King Panda",
    // Fica no creme da marca: a logo do King Panda é preta, não negativa, e
    // aqui dá 19,0. Num fundo escuro sumiria.
    bg: "#F5F4EA",
    fg: "#16131F",
    logo: "king-panda.svg",
    logoRatio: 170.7 / 35,
  },
  {
    nome: "KTO",
    // A logo é um vermelho sólido e o fundo era o mesmo vermelho: 1,0 de
    // contraste, a pílula ficava vazia. Esse vermelho não passa de 4,0 sobre
    // fundo escuro nenhum; este quase-preto chega a 3,9.
    bg: "#1A0000",
    fg: "#FFFFFF",
    logo: "kto.svg",
    logoRatio: 143.8 / 37.2,
  },
  {
    nome: "Lance de Sorte",
    bg: "#5400B2",
    fg: "#FFFFFF",
    logo: "lance-de-sorte.svg",
    logoRatio: 94 / 31.3,
  },
  {
    nome: "Lider",
    bg: "#D01917",
    fg: "#FFFFFF",
    alias: ["Líder"],
    logo: "lider.svg",
    logoRatio: 90.3 / 26.5,
  },
  {
    nome: "Loto",
    // Verde sobre o mesmo verde: 1,1. Escurecido, 4,6.
    bg: "#003309",
    fg: "#FFFFFF",
    logo: "loto.svg",
    logoRatio: 222.3 / 42.3,
  },
  {
    nome: "Lottoland",
    // Verde-menta sobre verde-menta: sumia inteira. Escurecido, 4,7.
    bg: "#006B20",
    fg: "#FFFFFF",
    logo: "lottoland.svg",
    logoRatio: 139.7 / 39.2,
  },
  {
    nome: "Lottu",
    // A logo é dourada com contorno preto. No dourado da marca o preenchimento
    // encostava no fundo e sobrava só o contorno — a 15px virava um borrão.
    // Neste marrom escuro o dourado dá 9,2 e as letras ficam sólidas.
    bg: "#1A1206",
    fg: "#FFFFFF",
    logo: "lottu.svg",
    logoRatio: 147.7 / 80.7,
  },
  {
    nome: "Match",
    bg: "#C51A1B",
    fg: "#FFFFFF",
    logo: "match.svg",
    logoRatio: 242.8 / 31.4,
  },
  {
    nome: "Maxima",
    // Verde neon sobre verde neon: 1,0. Escurecido, 4,5.
    bg: "#00613A",
    fg: "#FFFFFF",
    alias: ["Máxima"],
    logo: "maxima.svg",
    logoRatio: 136.8 / 36.2,
  },
  {
    nome: "MC Games",
    // O selo "MC" é vermelho e o fundo era o mesmo vermelho: o símbolo sumia
    // e sobrava só "GAMES.BET.BR". Escurecido, 4,5.
    bg: "#190002",
    fg: "#FFFFFF",
    logo: "mc-games.svg",
    logoRatio: 170.8 / 31.3,
  },
  {
    nome: "Meridian",
    bg: "#A9090D",
    fg: "#FFFFFF",
    logo: "meridian.svg",
    logoRatio: 162.7 / 25.2,
  },
  {
    nome: "Milhao",
    bg: "#001F23",
    fg: "#FFFFFF",
    alias: ["Milhão"],
    logo: "milhao.svg",
    logoRatio: 293.2 / 63.8,
  },
  {
    nome: "Multi",
    // Logo branca sobre o amarelo da marca: 1,1. Escurecido, 4,8.
    bg: "#717104",
    fg: "#FFFFFF",
    logo: "multi.svg",
    logoRatio: 112.3 / 25.5,
  },
  {
    nome: "Nossa",
    // Fica no roxo da marca: o branco dá 18,4 e o dourado 12,2. A placa roxa
    // atrás encosta no fundo, mas é a sombra da marca, não o desenho.
    bg: "#1C0244",
    fg: "#FFFFFF",
    logo: "nossa.svg",
    logoRatio: 259.3 / 97.4,
  },
  {
    nome: "Novibet",
    bg: "#0A1324", // cor da marca
    fg: "#FFFFFF",
    logo: "novibet.svg",
    logoRatio: 131 / 31,
  },
  {
    nome: "Ona",
    // Vermelho sobre o mesmo vermelho comia 60% da logo. Escurecido, 4,6.
    bg: "#240004",
    fg: "#FFFFFF",
    logo: "ona.svg",
    logoRatio: 138.2 / 35,
  },
  {
    nome: "Pagol",
    // Verde-água sobre verde-água: sumia inteira. Escurecido, 4,6.
    bg: "#07503A",
    fg: "#FFFFFF",
    logo: "pagol.svg",
    logoRatio: 96.5 / 25.8,
  },
  {
    nome: "Pinnacle",
    // O traço laranja embaixo do nome era da cor do fundo e desaparecia.
    // Escurecido, 4,7.
    bg: "#471800",
    fg: "#FFFFFF",
    logo: "pinnacle.svg",
    logoRatio: 256.7 / 63.8,
  },
  {
    nome: "Pixbet",
    bg: "#035FAF", // cor da marca
    fg: "#FFFFFF",
    logo: "pixbet.svg",
    logoRatio: 112.5 / 39.3,
  },
  {
    nome: "R7",
    // A moldura dourada em volta do nome era da cor do fundo e sumia.
    // Escurecido, 4,6.
    bg: "#613A00",
    fg: "#FFFFFF",
    logo: "r7.svg",
    logoRatio: 113.2 / 41.3,
  },
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
