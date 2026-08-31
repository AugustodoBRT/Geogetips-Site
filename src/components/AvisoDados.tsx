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
      className="bg-[#C23B22]/[0.06] border border-[#C23B22]/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="w-9 h-9 rounded-lg bg-[#C23B22]/12 text-[#C23B22] flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#C23B22]">
          Não foi possível ler a planilha
        </p>
        <p className="text-[13px] text-[#6B645A] mt-0.5 break-words">{mensagem}</p>
      </div>
      {onTentarNovamente && (
        <button
          onClick={onTentarNovamente}
          className="px-4 py-2 bg-[#C23B22] text-white text-xs font-bold rounded-full hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
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
    <div className="bg-[#B8860B]/[0.08] border border-[#B8860B]/30 rounded-2xl px-5 py-3 flex items-center gap-3">
      <FlaskConical className="w-4 h-4 text-[#B8860B] shrink-0" />
      <p className="text-[13px] text-[#1A1715]">
        <strong className="font-bold text-[#B8860B]">Dados de demonstração.</strong>{" "}
        Os números abaixo são fictícios e não refletem resultados reais do grupo.
      </p>
    </div>
  );
}
