"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Coins, RotateCcw } from "lucide-react";
import { useUnidade } from "@/hooks/useUnidade";
import { VALOR_UNIDADE } from "@/lib/constants";
import { formatarReais } from "@/lib/format";

const SUGESTOES = [5, 10, 25, 50, 100];

/**
 * Deixa o visitante ver o histórico do grupo na banca dele.
 * Sem isso, os números só falam com quem usa a mesma unidade que a gente.
 */
export function SeletorUnidade() {
  const { unidade, definirUnidade, restaurarPadrao, personalizada } = useUnidade();
  const [rascunho, setRascunho] = useState(String(unidade));

  // Mantém o campo em sincronia quando a unidade muda por fora (chips, reset)
  useEffect(() => {
    setRascunho(String(unidade));
  }, [unidade]);

  function aplicar(texto: string) {
    const n = parseFloat(texto.replace(",", "."));
    if (Number.isFinite(n) && n > 0) definirUnidade(n);
    else setRascunho(String(unidade));
  }

  return (
    <section
      aria-labelledby="titulo-unidade"
      className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="titulo-unidade"
              className="text-sm font-bold text-[#1A1715] tracking-tight"
            >
              Quanto vale 1 unidade para você?
            </h2>
            <p className="text-xs text-[#6B645A] mt-0.5">
              A unidade do grupo é {formatarReais(VALOR_UNIDADE)}. Coloque a sua e
              todos os valores passam para a sua banca — o ROI e a taxa de acerto
              não mudam.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1" role="group" aria-label="Valores sugeridos">
            {SUGESTOES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => definirUnidade(v)}
                aria-pressed={unidade === v}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-all ${
                  unidade === v
                    ? "bg-[#1A1715] text-white border-[#1A1715]"
                    : "bg-white text-[#6B645A] border-black/[0.08] hover:border-black/25 hover:text-[#1A1715]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="campo-unidade" className="sr-only">
              Valor de 1 unidade em reais
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9E9689] pointer-events-none"
                aria-hidden="true"
              >
                R$
              </span>
              <input
                id="campo-unidade"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                onBlur={(e) => aplicar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicar((e.target as HTMLInputElement).value);
                  }
                }}
                className="w-28 bg-[#F7F5F0] border border-black/[0.1] rounded-full pl-9 pr-3 py-1.5 text-xs font-bold font-mono text-[#1A1715] outline-none focus:border-[#C7522A] focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-colors"
              />
            </div>

            {personalizada && (
              <button
                type="button"
                onClick={restaurarPadrao}
                title="Voltar para a unidade do grupo"
                aria-label="Voltar para a unidade do grupo"
                className="p-1.5 rounded-full text-[#6B645A] hover:bg-[#EFECE6] hover:text-[#1A1715] focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {personalizada && (
        <div className="mt-3 pt-3 border-t border-black/[0.05] flex items-start gap-2.5">
          <AlertTriangle
            className="w-3.5 h-3.5 text-[#B8860B] mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p className="text-[11.5px] text-[#6B645A] leading-relaxed">
            <strong className="text-[#B8860B] font-bold">
              Simulação aproximada, não resultado exato.
            </strong>{" "}
            O histórico real foi operado a {formatarReais(VALOR_UNIDADE)} por
            unidade, e o recálculo para {formatarReais(unidade)} apenas escala os
            valores proporcionalmente. Ele{" "}
            <strong className="text-[#1A1715]">
              não considera limites de aposta nem a liquidez
            </strong>{" "}
            de cada mercado: em stakes maiores a casa pode não aceitar o valor
            cheio, e odds altas costumam cair conforme o volume entra. Trate como
            ordem de grandeza.
          </p>
        </div>
      )}
    </section>
  );
}
