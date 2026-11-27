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
  formatarDecimal,
} from "@/lib/format";
import { calcularRisco, type DiaFechado } from "@/lib/risco";
import { textoDoPainel } from "@/texto/painel";
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
  const T = textoDoPainel().risco;
  /** Dias com aposta que fecharam exatamente no zero: nem verde, nem vermelho. */
  const zerados = risco.diasComAposta - risco.diasNoVerde - risco.diasNoVermelho;

  /** A fase da curva: a mesma frase para a queda e para a alta. */
  const fase = (valor: number, de: string | null, ate: string | null, vazio: string) => {
    if (valor <= 0 || !ate) return vazio;
    const medida = unidades(valor);
    return de
      ? T.fase.entre({ valor: medida, de: curta(de), ate: curta(ate) })
      : T.fase.doInicio({ valor: medida, ate: curta(ate) });
  };

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
            {T.titulo}
          </h2>
          <p className="text-xs text-[var(--text-3)]">{T.descricao(recorte)}</p>
        </div>
      </div>

      {risco.diasComAposta === 0 ? (
        carregando ? (
          <SkeletonLinhas quantidade={2} altura="h-20" />
        ) : (
          <p className="text-center text-xs text-[var(--text-3)] py-6">{T.vazio}</p>
        )
      ) : (
        // Em pares, o ruim à esquerda e o bom à direita: maior queda e maior
        // alta, pior e melhor dia, maior red e maior green. Oito cartões fecham
        // a grade de quatro colunas e a de duas, no celular.
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* O tom sai do número CONVERTIDO, que é o que o cartão escreve: na
              unidade do visitante um valor pode imprimir "R$ 0,00", e zero não
              é perda nem ganho (#103). Já o corte entre mostrar o valor e dizer
              "Nenhuma" segue no dado CRU — a curva caiu de verdade, e trocar o
              número por "Nenhuma" porque ele arredondou mentiria sobre o
              recorte. Mesma divisão nos seis cartões abaixo. */}
          <Medida
            rotulo={T.queda.rotulo}
            valor={
              queda.valor > 0 ? formatarReaisComSinal(-converter(queda.valor)) : T.nenhuma
            }
            tom={queda.valor > 0 ? tomDoValor(-converter(queda.valor)) : "neutro"}
          >
            {fase(queda.valor, queda.pico, queda.vale, T.queda.vazio)}
          </Medida>

          <Medida
            rotulo={T.alta.rotulo}
            valor={
              alta.valor > 0 ? formatarReaisComSinal(converter(alta.valor)) : T.nenhuma
            }
            tom={alta.valor > 0 ? tomDoValor(converter(alta.valor)) : "neutro"}
          >
            {fase(alta.valor, alta.vale, alta.pico, T.alta.vazio)}
          </Medida>

          {risco.piorDia && (
            <Medida
              rotulo={T.piorDia}
              valor={formatarReaisComSinal(converter(risco.piorDia.lucro))}
              tom={tomDoValor(converter(risco.piorDia.lucro))}
            >
              <LinkDoDia dia={risco.piorDia} aba={aba} grupo={grupo} />
              {T.apostasDoDia(risco.piorDia.apostas)}
            </Medida>
          )}

          {risco.melhorDia && (
            <Medida
              rotulo={T.melhorDia}
              valor={formatarReaisComSinal(converter(risco.melhorDia.lucro))}
              tom={tomDoValor(converter(risco.melhorDia.lucro))}
            >
              <LinkDoDia dia={risco.melhorDia} aba={aba} grupo={grupo} />
              {T.apostasDoDia(risco.melhorDia.apostas)}
            </Medida>
          )}

          {/* Sem red (ou sem green) no recorte, o cartão diz "Nenhuma", como a
              maior queda: "+R$ 0,00" se lia como uma aposta que empatou. */}
          <Medida
            rotulo={T.red.rotulo}
            valor={
              risco.maiorRed < 0
                ? formatarReaisComSinal(converter(risco.maiorRed))
                : T.nenhuma
            }
            tom={risco.maiorRed < 0 ? tomDoValor(converter(risco.maiorRed)) : "neutro"}
          >
            {risco.maiorRed < 0 ? T.umaAposta : T.red.vazio}
          </Medida>

          <Medida
            rotulo={T.green.rotulo}
            valor={
              risco.maiorGreen > 0
                ? formatarReaisComSinal(converter(risco.maiorGreen))
                : T.nenhuma
            }
            tom={
              risco.maiorGreen > 0 ? tomDoValor(converter(risco.maiorGreen)) : "neutro"
            }
          >
            {risco.maiorGreen > 0 ? T.umaAposta : T.green.vazio}
          </Medida>

          <Medida
            rotulo={T.dias.rotulo}
            valor={T.dias.valor({
              verde: formatarInteiro(risco.diasNoVerde),
              total: formatarInteiro(risco.diasComAposta),
            })}
            tom="verde"
          >
            {T.dias.vermelho(formatarInteiro(risco.diasNoVermelho))}
            {zerados > 0 && T.dias.zero(formatarInteiro(zerados))}
          </Medida>

          <Medida
            rotulo={T.porDia.rotulo}
            valor={formatarDecimal(risco.mediaDeApostasPorDia, 1)}
          >
            {T.porDia.media(risco.diasComAposta)}
          </Medida>
        </dl>
      )}
    </section>
  );
}
