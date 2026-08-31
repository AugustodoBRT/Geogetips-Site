import { ArrowUpRight, Table2 } from "lucide-react";
import { TELEGRAM_URL, PLANILHA_URL } from "@/lib/constants";

/** Logo do X. O lucide não traz ícones de marca. */
export function IconeX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.09 4.13H5.13l11.95 15.64Z" />
    </svg>
  );
}

/** Logo do Telegram. O lucide não traz ícones de marca. */
export function IconeTelegram({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M21.94 4.6a1.32 1.32 0 0 0-1.4-.2L2.9 11.55a1.3 1.3 0 0 0 .1 2.44l4.06 1.3 1.57 4.92a1.05 1.05 0 0 0 1.77.42l2.3-2.35 4.1 3.02a1.3 1.3 0 0 0 2.05-.79l3.42-14.6a1.32 1.32 0 0 0-.33-1.31ZM9.6 14.2l-.6 3.42-1.15-3.6 8.9-5.9-7.15 6.08Z" />
    </svg>
  );
}

interface BotaoTelegramProps {
  variante?: "primario" | "secundario" | "compacto";
  rotulo?: string;
  className?: string;
}

const ESTILOS = {
  primario:
    "px-7 py-3 bg-[var(--accent)] text-white text-sm font-semibold rounded-full hover:bg-[var(--accent-hover)] active:scale-[0.98] shadow-sm",
  secundario:
    "px-7 py-3 bg-transparent text-[var(--text)] text-sm font-semibold border border-black/15 rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.98]",
  compacto:
    "px-4 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-full hover:bg-[var(--accent-hover)] active:scale-[0.98] shadow-sm",
} as const;

export function BotaoTelegram({
  variante = "primario",
  rotulo = "Entrar no grupo grátis",
  className = "",
}: BotaoTelegramProps) {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${ESTILOS[variante]} ${className}`}
    >
      <IconeTelegram className={variante === "compacto" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <span>{rotulo}</span>
    </a>
  );
}

const BENEFICIOS = [
  "As entradas chegam no Telegram, na hora em que saem",
  "Cada palpite vira linha na planilha — inclusive os que dão red",
  "Entrada gratuita, sem cadastro",
];

/**
 * Fecho das páginas. O visitante que chegou até aqui já viu os números;
 * é o único momento do site em que pedimos algo dele.
 */
export function SecaoTelegram() {
  return (
    <section className="relative overflow-hidden bg-[var(--marca)] text-[var(--bg)] rounded-2xl px-7 py-9 sm:px-10 sm:py-11">
      {/* Brilho radial roxo, como na arte da marca. Roxo aqui só funciona como
          chão: sobre este preto ele dá 3,01:1, insuficiente para texto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/3 left-1/4 h-[140%] w-[70%] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
      />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5">
          <IconeTelegram className="w-3.5 h-3.5" />
          <span>Grupo gratuito</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight leading-tight mb-3">
          Os números estão abertos.
          <br />O grupo também.
        </h2>

        <p className="text-sm text-[var(--bg)]/70 leading-relaxed mb-7 max-w-xl">
          Tudo que você vê neste site sai das mesmas entradas que são enviadas no
          canal. Entre, acompanhe por alguns dias e confira os resultados na
          planilha antes de decidir qualquer coisa.
        </p>

        <ul className="space-y-2.5 mb-8 list-none p-0">
          {BENEFICIOS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-[var(--bg)]/85">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--green)] mt-2 shrink-0"
                aria-hidden="true"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 bg-[var(--bg)] text-[var(--text)] text-sm font-bold rounded-full hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white transition-all"
          >
            <IconeTelegram className="w-4 h-4" />
            <span>Entrar no grupo grátis</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <a
            href={PLANILHA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/25 text-[var(--bg)] text-sm font-semibold rounded-full hover:bg-white/10 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white transition-all"
          >
            <Table2 className="w-4 h-4" />
            <span>Conferir a planilha</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <p className="text-[11px] text-[var(--bg)]/45 mt-4">
          @vemproGeogeTips · planilha aberta em modo somente leitura · 18+
        </p>
      </div>
    </section>
  );
}
