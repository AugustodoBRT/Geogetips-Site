"use client";

import { useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/** Curva de desaceleração usada em todo o site. Sai rápido, assenta devagar. */
const SAIDA_SUAVE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface TextoQueCaiProps {
  texto: string;
  className?: string;
  /** Atraso antes da primeira palavra, para encadear com o resto da tela. */
  atraso?: number;
  /** Intervalo entre uma palavra e a seguinte. */
  intervalo?: number;
  como?: "h1" | "h2" | "span";
}

/**
 * Título que "cai" palavra por palavra.
 *
 * O texto completo continua no HTML para leitores de tela e para o Google: o
 * container carrega o aria-label e as palavras animadas ficam aria-hidden.
 */
export function TextoQueCai({
  texto,
  className = "",
  atraso = 0,
  intervalo = 0.085,
  como = "span",
}: TextoQueCaiProps) {
  const semMovimento = useReducedMotion();
  const palavras = useMemo(() => texto.split(" "), [texto]);
  const ref = useRef<HTMLElement>(null);
  // Reanima toda vez que o título entra na tela, descendo ou subindo
  const emVista = useInView(ref, { margin: "0px 0px -10% 0px" });

  const Tag = motion[como] as typeof motion.span;

  if (semMovimento) {
    const Estatico = como;
    return (
      <Estatico className={className}>
        {texto}
      </Estatico>
    );
  }

  // Orquestração explícita em vez de staggerChildren + whileInView: aquela
  // combinação calcula atrasos negativos ao sair da tela e o WAAPI rejeita
  // ("offsets must be monotonically non-decreasing"), derrubando a página.
  return (
    <Tag
      ref={ref}
      className={className}
      aria-label={texto}
    >
      {palavras.map((p, i) => (
        <span key={`${p}-${i}`} aria-hidden="true">
          <span
            // overflow-hidden recorta a palavra enquanto ela vem de cima,
            // dando a impressão de que ela cai por trás da linha de base
            style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "top",
            }}
          >
            <motion.span
              style={{ display: "inline-block" }}
              initial={{ y: "-0.75em", opacity: 0 }}
              animate={emVista ? { y: "0em", opacity: 1 } : { y: "-0.75em", opacity: 0 }}
              transition={{
                duration: 1.05,
                ease: SAIDA_SUAVE,
                delay: emVista ? atraso + i * intervalo : 0,
              }}
            >
              {p}
            </motion.span>
          </span>
          {/* Espaço fora do recorte: dentro do inline-block ele é engolido */}
          {i < palavras.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

interface RevelarProps {
  children: React.ReactNode;
  className?: string;
  atraso?: number;
  /** Distância que o bloco sobe ao entrar. */
  distancia?: number;
}

/**
 * Revela um bloco ao entrar na tela e o recolhe ao sair, nos dois sentidos —
 * descendo e subindo. A margem negativa faz o gatilho disparar um pouco antes
 * da borda, para o bloco já chegar em movimento em vez de aparecer pronto.
 */
export function Revelar({
  children,
  className = "",
  atraso = 0,
  distancia = 28,
}: RevelarProps) {
  const semMovimento = useReducedMotion();

  if (semMovimento) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distancia }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 0.95, delay: atraso, ease: SAIDA_SUAVE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Entrada encadeada dos elementos do topo, na ordem em que se lê.
 * Cada filho recebe o próprio atraso via `indice`.
 */
export function EntradaSequencial({
  children,
  indice = 0,
  className = "",
  base = 0.15,
  passo = 0.13,
}: {
  children: React.ReactNode;
  indice?: number;
  className?: string;
  base?: number;
  passo?: number;
}) {
  const semMovimento = useReducedMotion();

  if (semMovimento) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1.0,
        delay: base + indice * passo,
        ease: SAIDA_SUAVE,
      }}
    >
      {children}
    </motion.div>
  );
}
