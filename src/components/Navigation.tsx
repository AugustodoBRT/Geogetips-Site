"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BotaoTelegram, IconeTelegram } from "@/components/Telegram";
import { TELEGRAM_URL } from "@/lib/constants";

const navItems = [
  { label: "Início", href: "/" },
  { label: "Painel", href: "/painel" },
  { label: "Apostas", href: "/apostas" },
  { label: "Histórico", href: "/historico" },
  { label: "Adms", href: "/adms" },
  { label: "Estatísticas", href: "/estatisticas" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha ao navegar
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Esc fecha, e o fundo não rola enquanto o menu está aberto
  useEffect(() => {
    if (!aberto) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
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
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between bg-[var(--bg)]/90 backdrop-blur-md border-b border-black/[0.07]"
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
          <div className="hidden md:flex items-center gap-1.5 bg-[var(--bg-soft)] p-1 rounded-full border border-black/[0.05]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative px-4 py-1.5 text-xs font-bold rounded-full transition-colors duration-150 ${
                    isActive ? "text-[var(--text)]" : "text-[var(--text-2)] hover:text-[var(--accent)]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <BotaoTelegram
              variante="compacto"
              rotulo="Grupo grátis"
              className="hidden sm:inline-flex"
            />

            {/* Botão do menu mobile */}
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="menu-mobile"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              className="md:hidden p-2.5 -mr-1 rounded-full text-[var(--text)] hover:bg-black/[0.05] active:scale-95 transition-all"
            >
              {aberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Painel mobile.
          Sem AnimatePresence de propósito: com ela, o backdrop de tela cheia
          permanecia no DOM com opacity 0 depois de fechar e interceptava todos
          os cliques da página no mobile. Desmontar direto é determinístico. */}
      {aberto && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            onClick={() => setAberto(false)}
          />
          <motion.div
            id="menu-mobile"
            className="fixed top-16 left-0 right-0 z-40 md:hidden bg-[var(--bg)] border-b border-black/[0.08] shadow-subtle px-4 py-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                        isActive
                          ? "bg-white text-[var(--text)] shadow-sm"
                          : "text-[var(--text-2)] hover:bg-white/60 hover:text-[var(--accent)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all"
            >
              <IconeTelegram className="w-4 h-4" />
              <span>Entrar no grupo grátis</span>
            </a>
          </motion.div>
        </>
      )}

      <div className="h-16" />
    </>
  );
}
export { Navigation };
