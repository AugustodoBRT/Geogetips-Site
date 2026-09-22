"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { SkeletonLinhas } from "@/components/Skeleton";
import { reaisParaUnidades } from "@/lib/constants";
import { paraISO } from "@/lib/date";
import { abaParaEndereco, escreverConsulta } from "@/lib/endereco";
import { grupoParaEndereco, type IdGrupo } from "@/lib/grupos";
import {
  ehZero,
  formatarInteiro,
  formatarReaisComSinal,
  formatarUnidadesSemSinal,
} from "@/lib/format";
import { calcularRisco, type DiaFechado } from "@/lib/risco";
import type { BetItem } from "@/lib/types";

/** "03/09/2026" → "03/09": o ano está no recorte, e o cartão é estreito. */
function curta(data: string): string {
  return data.slice(0, 5);
}

function unidades(reais: number): string {
  return formatarUnidadesSemSinal(reaisParaUnidades(reais));
}

type Tom = "verde" | "vermelho" | "neutro";

/** Pela conta, e não pela posição do cartão: um dia zerado não é verde nem vermelho. */
function tomDoValor(reais: number): Tom {
  if (ehZero(reais)) return "neutro";
  return reais > 0 ? "verde" : "vermelho";
}

const COR: Record<Tom, string> = {
  verde: "text-[var(--green)]",
  vermelho: "text-[var(--red)]",
  neutro: "text-[var(--text)]",
};

function Medida({
  rotulo,
  valor,
  tom = "neutro",
  children,
}: {
  rotulo: string;
  valor: string;
  tom?: Tom;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-soft)] rounded-xl border border-tinta/[0.04] p-3.5 sm:p-4 min-w-0">
      <dt className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)]">
        {rotulo}
      </dt>
      <dd className="mt-1.5 space-y-1 min-w-0">
        <span className={`block font-mono text-base sm:text-lg font-bold ${COR[tom]}`}>
          {valor}
        </span>
        {children && (
          <span className="block text-[11px] text-[var(--text-2)] leading-snug">
            {children}
          </span>
        )}
      </dd>
    </div>
  );
}

/** A data de um dia, levando ao feed de Apostas filtrado nele, no mesmo grupo. */
function LinkDoDia({
  dia,
  aba,
  grupo,
}: {
  dia: DiaFechado;
  aba: string;
  grupo: IdGrupo;
}) {
  const iso = paraISO(dia.data);
  return (
    <Link
      href={`/apostas${escreverConsulta({
        aba: abaParaEndereco(aba),
        grupo: grupoParaEndereco(grupo),
        de: iso,
        ate: iso,
      })}`}
      className="inline-block py-[5px] -my-[5px] font-semibold underline decoration-dotted decoration-tinta/30 underline-offset-2 hover:text-[var(--accent)] hover:decoration-[var(--accent)] transition-colors"
    >
      {dia.data}
    </Link>
  );
}

/**
 * O bloco "Atenção" do Painel (#68, #80).
 *
 * Lucro e ROI dizem aonde o grupo chegou; isto diz como a banca se comportou
 * no caminho, nas fases boas e nas ruins. Segue o recorte da tela (aba e
 * intervalo de datas), como os outros blocos, e não a janela do gráfico: a
 * janela é só do desenho.
 *
 * As contas estão em lib/risco.ts, em reais da planilha; aqui os valores
 * passam para a unidade do visitante com `converter`. Unidades e contagens não
 * mudam com ela.
 */
