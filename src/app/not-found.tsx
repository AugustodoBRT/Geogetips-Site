import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Página não encontrada",
  // Página de erro não tem o que indexar, e ainda faria o buscador guardar um
  // endereço quebrado como se fosse conteúdo.
  robots: { index: false, follow: true },
};

const ATALHOS = [
  { href: "/painel", nome: "Painel", texto: "Lucro, ROI e evolução da banca" },
  { href: "/apostas", nome: "Apostas", texto: "O feed, dia a dia" },
  { href: "/historico", nome: "Histórico", texto: "Todos os meses lado a lado" },
  { href: "/estatisticas", nome: "Estatísticas", texto: "Por esporte e por casa" },
];

/**
 * O 404 do site.
 *
 * Sem este arquivo, o Next serve a tela dele: "404 — This page could not be
 * found", em inglês, com o título da home. Num site em português que vive de
 * parecer confiável, o endereço errado não pode responder em outra língua.
 */
export default function NaoEncontrada() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-8 sm:p-10 shadow-sm animate-entrada">
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" aria-hidden="true" />
          Erro 404
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight mt-4">
          Esta página não existe.
        </h1>
        <p className="text-sm text-[var(--text-2)] mt-2 leading-relaxed">
          O endereço pode ter mudado, ou o link que te trouxe até aqui está errado. Os
          números continuam todos no lugar — é só escolher por onde entrar.
        </p>

        <nav aria-label="Atalhos do site" className="grid sm:grid-cols-2 gap-2 mt-6">
          {ATALHOS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group/atalho block p-3 rounded-xl border border-tinta/[0.07] bg-[var(--bg-soft)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
            >
              <span className="block text-sm font-bold text-[var(--text)] group-hover/atalho:text-[var(--accent)] transition-colors">
                {a.nome}
              </span>
              <span className="block text-[11.5px] text-[var(--text-3)]">{a.texto}</span>
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-[var(--text)] text-[var(--bg)] text-xs font-bold hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-opacity"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
