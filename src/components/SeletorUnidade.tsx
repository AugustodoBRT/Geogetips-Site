"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Coins, RotateCcw } from "lucide-react";
import { useUnidade } from "@/hooks/useUnidade";
import { VALOR_UNIDADE } from "@/lib/constants";
import { UNIDADE_MAXIMA, UNIDADE_MINIMA, formatarReais, lerNumeroBR } from "@/lib/format";

const SUGESTOES = [5, 10, 25, 50, 100];

/**
 * Escreve a unidade como se escreve dinheiro, sem o "R$" que já está no campo:
 * 1000 vira "1.000" e 1500.5 vira "1.500,50" — e não "1.500,5", que parece
 * valor pela metade.
 */
function escreverUnidade(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Deixa o visitante ver o histórico do grupo na banca dele.
 * Sem isso, os números só falam com quem usa a mesma unidade que a gente.
 */
export function SeletorUnidade() {
  const { unidade, definirUnidade, restaurarPadrao, personalizada } = useUnidade();
  const [rascunho, setRascunho] = useState(() => escreverUnidade(unidade));
  const [recusado, setRecusado] = useState(false);

  // Mantém o campo em sincronia quando a unidade muda por fora (chips, reset)
  useEffect(() => {
    setRascunho(escreverUnidade(unidade));
    setRecusado(false);
  }, [unidade]);

  /**
   * O que a pessoa digitou vira unidade — ou volta atrás, dizendo por quê.
   *
   * Aqui morava o defeito mais caro da tela: `parseFloat("1.000")` é 1, então
   * quem digitava mil reais passava a ver o site inteiro cem vezes menor, sem
   * nenhum aviso. Quem lê número agora é `lerNumeroBR`, que entende o ponto de
   * milhar brasileiro e tem teto e piso.
   */
  function aplicar(texto: string) {
    const n = lerNumeroBR(texto);
    if (n === null) {
      setRecusado(true);
      setRascunho(escreverUnidade(unidade));
      return;
    }
    setRecusado(false);
    // Devolve o valor escrito como o site escreve: 1000 vira "1.000".
    setRascunho(escreverUnidade(n));
    definirUnidade(n);
  }

  return (
    <section
      aria-labelledby="titulo-unidade"
      className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[var(--green-soft)] text-[var(--green)] flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="titulo-unidade"
              className="text-sm font-bold text-[var(--text)] tracking-tight"
            >
              Quanto vale 1 unidade para você?
            </h2>
            <p className="text-xs text-[var(--text-2)] mt-0.5">
              A unidade do grupo é {formatarReais(VALOR_UNIDADE)}. Coloque a sua e todos
              os valores passam para a sua banca — o ROI e a taxa de acerto não mudam.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que traz borda, margem e padding do navegador e existe para agrupar campo de formulário — não uma barra de botões. */}
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Valores sugeridos"
          >
            {SUGESTOES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => definirUnidade(v)}
                aria-pressed={unidade === v}
                className={`px-2.5 py-1 min-h-[24px] min-w-[24px] text-[11px] font-bold rounded-full border transition-all ${
                  unidade === v
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-white text-[var(--text-2)] border-black/[0.08] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-3)] pointer-events-none"
                aria-hidden="true"
              >
                R$
              </span>
              {/* type="text" com teclado decimal: um type="number" descarta o
                  valor inteiro ao receber vírgula em parte dos navegadores, e o
                  campo voltava sozinho ao número anterior. A vírgula já é
                  convertida em aplicar(). */}
              <input
                id="campo-unidade"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={rascunho}
                aria-describedby={recusado ? "aviso-unidade" : undefined}
                aria-invalid={recusado || undefined}
                onChange={(e) => {
                  setRascunho(e.target.value);
                  setRecusado(false);
                }}
                onBlur={(e) => aplicar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicar((e.target as HTMLInputElement).value);
                  }
                }}
                className="w-28 bg-[var(--bg)] border border-black/[0.1] rounded-full pl-9 pr-3 py-1.5 text-xs font-bold font-mono text-[var(--text)] outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
              />
            </div>

            {personalizada && (
              <button
                type="button"
                onClick={restaurarPadrao}
                title="Voltar para a unidade do grupo"
                aria-label="Voltar para a unidade do grupo"
                className="p-1.5 min-h-[24px] min-w-[24px] rounded-full text-[var(--text-2)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* O aviso fala sozinho para quem ouve a tela: `role="status"` anuncia a
          recusa no momento em que ela aparece, sem roubar o foco do campo. */}
      {recusado && (
        <p
          id="aviso-unidade"
          role="status"
          className="mt-3 text-[11.5px] font-medium text-[var(--amber)]"
        >
          Valor não aceito. Use algo entre {formatarReais(UNIDADE_MINIMA)} e{" "}
          {formatarReais(UNIDADE_MAXIMA)} — o ponto pode separar o milhar, como em 1.000.
        </p>
      )}

      {personalizada && (
        <div className="mt-3 pt-3 border-t border-black/[0.05] flex items-start gap-2.5">
          <AlertTriangle
            className="w-3.5 h-3.5 text-[var(--amber)] mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p className="text-[11.5px] text-[var(--text-2)] leading-relaxed">
            <strong className="text-[var(--amber)] font-bold">
              Simulação aproximada, não resultado exato.
            </strong>{" "}
            O histórico real foi operado a {formatarReais(VALOR_UNIDADE)} por unidade, e o
            recálculo para {formatarReais(unidade)} apenas escala os valores
            proporcionalmente. Ele{" "}
            <strong className="text-[var(--text)]">
              não considera limites de aposta nem a liquidez
            </strong>{" "}
            de cada mercado: em stakes maiores a casa pode não aceitar o valor cheio, e
            odds altas costumam cair conforme o volume entra. Trate como ordem de
            grandeza.
          </p>
        </div>
      )}
    </section>
  );
}
