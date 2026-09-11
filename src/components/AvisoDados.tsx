import { AlertTriangle, FlaskConical } from "lucide-react";

/**
 * Falha de leitura da planilha. Substitui o comportamento antigo, em que
 * erro virava MOCK_BETS servido silenciosamente como dado real.
 */
export function AvisoErro({
  mensagem,
  onTentarNovamente,
}: {
  mensagem: string;
  onTentarNovamente?: () => void;
}) {
  return (
    <div
      role="alert"
      className="bg-[var(--red-soft)] border border-[color:color-mix(in_srgb,var(--red)_25%,transparent)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--red-soft)] text-[var(--red)] flex items-center justify-center shrink-0">
        {/* w-4.5 não existe na escala do Tailwind 3: o ícone saía no tamanho padrão, 24px. */}
        <AlertTriangle className="w-[18px] h-[18px]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--red)]">
          Não foi possível ler a planilha
        </p>
        <p className="text-[13px] text-[var(--text-2)] mt-0.5 break-words">{mensagem}</p>
      </div>
      {onTentarNovamente && (
        <button
          type="button"
          onClick={onTentarNovamente}
          className="px-4 py-2 bg-[var(--red)] text-white text-xs font-bold rounded-full hover:opacity-90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--red)] focus-visible:ring-offset-2 transition-all shrink-0"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

/** Modo demonstração explícito (NEXT_PUBLIC_USE_MOCK=1). */
export function AvisoMock() {
  return (
    <div className="bg-[var(--amber-soft)] border border-[color:color-mix(in_srgb,var(--amber)_30%,transparent)] rounded-2xl px-5 py-3 flex items-center gap-3">
      <FlaskConical className="w-4 h-4 text-[var(--amber)] shrink-0" aria-hidden="true" />
      <p className="text-[13px] text-[var(--text)]">
        <strong className="font-bold text-[var(--amber)]">Dados de demonstração.</strong>{" "}
        Os números abaixo são fictícios e não refletem resultados reais do grupo.
      </p>
    </div>
  );
}
