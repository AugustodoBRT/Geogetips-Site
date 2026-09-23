"use client";

import { useMemo } from "react";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  Activity,
  Minus,
} from "lucide-react";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonCorpoHistorico } from "@/components/Skeleton";
import { BarraDeProgresso } from "@/components/BarraDeProgresso";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useResumoMensal } from "@/hooks/useResumoMensal";
import { useEstadoNaUrl } from "@/hooks/useEstadoNaUrl";
import { AvisoAtraso, SeletorGrupo } from "@/components/SeletorGrupo";
import { ehGrupo, grupoParaEndereco } from "@/lib/grupos";
import { useUnidade } from "@/hooks/useUnidade";
import Link from "next/link";
import { abaCurta, abaDoMesAtual } from "@/lib/constants";
import { comAba } from "@/lib/endereco";
import {
  corDoValor,
  ehZero,
  FORMATO_REAIS_COM_SINAL,
  FORMATO_ROI,
  FORMATO_TAXA,
  formatarInteiro,
  formatarPorcentagem,
  formatarOdd,
  formatarReaisComSinal,
  formatarUnidades,
  tamanhoDoValor,
} from "@/lib/format";

export default function HistoricoPage() {
  const {
    meses,
    consolidado,
    loading,
    mostrarEsqueleto,
    erro,
    isMock,
    recarregar,
    grupo,
    trocarGrupo,
    grupos,
  } = useResumoMensal();

  // O grupo no endereço, como nas outras telas: o link do Histórico do Sigma
  // abre o Histórico do Sigma.
  useEstadoNaUrl({ grupo: grupoParaEndereco(grupo) }, (lidos) => {
    if (ehGrupo(lidos.grupo) && lidos.grupo !== grupo) trocarGrupo(lidos.grupo);
  });
  const { converter } = useUnidade();

  // Do mais antigo para o mais recente, que é como se lê um gráfico de evolução
  const cronologico = useMemo(() => [...meses].reverse(), [meses]);

  const maiorAbs = useMemo(
    () => Math.max(...cronologico.map((m) => Math.abs(m.lucro)), 1),
    [cronologico]
  );

  const mesesNegativos = meses.filter((m) => m.lucro < 0).length;

  // O mês corrente ainda está correndo: tem pendentes, e o resultado dele vai
  // mudar. Entra no consolidado — é dado real —, mas não pode aparecer ao lado
  // dos meses fechados como se estivesse fechado.
  const mesAtual = abaDoMesAtual();
  const emAndamento = meses.find((m) => m.aba === mesAtual);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <BarraDeProgresso ativo={loading} />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {grupos.length > 1 && (
            <div className="mb-3">
              <SeletorGrupo grupos={grupos} grupo={grupo} onChange={trocarGrupo} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
              Histórico Mês a Mês
            </h1>
            {!erro && !isMock && !loading && (
              <span className="px-2.5 py-0.5 bg-[var(--green-soft)] text-[var(--green)] text-xs font-bold rounded-full">
                Consolidado
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans max-w-2xl">
            Todos os meses da planilha lado a lado, incluindo os negativos. O ROI é
            recalculado sobre a soma do período — não é a média dos ROIs mensais.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <button
          type="button"
          onClick={recarregar}
          disabled={loading}
          aria-label="Recarregar dados"
          title="Recarregar dados"
          className="p-2 bg-[var(--bg-card)] border border-tinta/[0.12] rounded-full text-[var(--text-2)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isMock && <AvisoMock />}
      <AvisoAtraso grupo={grupo} />
      {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}

      <SeletorUnidade />

      {mostrarEsqueleto ? (
        <SkeletonCorpoHistorico />
      ) : erro ? null : meses.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-16 text-center text-[var(--text-3)]">
          <p className="text-sm font-medium">Nenhum mês encontrado na planilha.</p>
        </div>
      ) : (
        <>
          {/* Consolidado */}
          {consolidado && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-entrada">
              <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[var(--text-3)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Resultado Consolidado
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      ehZero(consolidado.lucro)
                        ? "bg-[var(--text-soft)] text-[var(--text-3)]"
                        : consolidado.lucro > 0
                          ? "bg-[var(--green-soft)] text-[var(--green)]"
                          : "bg-[var(--red-soft)] text-[var(--red)]"
                    }`}
                  >
                    {ehZero(consolidado.lucro) ? (
                      <Minus className="w-4 h-4" />
                    ) : consolidado.lucro > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div
                  className={`font-serif ${tamanhoDoValor(
                    formatarReaisComSinal(converter(consolidado.lucro))
                  )} tracking-tight leading-none ${corDoValor(consolidado.lucro)}`}
                >
                  <NumeroAnimado
                    value={converter(consolidado.lucro)}
                    locales="pt-BR"
                    format={FORMATO_REAIS_COM_SINAL}
                  />
                </div>
                <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
                  {formatarUnidades(consolidado.unidades)} em {meses.length}{" "}
                  {meses.length === 1 ? "mês" : "meses"}
                  {emAndamento && (
                    <span className="text-[var(--amber)]">
                      {" "}
                      · {abaCurta(emAndamento.aba)} em andamento
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[var(--text-3)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    ROI do Período
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className={`font-serif ${tamanhoDoValor(
                    `${consolidado.roi.toFixed(2)}%`
                  )} tracking-tight leading-none ${corDoValor(consolidado.roi)}`}
                >
                  <NumeroAnimado
                    value={consolidado.roi}
                    locales="pt-BR"
                    format={FORMATO_ROI}
                    suffix="%"
                  />
                </div>
                <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
                  Sobre a soma de tudo que foi apostado
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[var(--text-3)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Apostas
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--text-soft)] text-[var(--text)] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className={`font-serif ${tamanhoDoValor(
                    String(consolidado.apostas)
                  )} text-[var(--text)] tracking-tight leading-none`}
                >
                  <NumeroAnimado value={consolidado.apostas} locales="pt-BR" />
                </div>
                <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
                  {formatarInteiro(consolidado.greens)} Green ·{" "}
                  {formatarInteiro(consolidado.reds)} Red
                  {consolidado.voids > 0 &&
                    ` · ${formatarInteiro(consolidado.voids)} Void`}
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[var(--text-3)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Taxa de Acerto
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--green-soft)] text-[var(--green)] flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight leading-none">
                  <NumeroAnimado
                    value={consolidado.taxaAcerto}
                    locales="pt-BR"
                    format={FORMATO_TAXA}
                    suffix="%"
                  />
                </div>
                <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
                  {mesesNegativos === 0
                    ? "Nenhum mês negativo"
                    : `${mesesNegativos} ${
                        mesesNegativos === 1 ? "mês negativo" : "meses negativos"
                      }`}
                </div>
              </div>
            </div>
          )}

          {/* Barras mensais */}
          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                Resultado por mês
              </h2>
              <p className="text-xs text-[var(--text-3)]">
                Barras acima da linha são lucro, abaixo são prejuízo
              </p>
            </div>

            <div className="overflow-x-auto">
              <div
                className="flex items-stretch gap-3 min-w-min"
                role="img"
                aria-label={`Resultado de ${cronologico.length} meses: ${cronologico
                  .map(
                    (m) =>
                      `${abaCurta(m.aba)} ${m.unidades
                        .toFixed(2)
                        .replace(".", ",")} unidades`
                  )
                  .join(", ")}`}
              >
                {/* Altura aplicada direto no estilo, com transição em CSS.
                    Com initial/animate do framer a barra dependia de rAF para
                    chegar no valor certo — e num carregamento com a aba em
                    segundo plano ela congelava no meio: ago/26, o maior mês,
                    chegou a ficar em 0% enquanto abr/26 marcava 76%. Gráfico
                    não pode depender de animação terminar para estar correto. */}
                {cronologico.map((m, i) => {
                  // Zero não é lucro: o mês zerado sai num toco neutro em cima
                  // da linha, como a barra por esporte em /estatisticas. Com
                  // `m.lucro >= 0` ele virava toco verde e rótulo verde.
                  const zerado = ehZero(m.lucro);
                  const positivo = m.lucro > 0;
                  const altura = (Math.abs(m.lucro) / maiorAbs) * 100;
                  const parcial = m.aba === mesAtual;
                  return (
                    <div
                      key={m.aba}
                      className="flex flex-col items-center gap-2 min-w-[64px] flex-1"
                    >
                      {/* metade de cima: lucro */}
                      <div className="h-[90px] w-full flex flex-col justify-end">
                        {(positivo || zerado) && (
                          <div
                            className={`w-full rounded-t-md origin-bottom animate-surgir-y ${zerado ? "bg-[var(--text-3)]" : "bg-[var(--green)]"} ${parcial ? "opacity-55" : ""}`}
                            style={{
                              height: `${Math.max(altura, 2)}%`,
                              animationDelay: `${i * 50}ms`,
                            }}
                          />
                        )}
                      </div>

                      <div className="w-full h-px bg-tinta/[0.12]" />

                      {/* metade de baixo: prejuízo */}
                      <div className="h-[90px] w-full">
                        {!positivo && !zerado && (
                          <div
                            className={`w-full rounded-b-md bg-[var(--red)] origin-top animate-surgir-y ${parcial ? "opacity-55" : ""}`}
                            style={{
                              height: `${Math.max(altura, 2)}%`,
                              animationDelay: `${i * 50}ms`,
                            }}
                          />
                        )}
                      </div>

                      <div className="text-center">
                        <div className="text-[10.5px] font-mono font-bold text-[var(--text-2)] whitespace-nowrap">
                          {abaCurta(m.aba)}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-bold whitespace-nowrap ${corDoValor(
                            m.lucro
                          )}`}
                        >
                          {formatarUnidades(m.unidades)}
                        </div>
                        {parcial && (
                          <div className="text-[9.5px] font-semibold text-[var(--amber)] whitespace-nowrap">
                            parcial
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Resultados por mês: apostas, greens, reds, resultado e ROI
                </caption>
                <thead className="bg-[var(--bg-soft)] border-b border-tinta/[0.06] text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th scope="col" className="py-3 px-4">
                      Mês
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Apostas
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Green
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Red
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Acerto
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Odd méd.
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Resultado
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tinta/[0.05]">
                  {meses.map((m) => (
                    <tr
                      key={m.aba}
                      className="hover:bg-[var(--bg-soft)] transition-colors"
                    >
                      <th
                        scope="row"
                        className="py-3 px-4 font-bold text-[var(--text)] whitespace-nowrap"
                      >
                        {/* O mês escrito como no gráfico logo acima — antes era
                            "set/26" lá e "Setembro26" aqui. E leva ao Painel
                            daquele mês, que é a pergunta natural depois de ver
                            a linha: o que aconteceu nele? */}
                        <Link
                          href={comAba("/painel", m.aba, grupo)}
                          className="inline-flex items-center gap-1.5 py-[5px] -my-[5px] hover:text-[var(--accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                          title={`Abrir o Painel de ${abaCurta(m.aba)}`}
                        >
                          {abaCurta(m.aba)}
                        </Link>
                        {m.aba === mesAtual && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[var(--amber-soft)] text-[var(--amber)] text-[10px] font-semibold align-middle">
                            em andamento
                          </span>
                        )}
                      </th>
                      <td className="py-3 px-3 font-mono text-right text-[var(--text-2)]">
                        {formatarInteiro(m.apostas)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[var(--green)] font-bold">
                        {formatarInteiro(m.greens)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[var(--red)] font-bold">
                        {formatarInteiro(m.reds)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[var(--text-2)]">
                        {m.taxaAcerto.toFixed(1).replace(".", ",")}%
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[var(--text-2)]">
                        {m.oddMedia > 0 ? formatarOdd(m.oddMedia) : "—"}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${corDoValor(
                          m.lucro
                        )}`}
                      >
                        {formatarReaisComSinal(converter(m.lucro))}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${corDoValor(
                          m.roi
                        )}`}
                      >
                        {formatarPorcentagem(m.roi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {consolidado && (
                  <tfoot className="bg-[var(--bg-soft)] border-t-2 border-tinta/[0.1]">
                    <tr>
                      <th scope="row" className="py-3 px-4 font-bold text-[var(--text)]">
                        Total
                      </th>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[var(--text)]">
                        {formatarInteiro(consolidado.apostas)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[var(--green)]">
                        {formatarInteiro(consolidado.greens)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[var(--red)]">
                        {formatarInteiro(consolidado.reds)}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[var(--text)]">
                        {consolidado.taxaAcerto.toFixed(1).replace(".", ",")}%
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[var(--text)]">
                        {consolidado.oddMedia > 0
                          ? formatarOdd(consolidado.oddMedia)
                          : "—"}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${corDoValor(
                          consolidado.lucro
                        )}`}
                      >
                        {formatarReaisComSinal(converter(consolidado.lucro))}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${corDoValor(
                          consolidado.roi
                        )}`}
                      >
                        {formatarPorcentagem(consolidado.roi)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      <SecaoTelegram />
    </div>
  );
}
