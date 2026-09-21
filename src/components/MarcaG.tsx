/**
 * A marca do GeogeTips: o G orbital (#64).
 *
 * É o G do moletom do mascote, fechado numa circunferência, com dois nós roxos
 * da órbita — os mesmos do "o" do logotipo e do halo do mascote. Vetor, para
 * ficar nítido dos 16 px da aba aos 52 da imagem de compartilhamento.
 *
 * Sem hook e sem CSS de fora, de propósito: o mesmo componente desenha a barra
 * do site e também o ícone da aba e a imagem de compartilhamento, que rodam no
 * gerador de imagem do Next (Satori). Lá não existe CSS variable, então quem
 * chama de lá passa as cores em hexadecimal; no site, o padrão são os tokens, e
 * o G acompanha o tema sozinho.
 */

// Recortado ao desenho: o círculo do G tem raio 18 em torno de (32, 32), com
// traço de 7, e ocupa de 10,5 a 53,5 nos dois eixos. Com a caixa de 64 inteira
// a marca sobrava num quadrado vazio e parecia menor que o logotipo ao lado.
const CAIXA = "9 9 46 46";

// Do nó de cima, no alto à direita, o traço dá a volta por cima, pela esquerda
// e por baixo até a direita, e entra na barra do G.
const TRACO_DO_G = "M45.79 20.43 A18 18 0 1 0 49.93 33.57 L34 33.57";

const NOS = [
  { cx: 45.79, cy: 20.43, r: 5.6 },
  { cx: 33, cy: 33.57, r: 5 },
];

interface MarcaGProps {
  className?: string;
  /** Largura e altura em px. No site o tamanho costuma vir do `className`. */
  tamanho?: number;
  /** Cor do traço do G. */
  tinta?: string;
  /** Cor dos nós. */
  no?: string;
  /**
   * Cor do fundo onde a marca está. Vira o contorno dos nós, o respiro que os
   * separa do traço do G, como no logotipo.
   */
  fundo?: string;
}

export function MarcaG({
  className,
  tamanho,
  tinta = "currentColor",
  no = "var(--accent)",
  fundo = "var(--bg)",
}: MarcaGProps) {
  return (
    <svg
      viewBox={CAIXA}
      width={tamanho}
      height={tamanho}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={TRACO_DO_G}
        fill="none"
        stroke={tinta}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {NOS.map((n) => (
        <circle
          key={n.cx}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill={no}
          stroke={fundo}
          strokeWidth={3}
        />
      ))}
    </svg>
  );
}
