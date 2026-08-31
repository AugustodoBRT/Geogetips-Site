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
      className="bg-[var(--red)]/[0.06] border border-[var(--red)]/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--red)]/12 text-[var(--red)] flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--red)]">
          Não foi possível ler a planilha
        </p>
        <p className="text-[13px] text-[var(--text-2)] mt-0.5 break-words">{mensagem}</p>
      </div>
      {onTentarNovamente && (
        <button
          onClick={onTentarNovamente}
          className="px-4 py-2 bg-[var(--red)] text-white text-xs font-bold rounded-full hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
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
    <div className="bg-[var(--amber)]/[0.08] border border-[var(--amber)]/30 rounded-2xl px-5 py-3 flex items-center gap-3">
      <FlaskConical className="w-4 h-4 text-[var(--amber)] shrink-0" />
      <p className="text-[13px] text-[var(--text)]">
        <strong className="font-bold text-[var(--amber)]">Dados de demonstração.</strong>{" "}
        Os números abaixo são fictícios e não refletem resultados reais do grupo.
      </p>
    </div>
  );
}
