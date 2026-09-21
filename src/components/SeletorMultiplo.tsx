"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import { DURACAO, SAIDA_SUAVE } from "@/lib/movimento";

/** Largura de `w-60`, em pixels. Usada para decidir de que lado a lista abre. */
const LARGURA_DA_LISTA = 240;

interface SeletorMultiploProps {
  /** Rótulo quando nada está marcado — e o que "tudo" significa aqui. */
  rotuloVazio: string;
  /** Palavra usada no plural: "2 casas", "3 esportes". */
  substantivo: string;
  opcoes: string[];
  selecionadas: string[];
  onChange: (valores: string[]) => void;
  /** Quantas apostas cada opção tem, para o usuário saber o que vale filtrar. */
  contagem?: Map<string, number>;
  className?: string;
}

/**
 * Filtro de múltipla escolha em forma de pílula.
 *
 * Um `<select multiple>` nativo resolveria a marcação, mas ocupa altura fixa na
 * página, exige ctrl+clique para somar itens e não cabe numa barra de filtros
 * de uma linha. Aqui a pílula continua do tamanho das outras e a lista abre por
 * cima.
 *
 * Lista vazia significa "todas": é o mesmo que não filtrar, e evita o estado
 * confuso de zero marcadas devolvendo zero apostas.
 */
export function SeletorMultiplo({
  rotuloVazio,
  substantivo,
  opcoes,
  selecionadas,
  onChange,
  contagem,
  className = "",
}: SeletorMultiploProps) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const idLista = useId();

  // A lista abre alinhada à esquerda da pílula. No celular, com a pílula na
  // metade direita da tela, ela saía para fora da borda — de 180 a 405px numa
  // tela de 375. Medida antes de pintar, vira para a direita quando não cabe.
  //
  // Quem é medida é a **pílula**, não a lista: medir a lista obrigava a
  // realinhá-la à esquerda toda vez que fechava, para a medição seguinte não
  // herdar o alinhamento anterior — e esse realinhamento fazia a lista pular
  // de lado no meio da animação de saída. A largura da lista é conhecida
  // (`w-60`, 240px), então a conta sai da posição do gatilho e vale numa
  // passada só.
  const [paraDireita, setParaDireita] = useState(false);
  useLayoutEffect(() => {
    if (!aberto) return;
    const r = caixa.current?.getBoundingClientRect();
    if (!r) return;
    setParaDireita(r.left + LARGURA_DA_LISTA > window.innerWidth - 8);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function foraDaCaixa(ev: MouseEvent) {
      if (caixa.current && !caixa.current.contains(ev.target as Node)) {
        setAberto(false);
      }
    }
    function escapou(ev: KeyboardEvent) {
      if (ev.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", foraDaCaixa);
    document.addEventListener("keydown", escapou);
    return () => {
      document.removeEventListener("mousedown", foraDaCaixa);
      document.removeEventListener("keydown", escapou);
    };
  }, [aberto]);

  function alternar(valor: string) {
    onChange(
      selecionadas.includes(valor)
        ? selecionadas.filter((v) => v !== valor)
        : [...selecionadas, valor]
    );
  }

  const n = selecionadas.length;
  const rotulo =
    n === 0 ? rotuloVazio : n === 1 ? selecionadas[0] : `${n} ${substantivo}`;

  return (
    <div ref={caixa} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={idLista}
        className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer transition-colors ${
          n > 0
            ? "bg-[var(--accent)] text-[var(--sobre-cor)] border-[var(--accent)]"
            : "bg-[var(--bg)] text-[var(--text-2)] border-tinta/[0.06] hover:border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)]"
        }`}
      >
        <span className="max-w-[13rem] truncate">{rotulo}</span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {n > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          aria-label={`Limpar filtro de ${substantivo}`}
          title={`Limpar filtro de ${substantivo}`}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--bg-card)] border border-tinta/[0.12] text-[var(--text-2)] hover:text-[var(--red)] flex items-center justify-center shadow-sm"
        >
          <X className="w-2.5 h-2.5" aria-hidden="true" />
        </button>
      )}

      <AnimatePresence>
        {aberto && (
          <motion.div
            key="lista"
            id={idLista}
            role="group"
            aria-label={rotuloVazio}
            // Desce de onde a pílula está, em vez de aparecer do nada. Sem
            // escala: `w-60` é o número que a conta acima usa, e escalar a
            // lista mudaria a largura medida.
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2, pointerEvents: "none" }}
            transition={{ duration: DURACAO.toque, ease: SAIDA_SUAVE }}
            className={`absolute z-30 mt-2 w-60 max-w-[calc(100vw-1rem)] max-h-72 overflow-y-auto bg-[var(--bg-elevado)] border border-tinta/[0.1] rounded-xl shadow-lg p-1 ${
              paraDireita ? "right-0" : "left-0"
            }`}
          >
            {opcoes.length === 0 ? (
              <p className="text-xs text-[var(--text-3)] px-3 py-2">
                Nada para filtrar nesta aba.
              </p>
            ) : (
              opcoes.map((op) => {
                const marcada = selecionadas.includes(op);
                const qtd = contagem?.get(op);
                return (
                  <label
                    key={op}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text)] hover:bg-[var(--bg-tinted)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => alternar(op)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                        marcada
                          ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--sobre-cor)]"
                          : "border-tinta/[0.18]"
                      }`}
                    >
                      {marcada && <Check className="w-2.5 h-2.5" strokeWidth={3.5} />}
                    </span>
                    <span className="truncate flex-1">{op}</span>
                    {qtd !== undefined && (
                      <span className="font-mono text-[10px] text-[var(--text-3)] shrink-0">
                        {qtd}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
