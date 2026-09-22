"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { SkeletonLinhas } from "@/components/Skeleton";
import { timestampDoISO } from "@/lib/date";
import { abaParaEndereco, escreverConsulta } from "@/lib/endereco";
import { formatarInteiro, formatarReaisComSinal } from "@/lib/format";
import {
  compacto,
  type DiaDoCalendario,
  type Mes,
  mesDaAba,
  mesesComAposta,
  mesmoMes,
  montarMes,
  nomeDoMes,
} from "@/lib/calendario";
import type { BetItem } from "@/lib/types";

const SEMANA = [
  { curto: "Dom", nome: "domingo" },
  { curto: "Seg", nome: "segunda-feira" },
  { curto: "Ter", nome: "terça-feira" },
  { curto: "Qua", nome: "quarta-feira" },
  { curto: "Qui", nome: "quinta-feira" },
  { curto: "Sex", nome: "sexta-feira" },
  { curto: "Sáb", nome: "sábado" },
];

/** Cor da célula pelo resultado do dia. Os pares `-soft` já passam no contraste. */
function tomDoDia(dia: DiaDoCalendario, fora: boolean): string {
  if (fora || dia.futuro || dia.apostas === 0)
    return "border-tinta/[0.06] text-[var(--text-3)]";
  if (dia.lucro > 0)
    return "bg-[var(--green-soft)] border-transparent text-[var(--green)] hover:border-[color:color-mix(in_srgb,var(--green)_45%,transparent)]";
  if (dia.lucro < 0)
    return "bg-[var(--red-soft)] border-transparent text-[var(--red)] hover:border-[color:color-mix(in_srgb,var(--red)_45%,transparent)]";
  return "bg-[var(--bg-soft)] border-transparent text-[var(--text-2)] hover:border-tinta/[0.15]";
}

/**
 * O calendário de lucro por dia (#67).
 *
 * Mostra o mês inteiro de uma vez, com os dias ruins à vista: é a leitura de
 * consistência que a curva sozinha não dá. Cada dia com aposta leva ao feed
 * filtrado nele.
 *
 * Recebe as apostas da aba inteira, e não só as do intervalo: o calendário é
 * sempre o mês cheio, e o intervalo do Painel aparece como dias sem cor.
 *
 * Numa aba de mês, abre no próprio mês; no agregado, no mais recente, com setas
 * para voltar. A grade só é desenhada depois que os dados chegam: "hoje" é
 * calculado no relógio, e desenhar no servidor arriscava discordar do
 * navegador na virada do dia.
 */
