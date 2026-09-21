"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { LinkPlanilha } from "@/components/LinkPlanilha";

/**
 * O que a pessoa vê quando uma tela quebra.
 *
 * Sem este arquivo, um erro no navegador deixava a tela em branco com a
 * mensagem padrão do Next, em inglês. Num site que vive de mostrar que não
 * esconde nada, a falha também precisa ser dita com clareza: o que houve, que
 * os números continuam na planilha, e dois caminhos de volta.
 *
 * Fica dentro do layout, então menu e rodapé seguem na tela.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sem serviço de erros ligado ainda, o console é o que sobra para quem
    // for investigar; o `digest` casa com o log do servidor quando existe.
    console.error("Tela quebrou:", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div
        role="alert"
        className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-8 sm:p-10 shadow-sm"
      >
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--amber-soft)] text-[var(--amber)] text-[11px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          Algo deu errado
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight mt-4">
          Esta tela não carregou.
        </h1>
        <p className="text-sm text-[var(--text-2)] mt-2 leading-relaxed">
          Foi um problema do site, não dos números: eles continuam todos na planilha, do
          jeito que o bot registrou. Tentar de novo costuma resolver.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--sobre-cor)] text-xs font-bold hover:bg-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Tentar de novo
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-tinta/[0.1] bg-[var(--bg-card)] text-[var(--text)] text-xs font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Voltar para o início
          </Link>
        </div>

        <LinkPlanilha className="mt-6" />
      </div>
    </div>
  );
}
