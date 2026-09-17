"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { DURACAO, ENTRADA_SOBREPOSICAO, MOLA_CURTA, VEU } from "@/lib/movimento";

interface DialogoProps {
  /** Nome acessível do diálogo, lido em voz alta ao abrir. */
  rotulo: string;
  onFechar: () => void;
  children: React.ReactNode;
  /** Classe de largura máxima. O padrão serve a um detalhe; listas pedem mais. */
  largura?: string;
}

/**
 * O invólucro de todo diálogo do site.
 *
 * Saiu de dentro do detalhe da aposta quando a terceira tela pediu a mesma
 * peça. O que ele carrega não é a aparência — é a lista de coisas que um
 * diálogo precisa fazer e que é fácil esquecer uma a uma:
 *
 * - **trava a rolagem do fundo** e devolve como estava ao fechar;
 * - **prende o foco** dentro dele enquanto estiver aberto, e **devolve o foco**
 *   a quem o abriu ao fechar — senão quem navega por teclado volta para o topo
 *   da página sem entender por quê;
 * - **Esc fecha**, e clicar no véu também;
 * - entra e **sai** com animação, e a saída é mais discreta que a entrada.
 *
 * Monta só quando há o que mostrar: quem controla entrada e saída é o
 * `AnimatePresence` de quem chama. Aqui dentro não há estado de aberto ou
 * fechado, o que deixa os efeitos simples — o que roda na montagem é
 * exatamente o que precisa ser desfeito na desmontagem.
 *
 * **O detalhe que custou caro:** `pointerEvents: none` entra junto com a saída.
 * Uma versão anterior deste diálogo deixava o véu de tela cheia preso no DOM
 * com opacidade 0, invisível, **engolindo todo clique da página**. Há teste de
 * tela para isso em `e2e/sobreposicoes.spec.ts`.
 */
export function Dialogo({
  rotulo,
  onFechar,
  children,
  largura = "max-w-lg",
}: DialogoProps) {
  const caixa = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  // onFechar muda de identidade a cada render do pai. Guardar numa ref evita
  // que o efeito abaixo reexecute e desfaça a própria trava de rolagem.
  const fecharRef = useRef(onFechar);
  useEffect(() => {
    fecharRef.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    focoAnterior.current = document.activeElement as HTMLElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        fecharRef.current();
        return;
      }
      if (e.key === "Tab" && caixa.current) {
        const focaveis = caixa.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focaveis.length === 0) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // Foco direto, sem requestAnimationFrame: em aba de fundo o quadro seguinte
    // pode demorar, e o diálogo abriria sem o foco dentro dele.
    caixa.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
      focoAnterior.current?.focus?.();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={VEU.initial}
      animate={VEU.animate}
      exit={{ ...VEU.exit, pointerEvents: "none" }}
      transition={{ duration: DURACAO.toque }}
      onClick={onFechar}
    >
      <motion.div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={rotulo}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        initial={ENTRADA_SOBREPOSICAO.initial}
        animate={ENTRADA_SOBREPOSICAO.animate}
        // A saída é mais curta e mais discreta que a entrada: quem fechou já
        // está olhando para outra coisa.
        exit={{ ...ENTRADA_SOBREPOSICAO.exit, scale: 0.98 }}
        transition={MOLA_CURTA}
        className={`bg-white border border-black/[0.1] rounded-2xl ${largura} w-full p-6 shadow-2xl space-y-5 outline-none max-h-[90vh] overflow-y-auto`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
