"use client";

import { MotionConfig } from "framer-motion";

/**
 * Respeito a "reduzir movimento" para tudo que o framer-motion anima.
 *
 * O bloco `prefers-reduced-motion` do `globals.css` zera duração de animação e
 * transição — mas só as do CSS. O framer anima por JavaScript, então passava
 * por cima dele: quem tinha pedido menos movimento no sistema continuava
 * recebendo o diálogo deslizando, o menu do celular descendo e o título da home
 * caindo palavra por palavra.
 *
 * `reducedMotion="user"` resolve na raiz, e de um jeito melhor do que desligar
 * tudo: o framer descarta as animações de posição, escala e rotação — as que
 * causam desconforto vestibular — e **mantém as de opacidade**, que não causam.
 * O elemento continua aparecendo e sumindo, só que sem se deslocar.
 *
 * Valendo para a árvore inteira, animação nova nasce coberta: não depende de
 * alguém lembrar de chamar `useReducedMotion` em cada componente.
 */
export function ProvedorDeMovimento({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
