"use client";

import { Check, Copy, X } from "lucide-react";
import { Dialogo } from "@/components/Dialogo";
import type { BetItem } from "@/lib/types";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { formatarOdd, formatarReais, formatarReaisComSinal } from "@/lib/format";

interface DetalheApostaProps {
  bet: BetItem;
  onFechar: () => void;
  onCopiar: (bet: BetItem) => void;
  copiado: boolean;
  converter: (v: number) => number;
}

/**
 * Detalhe de uma aposta, em diálogo.
 *
 * Mora em arquivo próprio para poder ser carregado só quando alguém clica numa
 * aposta: são cerca de 230 linhas que a maioria das visitas nunca abre, e que
 * antes viajavam no primeiro pacote da página.
 *
 * **Monta só quando há aposta escolhida.** Quem controla entrada e saída é o
 * `AnimatePresence` do pai; aqui dentro não há estado de aberto/fechado, o que
 * simplifica os efeitos: o que roda na montagem é exatamente o que precisa ser
 * desfeito na desmontagem.
 *
 * O invólucro — véu, trava de rolagem, foco preso, Esc e saída — mora em
 * `Dialogo`, que três telas usam. O `AnimatePresence` do pai continua recebendo
 * **um** filho com `key`: a versão antiga passava dois elementos soltos dentro
 * de um fragmento, e era isso que deixava o véu preso no DOM engolindo clique.
 */
export function DetalheAposta({
  bet,
  onFechar,
  onCopiar,
  copiado,
  converter,
}: DetalheApostaProps) {
  return (
    <Dialogo rotulo={`Detalhe da aposta: ${bet.partida}`} onFechar={onFechar}>
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
              bet.resultado === "GREEN"
                ? "bg-[var(--green-soft)] text-[var(--green)]"
                : bet.resultado === "RED"
                  ? "bg-[var(--red-soft)] text-[var(--red)]"
                  : bet.resultado === "VOID"
                    ? "bg-[var(--text-2-soft)] text-[var(--text-2)]"
                    : "bg-[var(--amber-soft)] text-[var(--amber)]"
            }`}
          >
            {bet.resultado}
          </span>
          <span className="text-xs text-[var(--text-3)] font-mono truncate">
            ID: {bet.id}
          </span>
        </div>

        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar detalhes"
          className="p-[5px] rounded-full text-[var(--text-2)] hover:bg-[var(--bg-tinted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Partida / Confronto
          </div>
          <h2
            id="titulo-detalhe-aposta"
            className="text-base font-bold text-[var(--text)] mt-0.5"
          >
            {bet.partida}
          </h2>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Mercado / Tip
          </div>
          <p className="text-sm font-medium text-[var(--text-2)] mt-0.5 bg-[var(--bg-soft)] p-3 rounded-xl border border-black/[0.04]">
            {bet.tip}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--bg)] rounded-xl text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">
              Odd
            </div>
            <div className="font-mono text-base font-bold text-[var(--text)] mt-0.5">
              {formatarOdd(bet.odd)}
            </div>
          </div>

          <div className="p-3 bg-[var(--bg)] rounded-xl text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">
              Valor
            </div>
            <div className="font-mono text-base font-bold text-[var(--text)] mt-0.5">
              {formatarReais(converter(bet.valor))}
            </div>
            <div className="text-[10px] text-[var(--text-3)] mt-0.5">
              {bet.unidades.toFixed(2).replace(".", ",")}u
            </div>
          </div>

          <div className="p-3 bg-[var(--bg)] rounded-xl text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">
              Lucro / Perda
            </div>
            <div
              className={`font-mono text-base font-bold mt-0.5 ${
                bet.resultado === "PENDENTE" || bet.resultado === "VOID"
                  ? "text-[var(--text-3)]"
                  : bet.lucro >= 0
                    ? "text-[var(--green)]"
                    : "text-[var(--red)]"
              }`}
            >
              {/* Mesma regra do card que abriu este modal: converter para a
                    unidade do visitante, e anulada sem lucro a mostrar. Antes o
                    card dizia R$ 62,50 e o modal R$ 125,00 para a mesma aposta. */}
              {bet.resultado === "PENDENTE" || bet.resultado === "VOID"
                ? "—"
                : formatarReaisComSinal(converter(bet.lucro))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-2)] pt-2 gap-2">
          <div className="flex items-center gap-2">
            <span>Esporte:</span>
            <SportBadge sport={bet.esporte} />
          </div>
          <div className="flex items-center gap-2">
            <span>Casa:</span>
            <BookieBadge bookie={bet.casa} />
          </div>
          <span>
            Adm: <strong className="text-[var(--text)]">{bet.tipster}</strong>
          </span>
          <span>
            Data: <strong className="text-[var(--text)]">{bet.data}</strong>
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
        <button
          type="button"
          onClick={() => onCopiar(bet)}
          className="px-4 py-2 bg-[var(--bg)] text-[var(--text)] text-xs font-semibold rounded-full hover:bg-[var(--bg-tinted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all flex items-center gap-1.5"
        >
          {copiado ? (
            <Check className="w-3.5 h-3.5 text-[var(--green)]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copiado ? "Copiado!" : "Copiar tip"}</span>
        </button>

        <button
          type="button"
          onClick={onFechar}
          className="px-5 py-2 bg-[var(--text)] text-white text-xs font-semibold rounded-full hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all"
        >
          Fechar
        </button>
      </div>
    </Dialogo>
  );
}