export function BlocoDeRisco({
  bets,
  converter,
  aba,
  grupo,
  recorte,
  carregando,
}: {
  bets: readonly BetItem[];
  converter: (reais: number) => number;
  /** A aba ativa, para o link de um dia abrir o feed na mesma aba. */
  aba: string;
  /** O grupo na tela, pelo mesmo motivo: do Sigma, o dia abre o feed do Sigma. */
  grupo: IdGrupo;
  /** Como o subtítulo chama o recorte: "Setembro26", "Setembro26 (01/09 a 15/09)". */
  recorte: string;
  carregando: boolean;
}) {
  const risco = useMemo(() => calcularRisco(bets), [bets]);
  const { maiorQueda: queda, maiorAlta: alta } = risco;

  return (
    <section
      aria-labelledby="titulo-risco"
      className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--red-soft)] text-[var(--red)] items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="titulo-risco"
            className="text-base font-bold text-[var(--text)] tracking-tight"
          >
            Atenção
          </h2>
          <p className="text-xs text-[var(--text-3)]">
            Como a banca se comportou durante {recorte}: o tamanho das fases boas e ruins;
            não só aonde o grupo chegou.
          </p>
        </div>
      </div>

      {risco.diasComAposta === 0 ? (
        carregando ? (
          <SkeletonLinhas quantidade={2} altura="h-20" />
        ) : (
          <p className="text-center text-xs text-[var(--text-3)] py-6">
            Sem apostas fechadas neste recorte.
          </p>
        )
      ) : (
        // Em pares, o ruim à esquerda e o bom à direita: maior queda e maior
        // alta, pior e melhor dia, maior red e maior green. Oito cartões fecham
        // a grade de quatro colunas e a de duas, no celular.
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <Medida
            rotulo="Maior queda"
            valor={
              queda.valor > 0 ? formatarReaisComSinal(-converter(queda.valor)) : "Nenhuma"
            }
            tom={queda.valor > 0 ? "vermelho" : "neutro"}
          >
            {queda.valor > 0 && queda.vale
              ? queda.pico
                ? `${unidades(queda.valor)}, de ${curta(queda.pico)} a ${curta(queda.vale)}`
                : `${unidades(queda.valor)}, do início até ${curta(queda.vale)}`
              : "A curva não caiu neste recorte"}
          </Medida>

          <Medida
            rotulo="Maior alta"
            valor={
              alta.valor > 0 ? formatarReaisComSinal(converter(alta.valor)) : "Nenhuma"
            }
            tom={alta.valor > 0 ? "verde" : "neutro"}
          >
            {alta.valor > 0 && alta.pico
              ? alta.vale
                ? `${unidades(alta.valor)}, de ${curta(alta.vale)} a ${curta(alta.pico)}`
                : `${unidades(alta.valor)}, do início até ${curta(alta.pico)}`
              : "A curva não subiu neste recorte"}
          </Medida>

          {risco.piorDia && (
            <Medida
              rotulo="Pior dia"
              valor={formatarReaisComSinal(converter(risco.piorDia.lucro))}
              tom={tomDoValor(risco.piorDia.lucro)}
            >
              <LinkDoDia dia={risco.piorDia} aba={aba} grupo={grupo} /> ·{" "}
              {formatarInteiro(risco.piorDia.apostas)}{" "}
              {risco.piorDia.apostas === 1 ? "aposta" : "apostas"}
            </Medida>
          )}

          {risco.melhorDia && (
            <Medida
              rotulo="Melhor dia"
              valor={formatarReaisComSinal(converter(risco.melhorDia.lucro))}
              tom={tomDoValor(risco.melhorDia.lucro)}
            >
              <LinkDoDia dia={risco.melhorDia} aba={aba} grupo={grupo} /> ·{" "}
              {formatarInteiro(risco.melhorDia.apostas)}{" "}
              {risco.melhorDia.apostas === 1 ? "aposta" : "apostas"}
            </Medida>
          )}

          {/* Sem red (ou sem green) no recorte, o cartão diz "Nenhuma", como a
              maior queda: "+R$ 0,00" se lia como uma aposta que empatou. */}
          <Medida
            rotulo="Maior red"
            valor={
              risco.maiorRed < 0
                ? formatarReaisComSinal(converter(risco.maiorRed))
                : "Nenhuma"
            }
            tom={risco.maiorRed < 0 ? "vermelho" : "neutro"}
          >
            {risco.maiorRed < 0 ? "numa aposta só" : "Nenhuma red neste recorte"}
          </Medida>

          <Medida
            rotulo="Maior green"
            valor={
              risco.maiorGreen > 0
                ? formatarReaisComSinal(converter(risco.maiorGreen))
                : "Nenhuma"
            }
            tom={risco.maiorGreen > 0 ? "verde" : "neutro"}
          >
            {risco.maiorGreen > 0 ? "numa aposta só" : "Nenhuma green neste recorte"}
          </Medida>

          <Medida
            rotulo="Dias no verde"
            valor={`${formatarInteiro(risco.diasNoVerde)} de ${formatarInteiro(risco.diasComAposta)}`}
            tom="verde"
          >
            {formatarInteiro(risco.diasNoVermelho)} no vermelho
            {risco.diasComAposta - risco.diasNoVerde - risco.diasNoVermelho > 0 &&
              `, ${formatarInteiro(
                risco.diasComAposta - risco.diasNoVerde - risco.diasNoVermelho
              )} no zero`}
          </Medida>

          <Medida
            rotulo="Apostas por dia"
            valor={risco.mediaDeApostasPorDia.toFixed(1).replace(".", ",")}
          >
            média em {formatarInteiro(risco.diasComAposta)}{" "}
            {risco.diasComAposta === 1 ? "dia" : "dias"} com aposta
          </Medida>
        </dl>
      )}
    </section>
  );
}
