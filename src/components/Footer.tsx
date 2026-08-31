import Link from "next/link";
import { Table2 } from "lucide-react";
import { IconeTelegram, IconeX } from "@/components/Telegram";
import { TELEGRAM_URL, PLANILHA_URL, X_URL } from "@/lib/constants";

const LINKS = [
  { label: "Painel", href: "/painel" },
  { label: "Apostas", href: "/apostas" },
  { label: "Histórico", href: "/historico" },
  { label: "Adms", href: "/adms" },
  { label: "Estatísticas", href: "/estatisticas" },
];

export function Footer() {
  return (
    <footer className="border-t border-black/[0.07] bg-[var(--bg-alt)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[var(--text)] rounded-lg flex items-center justify-center text-[var(--bg)] font-bold text-xs">
              G
            </div>
            <span className="font-serif text-lg tracking-tight text-[var(--text)]">
              GeogeTips
            </span>
          </div>

          <div className="flex items-center gap-5 flex-wrap">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
            >
              <IconeTelegram className="w-3.5 h-3.5" />
              <span>@vemproGeogeTips</span>
            </a>

            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
            >
              <IconeX className="w-3.5 h-3.5" />
              <span>@GeogeTips</span>
            </a>

            <a
              href={PLANILHA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
            >
              <Table2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Planilha pública</span>
            </a>
          </div>

          <nav aria-label="Rodapé">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 list-none p-0 m-0">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Jogo responsável — exigência prática para site público de apostas no Brasil */}
        <div className="border-t border-black/[0.07] pt-6 flex flex-col sm:flex-row gap-4 sm:items-start">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-[var(--red)] text-[var(--red)] text-[11px] font-black shrink-0">
            18+
          </span>
          <div className="text-[11.5px] leading-relaxed text-[var(--text-2)] max-w-3xl space-y-1.5">
            <p>
              <strong className="text-[var(--text)]">Proibido para menores de 18 anos.</strong>{" "}
              Apostas envolvem risco de perda financeira. Aposte apenas o que você pode
              perder e nunca para recuperar prejuízos.
            </p>
            <p>
              O GeogeTips é uma ferramenta de registro e análise de resultados. Não somos
              casa de apostas, não intermediamos apostas e não garantimos retorno.
              Desempenho passado não indica resultado futuro.
            </p>
            <p>
              Se o jogo deixou de ser diversão, procure ajuda:{" "}
              <a
                href="https://jogadoresanonimos.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] font-semibold hover:underline"
              >
                Jogadores Anônimos
              </a>{" "}
              · CVV 188.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-3)]">
          GeogeTips — matemática para ganhar. feito com dados, não achismo.
        </p>
      </div>
    </footer>
  );
}
