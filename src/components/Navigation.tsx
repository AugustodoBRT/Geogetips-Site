"use client";

import { useEffect, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DURACAO, MOLA_CURTA, VEU } from "@/lib/movimento";
import { Menu, X } from "lucide-react";
import { BotaoTelegram, IconeTelegram } from "@/components/Telegram";
import { BotaoTema } from "@/components/BotaoTema";
import { TELEGRAM_URL } from "@/lib/constants";

const navItems = [
  { label: "Início", href: "/" },
  { label: "Painel", href: "/painel" },
  { label: "Apostas", href: "/apostas" },
  { label: "Histórico", href: "/historico" },
  { label: "Adms", href: "/adms" },
  { label: "Estatísticas", href: "/estatisticas" },
];

/**
 * Ponto que acende no link do menu enquanto a tela dele não chega.
 *
 * As telas são estáticas e o Next as busca antes do clique, então quase sempre
 * a troca é instantânea. Mas em rede lenta, clicando antes dessa busca
 * terminar, a tela antiga ficava uns 2 s parada sem sinal de que o clique
 * tinha pegado. Um `loading.tsx` daria esse retorno, só que atrasa em ~250 ms
 * a primeira visita de todo mundo (#17); `useLinkStatus` só age depois do
 * clique, no link clicado.
 *
 * Os 150 ms de espera para acender evitam piscar quando a troca é imediata. A
 * pulsação fica num elemento de dentro: a animação também mexe na opacidade e,
 * no mesmo elemento, passaria por cima da espera.
 */
function Pendente({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      data-indicador="navegacao"
      className={`pointer-events-none transition-opacity ${
        pending ? "opacity-100 duration-200 delay-150" : "opacity-0 duration-100"
      } ${className}`}
    >
      <span
        className={`block w-1.5 h-1.5 rounded-full bg-[var(--accent)] ${
          pending ? "motion-safe:animate-pulse" : ""
        }`}
      />
    </span>
  );
}

function Navigation() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const primeiroLink = useRef<HTMLAnchorElement>(null);

  // Fecha ao navegar
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Esc fecha, e o fundo não rola enquanto o menu está aberto
  useEffect(() => {
    if (!aberto) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
        botaoMenu.current?.focus();
      }
    }
    // Leva o foco para dentro do menu: sem isto, quem navega por teclado abria
    // o painel e continuava no botão, atrás dele. Foco direto, sem
    // requestAnimationFrame: o efeito já roda com o painel montado, e o rAF fica
    // parado em aba em segundo plano — o foco simplesmente não chegava.
    primeiroLink.current?.focus();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between bg-[color:color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-md border-b border-tinta/[0.07]"
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-[32px] h-[32px] bg-[var(--text)] rounded-xl flex items-center justify-center text-[var(--bg)] font-bold text-sm tracking-tight transition-transform group-hover:scale-95 shadow-sm">
              G
            </div>
            <span className="font-serif text-xl tracking-tight text-[var(--text)]">
              Geoge<span className="text-[var(--accent)]">Tips</span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1.5 bg-[var(--bg-soft)] p-1 rounded-full border border-tinta/[0.05]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative px-4 py-1.5 text-xs font-bold rounded-full transition-colors duration-150 ${
                    isActive
                      ? "text-[var(--text)]"
                      : "text-[var(--text-2)] hover:text-[var(--accent)]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-[var(--pilula)] rounded-full shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                  <Pendente className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10" />
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Fora do menu do celular de propósito: trocar de tema é coisa de
                um toque, e esconder atrás do menu dobraria o caminho. */}
            <BotaoTema />
            <BotaoTelegram
              variante="compacto"
              rotulo="Grupo grátis"
              className="hidden sm:inline-flex"
            />

            {/* Botão do menu mobile */}
            <button
              ref={botaoMenu}
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="menu-mobile"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              className="md:hidden p-2.5 -mr-1 rounded-full text-[var(--text)] hover:bg-tinta/[0.05] active:scale-95 transition-all"
            >
              {aberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Painel mobile.

          Duas peças soltas dentro do AnimatePresence, **cada uma com a sua
          key**. Antes elas vinham embrulhadas num fragmento sem key, e era
          isso que deixava o véu de tela cheia preso no DOM com opacidade 0
          depois de fechar, interceptando todo clique da página no celular.

          `pointerEvents: none` na saída é o cinto de segurança: mesmo que a
          animação trave no meio, o véu para de receber clique no instante em
          que começa a sair. */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            key="veu-menu"
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm md:hidden"
            initial={VEU.initial}
            animate={VEU.animate}
            exit={{ ...VEU.exit, pointerEvents: "none" }}
            transition={{ duration: DURACAO.toque }}
            onClick={() => setAberto(false)}
          />
        )}
        {aberto && (
          <motion.div
            key="painel-menu"
            id="menu-mobile"
            className="fixed top-16 left-0 right-0 z-40 md:hidden bg-[var(--bg)] border-b border-tinta/[0.08] shadow-subtle px-4 py-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            // Sai mais curto do que entrou: quem fechou já foi embora.
            exit={{ opacity: 0, y: -8, pointerEvents: "none" }}
            transition={MOLA_CURTA}
          >
            {/* O painel fica fora do <nav> do topo; sem este marco a lista
                do celular não aparecia como navegação para leitor de tela. */}
            <nav aria-label="Menu">
              <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
                {navItems.map((item, i) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        ref={i === 0 ? primeiroLink : undefined}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                          isActive
                            ? "bg-[var(--pilula)] text-[var(--text)] shadow-sm"
                            : "text-[var(--text-2)] hover:bg-[color:color-mix(in_srgb,var(--pilula)_60%,transparent)] hover:text-[var(--accent)]"
                        }`}
                      >
                        {item.label}
                        <Pendente />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] text-[var(--sobre-cor)] rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all"
            >
              <IconeTelegram className="w-4 h-4" />
              <span>Entrar no grupo grátis</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16" />
    </>
  );
}
export { Navigation };
