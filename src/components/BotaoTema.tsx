"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { CHAVE_TEMA, ehTema, resolverTema, type Tema } from "@/lib/tema";

function temaNaTela(): Tema {
  return document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro";
}

function escolhaGuardada(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE_TEMA);
    return ehTema(valor) ? valor : null;
  } catch {
    return null;
  }
}

/**
 * Troca o tema na tela, sem transição, e acerta a barra do navegador.
 *
 * O `data-trocando-tema` desliga as transições por um quadro (ver
 * globals.css): sem ele, cada elemento com `transition-colors` mudaria no seu
 * tempo e a troca passaria por um meio-termo manchado. Ler um estilo no meio
 * força o navegador a aplicar as cores novas antes de o atributo sair.
 */
function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  raiz.setAttribute("data-trocando-tema", "");
  raiz.dataset.tema = tema;
  const fundo = getComputedStyle(raiz).getPropertyValue("--bg").trim();
  // O metadata manda duas tags, uma por tema do aparelho; a escolha da pessoa
  // pode ser o contrário do aparelho, então as duas passam a dizer o mesmo.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute("content", fundo);
  }
  requestAnimationFrame(() => raiz.removeAttribute("data-trocando-tema"));
}

/**
 * Sol no escuro, lua no claro: o ícone mostra para onde o clique leva.
 *
 * Os dois ícones saem do servidor e o CSS mostra um, pelo `data-tema` que o
 * script do <head> já pôs. Assim o ícone certo aparece na primeira pintura,
 * sem esperar o React. Só o `aria-pressed` depende do estado, e fica de fora
 * até a montagem: o servidor não sabe o tema.
 */
export function BotaoTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<Tema | null>(null);

  // Rede de segurança, antes da pintura: se a hidratação quebrar em qualquer
  // tela, o React remonta a página e o `<html>` perde o `data-tema` que o
  // script do <head> tinha posto — o site voltava para o claro. Aconteceu com
  // "reduzir movimento" ligado (ver useSemMovimento).
  useLayoutEffect(() => {
    const devido = resolverTema(
      escolhaGuardada(),
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    if (document.documentElement.dataset.tema !== devido) aplicar(devido);
    setTema(devido);
  }, []);

  useEffect(() => {
    // Sem escolha guardada, acompanha o aparelho com a página aberta.
    const aparelho = window.matchMedia("(prefers-color-scheme: dark)");
    const seguir = () => {
      if (escolhaGuardada()) return;
      const novo = resolverTema(null, aparelho.matches);
      aplicar(novo);
      setTema(novo);
    };
    aparelho.addEventListener("change", seguir);

    // Escolha feita em outra aba do site vale aqui também.
    const deOutraAba = (e: StorageEvent) => {
      if (e.key !== CHAVE_TEMA) return;
      const novo = resolverTema(e.newValue, aparelho.matches);
      aplicar(novo);
      setTema(novo);
    };
    window.addEventListener("storage", deOutraAba);

    return () => {
      aparelho.removeEventListener("change", seguir);
      window.removeEventListener("storage", deOutraAba);
    };
  }, []);

  function alternar() {
    const novo: Tema = temaNaTela() === "escuro" ? "claro" : "escuro";
    aplicar(novo);
    setTema(novo);
    try {
      localStorage.setItem(CHAVE_TEMA, novo);
    } catch {
      // Armazenamento bloqueado: a troca vale até sair da página.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Tema escuro"
      aria-pressed={tema === null ? undefined : tema === "escuro"}
      title="Alternar entre tema claro e escuro"
      className={`p-2.5 rounded-full text-[var(--text-2)] hover:text-[var(--text)] hover:bg-tinta/[0.05] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors ${className}`}
    >
      <Moon className="w-[18px] h-[18px] dark:hidden" aria-hidden="true" />
      <Sun className="w-[18px] h-[18px] hidden dark:block" aria-hidden="true" />
    </button>
  );
}