export function CalendarioDeLucro({
  bets,
  aba,
  de,
  ate,
  converter,
  carregando,
}: {
  bets: readonly BetItem[];
  aba: string;
  de: string;
  ate: string;
  converter: (reais: number) => number;
  carregando: boolean;
}) {
  const meses = useMemo(() => mesesComAposta(bets), [bets]);
  const [escolhido, setEscolhido] = useState<Mes | null>(null);

  // A aba de um mês pode trazer aposta com data de outro (lançada na virada).
  // Ela abre no próprio mês quando ele tem aposta, e senão no mais recente.
  const doTab = mesDaAba(aba);
  const padrao = meses.find((m) => mesmoMes(m, doTab)) ?? meses[meses.length - 1] ?? null;
  const atual = meses.find((m) => mesmoMes(m, escolhido)) ?? padrao;
  const indice = atual ? meses.findIndex((m) => mesmoMes(m, atual)) : -1;

  const mes = useMemo(() => (atual ? montarMes(bets, atual) : null), [bets, atual]);

  const deTs = timestampDoISO(de);
  const ateTs = timestampDoISO(ate);
  const foraDoPeriodo = (dia: DiaDoCalendario) => {
    const ts = timestampDoISO(dia.iso);
    return Boolean((deTs && ts < deTs) || (ateTs && ts > ateTs));
  };

  return (
    <section
      aria-labelledby="titulo-calendario"
      className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="titulo-calendario"
              className="text-base font-bold text-[var(--text)] tracking-tight"
            >
              Lucro por dia
            </h2>
            <p className="text-xs text-[var(--text-3)]">
              Cada dia do mês, com os ruins à vista. Toque num dia para ver as apostas
              dele.
            </p>
          </div>
        </div>

        {mes && (
          <div className="flex items-center gap-1">
            {meses.length > 1 && (
              <button
                type="button"
                onClick={() => setEscolhido(meses[indice - 1])}
                disabled={indice <= 0}
                aria-label="Mês anterior"
                className="p-1.5 min-h-[28px] min-w-[28px] rounded-full text-[var(--text-2)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <span
              aria-live="polite"
              // Largura fixa só com as setas: sem ela, trocar de mês com nome mais
              // curto puxava a seta de baixo do dedo.
              className={`px-1 text-sm font-bold text-[var(--text)] first-letter:uppercase ${
                meses.length > 1 ? "min-w-[9.5rem] text-center" : ""
              }`}
            >
              {nomeDoMes(mes)}
            </span>
            {meses.length > 1 && (
              <button
                type="button"
                onClick={() => setEscolhido(meses[indice + 1])}
                disabled={indice >= meses.length - 1}
                aria-label="Próximo mês"
                className="p-1.5 min-h-[28px] min-w-[28px] rounded-full text-[var(--text-2)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {!mes ? (
        carregando ? (
          <SkeletonLinhas quantidade={3} altura="h-16" />
        ) : (
          <p className="text-center text-xs text-[var(--text-3)] py-6">
            Sem apostas com data nesta aba.
          </p>
        )
      ) : (
        <>
          {/* Tabela, e não grade de divs: é o que dá a quem usa leitor de tela
              o dia da semana de cada célula, andando pelas colunas. */}
          <table className="w-full table-fixed border-separate border-spacing-1 sm:border-spacing-1.5">
            <caption className="sr-only">Lucro por dia em {nomeDoMes(mes)}</caption>
            <thead>
              <tr>
                {SEMANA.map((d) => (
                  <th
                    key={d.curto}
                    scope="col"
                    abbr={d.nome}
                    className="pb-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)]"
                  >
                    {d.curto}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mes.semanas.map((semana) => (
                <tr key={semana.find((d) => d)?.iso}>
                  {semana.map((dia, i) => {
                    if (!dia) {
                      // biome-ignore lint/suspicious/noArrayIndexKey: casa vazia de outro mês; só a posição a distingue.
                      return <td key={`vazio-${i}`} />;
                    }
                    const fora = foraDoPeriodo(dia);
                    const clicavel = dia.apostas > 0 && !dia.futuro;
                    const tom = tomDoDia(dia, fora);
                    const conteudo = (
                      <>
                        <span
                          className={`block text-[11px] font-bold ${
                            clicavel && !fora ? "text-[var(--text-2)]" : ""
                          }`}
                        >
                          {dia.dia}
                        </span>
                        {clicavel && (
                          <>
                            <span className="block font-mono text-[10.5px] sm:text-xs font-bold mt-0.5 truncate">
                              {compacto(converter(dia.lucro))}
                            </span>
                            <span className="hidden sm:block text-[10px] text-[var(--text-2)] truncate">
                              {formatarInteiro(dia.apostas)}{" "}
                              {dia.apostas === 1 ? "aposta" : "apostas"}
                            </span>
                          </>
                        )}
                      </>
                    );
                    const classe = `block h-full min-h-[48px] sm:min-h-[68px] rounded-lg border px-1.5 py-1 sm:px-2 sm:py-1.5 text-left transition-colors ${tom} ${
                      dia.hoje ? "ring-2 ring-[var(--accent)]" : ""
                    }`;
                    return (
                      <td
                        key={dia.iso}
                        className="h-px p-0 align-top"
                        data-dia={dia.iso}
                        data-fora={fora || undefined}
                      >
                        {clicavel ? (
                          <Link
                            href={`/apostas${escreverConsulta({
                              aba: abaParaEndereco(aba),
                              de: dia.iso,
                              ate: dia.iso,
                            })}`}
                            aria-label={`${dia.data}: ${formatarReaisComSinal(
                              converter(dia.lucro)
                            )} em ${formatarInteiro(dia.apostas)} ${
                              dia.apostas === 1 ? "aposta" : "apostas"
                            }${fora ? ", fora do período escolhido" : ""}`}
                            className={`${classe} focus-visible:ring-2 focus-visible:ring-[var(--accent)]`}
                          >
                            {conteudo}
                          </Link>
                        ) : (
                          <div className={classe}>
                            {conteudo}
                            {dia.hoje && <span className="sr-only">, hoje</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-[var(--text-2)]">
            Total de {nomeDoMes(mes)}:{" "}
            <strong
              className={mes.lucro >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}
            >
              {formatarReaisComSinal(converter(mes.lucro))}
            </strong>{" "}
            · {formatarInteiro(mes.apostas)} {mes.apostas === 1 ? "aposta" : "apostas"} em{" "}
            {formatarInteiro(mes.diasComAposta)}{" "}
            {mes.diasComAposta === 1 ? "dia" : "dias"}
            {(de || ate) && ". Os dias fora do período escolhido aparecem sem cor"}.
          </p>
        </>
      )}
    </section>
  );
}
