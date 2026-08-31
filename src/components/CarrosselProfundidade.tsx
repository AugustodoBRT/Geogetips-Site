"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";

export interface ItemCarrossel {
  titulo: string;
  texto: string;
  icone: React.ReactNode;
  corIcone: string;
}

/**
 * Mantém a faixa dentro de [0, 1] e estritamente crescente.
 *
 * O framer-motion transforma `useTransform` ligado à rolagem numa animação
 * WAAPI e usa a faixa de entrada como offsets de keyframe — que o browser
 * exige entre 0 e 1. Uma faixa começando em -0.1 derruba a página inteira.
 */
function faixaSegura(pontos: number[]): number[] {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const saida: number[] = [];
  pontos.forEach((n, i) => {
    const v = clamp(n);
    saida.push(i === 0 ? v : Math.max(v, saida[i - 1] + 0.0001));
  });
  // Se o empurrão passou de 1, recua tudo mantendo a ordem
  const excesso = saida[saida.length - 1] - 1;
  if (excesso > 0) return saida.map((n) => Math.max(0, n - excesso));
  return saida;
}

/** Quanto de rolagem cada card ocupa. Menos que isso fica atropelado. */
const ALTURA_POR_CARD_VH = 85;

interface CardProps {
  item: ItemCarrossel;
  indice: number;
  total: number;
  progresso: MotionValue<number>;
}

function Card({ item, indice, total, progresso }: CardProps) {
  // Cada card tem um "centro" na linha do tempo da rolagem. Ele chega do fundo,
  // passa nítido pelo centro e volta para o fundo — sem nunca deslizar de lado.
  const centro = (indice + 0.5) / total;
  const janela = 1 / total;

  // Nas bordas o card não desaparece: o primeiro já chega nítido e o último
  // permanece até o fim. Sem isso a seção abre e fecha com a tela vazia.
  const primeiro = indice === 0;
  const ultimo = indice === total - 1;

  // Cinco pontos em vez de três: o card entra, GANHA UM PLATÔ nítido e só
  // depois recua. Com três pontos ele passava nítido por um instante só, e a
  // troca deixava dois cards borrados sobrepostos na tela.
  const transicao = janela * 0.55;
  const inicio = primeiro ? 0 : centro - janela;
  const fim = ultimo ? 1 : centro + janela;

  const faixa = faixaSegura([
    inicio,
    primeiro ? 0 : inicio + transicao,
    centro,
    ultimo ? 1 : fim - transicao,
    fim,
  ]);

  const nasBordas = <T,>(fora: T, dentro: T): T[] => [
    primeiro ? dentro : fora,
    dentro,
    dentro,
    dentro,
    ultimo ? dentro : fora,
  ];

  const escala = useTransform(progresso, faixa, nasBordas(0.45, 1));
  const opacidade = useTransform(progresso, faixa, nasBordas(0, 1));
  const desfoqueRaw = useTransform(progresso, faixa, nasBordas(14, 0));
  const desfoque = useMotionTemplate`blur(${desfoqueRaw}px)`;
  // Leve deslocamento vertical reforça a sensação de profundidade
  const y = useTransform(progresso, faixa, [
    primeiro ? 0 : 40,
    0,
    0,
    0,
    ultimo ? 0 : -40,
  ]);

  return (
    <motion.article
      style={{ scale: escala, opacity: opacidade, filter: desfoque, y }}
      className="absolute inset-x-0 top-0 mx-auto max-w-2xl bg-white border border-black/[0.07] rounded-2xl p-7 sm:p-9 shadow-subtle"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${item.corIcone}`}
      >
        {item.icone}
      </div>
      <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1715] tracking-tight mb-3">
        {item.titulo}
      </h3>
      <p className="text-[15px] sm:text-base text-[#6B645A] leading-relaxed">
        {item.texto}
      </p>
      <div className="mt-6 pt-4 border-t border-black/[0.06] font-mono text-[11px] text-[#9E9689]">
        {String(indice + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
    </motion.article>
  );
}

function Marcador({
  indice,
  total,
  progresso,
}: {
  indice: number;
  total: number;
  progresso: MotionValue<number>;
}) {
  const centro = (indice + 0.5) / total;
  const janela = 1 / total;
  const faixa = faixaSegura([centro - janela / 2, centro, centro + janela / 2]);
  const escala = useTransform(progresso, faixa, [1, 2.2, 1]);
  const opacidade = useTransform(progresso, faixa, [0.25, 1, 0.25]);

  return (
    <motion.span
      style={{ scaleY: escala, opacity: opacidade }}
      className="block w-1 h-4 rounded-full bg-[#C7522A] origin-center"
    />
  );
}

export function CarrosselProfundidade({
  itens,
  cabecalho,
}: {
  itens: ItemCarrossel[];
  /** Fica DENTRO da área fixa, para viajar junto com os cards. */
  cabecalho?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const semMovimento = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Sem movimento, o carrossel vira uma grade normal: mesmo conteúdo, sem
  // depender de rolagem para revelar informação.
  if (semMovimento) {
    return (
      <div className="max-w-5xl mx-auto px-6">
        {cabecalho}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itens.map((item) => (
            <article
              key={item.titulo}
              className="bg-white border border-black/[0.07] rounded-2xl p-7 shadow-sm"
            >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${item.corIcone}`}
            >
              {item.icone}
            </div>
            <h3 className="text-base font-bold text-[#1A1715] mb-1.5 tracking-tight">
              {item.titulo}
            </h3>
            <p className="text-[13.5px] text-[#6B645A] leading-relaxed">
              {item.texto}
            </p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{ height: `${itens.length * ALTURA_POR_CARD_VH}vh` }}
      className="relative"
    >
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 h-full flex flex-col justify-center gap-8 sm:gap-10">
          {/* Cabeçalho dentro da área fixa: sem isso ele fica preso no topo do
              documento enquanto os cards ficam centralizados na viewport, e
              abre um vão enorme entre um e outro. */}
          {cabecalho}

          {/* Altura fixa para todos: o card é posicionado em absoluto e sem
              isso o bloco pularia conforme o texto de cada um. Calibrada para
              o card mais alto (~305px) sem sobrar vão. */}
          <div className="relative flex-none h-[min(46vh,360px)]">
            {/* Trilha de progresso lateral */}
            <div
              className="absolute -left-2 sm:-left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10"
              aria-hidden="true"
            >
              {itens.map((item, i) => (
                <Marcador
                  key={item.titulo}
                  indice={i}
                  total={itens.length}
                  progresso={scrollYProgress}
                />
              ))}
            </div>

            {itens.map((item, i) => (
              <Card
                key={item.titulo}
                item={item}
                indice={i}
                total={itens.length}
                progresso={scrollYProgress}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
