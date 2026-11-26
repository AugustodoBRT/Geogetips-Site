"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import { PieChart, BarChart2, Hash, Layers } from "lucide-react";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonCorpoEstatisticas } from "@/components/Skeleton";
import { Dialogo } from "@/components/Dialogo";
import { BarraDeProgresso } from "@/components/BarraDeProgresso";
import { useBets } from "@/hooks/useBets";
import { useEstadoNaUrl } from "@/hooks/useEstadoNaUrl";
import { AvisoAtraso, SeletorGrupo } from "@/components/SeletorGrupo";
import { ehGrupo, grupoParaEndereco } from "@/lib/grupos";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useUnidade } from "@/hooks/useUnidade";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import {
  corDoValor,
  ehZero,
  formatarInteiro,
  formatarPorcentagem,
  formatarReais,
  formatarReaisComSinal,
  percentuaisRedondos,
  formatarTaxa,
} from "@/lib/format";
import { rotuloDaAba, trechoDaAba } from "@/lib/constants";
import { abaDoEndereco, abaParaEndereco } from "@/lib/endereco";
import { textoDasEstatisticas } from "@/texto/estatisticas";
import { textoDasRotas } from "@/texto/rotas";

const RAIO = 48;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export default function EstatisticasPage() {
  const {
    stats,
    tabs,
    activeTab,
    setActiveTab,
    grupo,
    trocarGrupo,
    grupos,
    loading,
    mostrarEsqueleto,
    erro,
    isMock,
    recarregar,
  } = useBets({ onlyStats: true });

  // A aba no endereço: o link de Abril26 abre Abril26, e o Painel chega aqui
  // levando a aba que estava olhando.
  useEstadoNaUrl(
    { aba: abaParaEndereco(activeTab), grupo: grupoParaEndereco(grupo) },
    (lidos) => {
      // O grupo antes da aba: trocar de grupo volta a aba ao mês, e a aba do
      // link tem de vencer essa volta.
      if (ehGrupo(lidos.grupo) && lidos.grupo !== grupo) trocarGrupo(lidos.grupo);
      const aba = abaDoEndereco(lidos.aba);
      if (aba && aba !== activeTab) setActiveTab(aba);
    }
  );

  const { converter } = useUnidade();

  const totalBets = stats?.totalBets ?? 0;
  const greens = stats?.greens ?? 0;
  const reds = stats?.reds ?? 0;
  const pendings = stats?.pendings ?? 0;
  const voids = stats?.voids ?? 0;

  // Denominador seguro para os arcos da rosca, que são desenhados em fração.
  const base = totalBets || 1;

  /**
   * As quatro fatias da rosca em porcentagem inteira, somando 100.
   *
   * Arredondar cada uma por conta própria dava 28 + 57 + 10 + 6 = 101% na
   * legenda, com o total logo ao lado dizendo 1.099 apostas.
   */
  const [pctGreen, pctRed, pctPendente, pctVoid] = percentuaisRedondos([
    greens,
    reds,
    pendings,
    voids,
  ]);

  const sports = stats?.sports ?? [];
  // A conta devolve todas as casas; o card mostra oito, e o diálogo, a lista
  // inteira. O corte é decisão de desenho, não de cálculo.
  const casas = stats?.bookies ?? [];
  const bookies = casas.slice(0, 8);
  const trecho = trechoDaAba(activeTab);

  const T = textoDasEstatisticas();

  /** Qual diálogo de detalhe está aberto, se algum. */
  const [detalhe, setDetalhe] = useState<"esportes" | "casas" | null>(null);

  /**
   * Tinta e borda a partir de uma cor de token.
   *
   * Antes eram `${cor}0F` e `${cor}26` — sufixo de alfa em hexadecimal, que só
   * funciona com cor literal. Com "var(--green)" saía "var(--green)0F", CSS
   * inválido que o navegador descarta: as linhas perdiam o fundo e a borda
   * caía para a cor do texto, um contorno quase preto.
   *
   * A força vem do tema (--forca-tinta, --forca-contorno): 6% some sobre o
   * fundo escuro.
   */
  const tinta = (cor: string) =>
    `color-mix(in srgb, ${cor} var(--forca-tinta), transparent)`;
  const contorno = (cor: string) =>
    `color-mix(in srgb, ${cor} var(--forca-contorno), transparent)`;

  // Escala pelo maior |lucro| do conjunto, em vez de um teto fixo de 600
  const maiorLucroAbs = Math.max(...sports.map((s) => Math.abs(s.lucro)), 1);

  const segmentos = [
    { chave: "green", valor: greens, cor: "var(--green)", offset: 0 },
    { chave: "red", valor: reds, cor: "var(--red)", offset: greens },
    { chave: "pend", valor: pendings, cor: "var(--amber)", offset: greens + reds },
    {
      chave: "void",
      valor: voids,
      cor: "var(--text-3)",
      offset: greens + reds + pendings,
    },
  ];

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
              {textoDasRotas().estatisticas.titulo}
            </h1>
            {!erro && !isMock && !loading && (
              <span className="px-2.5 py-0.5 bg-[var(--green-soft)] text-[var(--green)] text-xs font-bold rounded-full">
                {T.selo}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            {T.escopo(trecho).map((parte, i) =>
              typeof parte === "string" ? (
                parte
              ) : (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: a frase é fixa
                  key={i}
                  className="font-semibold text-[var(--text)]"
                >
                  {parte.forte}
                </span>
              )
            )}
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <SeletorAba
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          onRecarregar={recarregar}
          loading={loading}
          id="seletor-estatisticas"
        />
      </div>

      {isMock && <AvisoMock />}
      <AvisoAtraso grupo={grupo} />
      {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}

      <SeletorUnidade />

      {mostrarEsqueleto ? (
        <SkeletonCorpoEstatisticas />
      ) : erro ? null : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-entrada">
            {/* Donut de distribuição */}
            <div className="lg:col-span-7 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    {T.distribuicao.titulo(rotuloDaAba(activeTab))}
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">
                    {T.distribuicao.descricao(voids > 0)}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--green-soft)] text-[var(--green)] flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
                <div className="w-40 h-40 relative shrink-0">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full -rotate-90"
                    role="img"
                    aria-label={T.distribuicao.aria({
                      greens: formatarInteiro(greens),
                      reds: formatarInteiro(reds),
                      pendentes: formatarInteiro(pendings),
                      anuladas: formatarInteiro(voids),
                      total: formatarInteiro(totalBets),
                    })}
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r={RAIO}
                      fill="none"
                      stroke="var(--bg-tinted)"
                      strokeWidth="12"
                    />
                    {segmentos.map((seg) =>
                      seg.valor > 0 ? (
                        <motion.circle
                          key={seg.chave}
                          cx="60"
                          cy="60"
                          r={RAIO}
                          fill="none"
                          stroke={seg.cor}
                          strokeWidth="12"
                          // Sem strokeLinecap="round": as pontas arredondadas de
                          // três segmentos adjacentes se sobrepunham e distorciam
                          // as fatias pequenas.
                          strokeDasharray={`${(seg.valor / base) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                          strokeDashoffset={`-${(seg.offset / base) * CIRCUNFERENCIA}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        />
                      ) : null
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-serif text-3xl text-[var(--text)] tracking-tight leading-none">
                      <NumeroAnimado value={totalBets} />
                    </span>
                    <span className="text-[10.5px] uppercase tracking-wider text-[var(--text-3)] font-bold mt-1">
                      {T.distribuicao.total}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 w-full sm:w-auto">
                  {[
                    {
                      rotulo: T.distribuicao.legenda.green,
                      n: greens,
                      pct: pctGreen,
                      cor: "var(--green)",
                    },
                    {
                      rotulo: T.distribuicao.legenda.red,
                      n: reds,
                      pct: pctRed,
                      cor: "var(--red)",
                    },
                    {
                      rotulo: T.distribuicao.legenda.pendente,
                      n: pendings,
                      pct: pctPendente,
                      cor: "var(--amber)",
                    },
                    ...(voids > 0
                      ? [
                          {
                            rotulo: T.distribuicao.legenda.void,
                            n: voids,
                            pct: pctVoid,
                            cor: "var(--text-3)",
                          },
                        ]
                      : []),
                  ].map((linha) => (
                    <div
                      key={linha.rotulo}
                      className="p-3 rounded-xl border flex items-center justify-between gap-6"
                      style={{
                        backgroundColor: tinta(linha.cor),
                        borderColor: contorno(linha.cor),
                      }}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: linha.cor }}
                        />
                        <span>{linha.rotulo}</span>
                      </div>
                      <span
                        className="font-mono font-bold text-xs"
                        style={{ color: linha.cor }}
                      >
                        {T.distribuicao.linha(formatarInteiro(linha.n), linha.pct)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Médias de odd — agora calculadas, não digitadas */}
            <div className="lg:col-span-5 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    {T.odds.titulo(rotuloDaAba(activeTab))}
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">{T.odds.descricao}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--text-soft)] text-[var(--text)] flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    titulo: T.odds.green,
                    sub: T.odds.greenSub(greens),
                    valor: stats?.oddMediaGreen ?? 0,
                    cor: "var(--green)",
                  },
                  {
                    titulo: T.odds.red,
                    sub: T.odds.redSub(reds),
                    valor: stats?.oddMediaRed ?? 0,
                    cor: "var(--red)",
                  },
                  {
                    titulo: T.odds.geral,
                    sub: T.odds.geralSub(totalBets),
                    valor: stats?.oddMediaGeral ?? 0,
                    cor: "var(--accent)",
                  },
                ].map((bloco) => (
                  <div
                    key={bloco.titulo}
                    className="p-4 rounded-xl border flex items-center justify-between"
                    style={{
                      backgroundColor: tinta(bloco.cor),
                      borderColor: contorno(bloco.cor),
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold" style={{ color: bloco.cor }}>
                        {bloco.titulo}
                      </div>
                      <div className="text-[11px] text-[var(--text-3)] mt-0.5 font-medium">
                        {bloco.sub}
                      </div>
                    </div>
                    <div
                      className="font-mono text-2xl font-bold"
                      style={{ color: bloco.cor }}
                    >
                      {bloco.valor > 0 ? (
                        <NumeroAnimado
                          value={bloco.valor}
                          format={{
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                        />
                      ) : (
                        T.odds.semValor
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-entrada">
            {/* Os dois cards são botões inteiros, como os do feed: clicar abre o
                detalhe completo. É o mesmo gesto que o visitante já conhece de
                abrir uma aposta.

                `flex flex-col` não é enfeite: botão centraliza o conteúdo na
                vertical quando sobra altura, e sobra sempre que o card ao lado
                é mais alto. O Top Esportes ficava com o conteúdo boiando no
                meio, com vazio em cima e embaixo. */}
            <button
              type="button"
              onClick={() => setDetalhe("esportes")}
              aria-label={T.esportes.aria}
              className={
                "w-full h-full flex flex-col items-stretch text-left bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm space-y-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent)] hover:-translate-y-1 hover:shadow-card active:translate-y-0 transition-[transform,box-shadow] duration-150"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    {T.esportes.titulo}
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">
                    {T.esportes.descricao(trecho)}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {sports.length === 0 ? (
                  <p className="text-xs text-[var(--text-3)]">{T.esportes.vazio}</p>
                ) : (
                  sports.map((sport) => {
                    // A cor do valor e a barra leem o MESMO número que a linha
                    // escreve: o já convertido para a unidade do visitante
                    // (#103). Lendo o cru, um esporte que imprime "R$ 0,00"
                    // numa unidade pequena saía verde, com a barra verde junto.
                    // A largura segue no cru porque ali é proporção entre
                    // esportes, não teste de zero.
                    const lucroExibido = converter(sport.lucro);
                    const zerado = ehZero(lucroExibido);
                    const positivo = lucroExibido > 0;
                    const largura = (Math.abs(sport.lucro) / maiorLucroAbs) * 100;
                    return (
                      <div key={sport.esporte} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold gap-3">
                          <SportBadge sport={sport.esporte} />
                          <span
                            className={`font-mono flex items-baseline gap-2 ${corDoValor(
                              lucroExibido
                            )}`}
                          >
                            {formatarReaisComSinal(lucroExibido)}
                            <span className="text-[10.5px] text-[var(--text-3)] font-medium">
                              {T.esportes.roi(formatarPorcentagem(sport.roi))}
                            </span>
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--bg-tinted)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full origin-left animate-surgir-x ${
                              zerado
                                ? "bg-[var(--text-3)]"
                                : positivo
                                  ? "bg-[var(--green)]"
                                  : "bg-[var(--red)]"
                            }`}
                            style={{ width: `${Math.max(largura, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDetalhe("casas")}
              aria-label={T.casas.aria}
              className={
                "w-full h-full flex flex-col items-stretch text-left bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm space-y-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent)] hover:-translate-y-1 hover:shadow-card active:translate-y-0 transition-[transform,box-shadow] duration-150"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    {T.casas.titulo}
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">{T.casas.descricao}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--text-soft)] text-[var(--text)] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3.5">
                {bookies.length === 0 ? (
                  <p className="text-xs text-[var(--text-3)]">{T.casas.vazio}</p>
                ) : (
                  bookies.map((b) => (
                    <div key={b.casa} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold gap-3">
                        <BookieBadge bookie={b.casa} />
                        <span className="font-mono flex flex-wrap items-baseline justify-end gap-x-2 text-right">
                          <span className={corDoValor(converter(b.lucro))}>
                            {formatarReaisComSinal(converter(b.lucro))}
                          </span>
                          <span className="text-[10.5px] text-[var(--text-3)] font-medium">
                            {T.casas.linha({
                              apostas: b.apostas,
                              roi: formatarPorcentagem(b.roi),
                            })}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--bg-tinted)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--text)] dark:bg-[var(--text-2)] origin-left animate-surgir-x"
                          style={{ width: `${b.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </button>
          </div>
        </>
      )}
      {detalhe === "esportes" && (
        <Dialogo
          key="detalhe-esportes"
          rotulo={T.detalheDosEsportes.rotulo(trecho)}
          onFechar={() => setDetalhe(null)}
          largura="max-w-2xl"
        >
          <div className="pb-3 border-b border-tinta/[0.06]">
            <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
              {T.detalheDosEsportes.titulo}
            </h2>
            <p className="text-xs text-[var(--text-3)]">
              {T.detalheDosEsportes.resumo(sports.length, trecho)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-xs">
              <thead className="text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th scope="col" className="py-2 pr-1.5 sm:pr-3 whitespace-nowrap">
                    {T.detalheDosEsportes.esporte}
                  </th>
                  {/* Duas palavras para a mesma coluna, por largura: o porquê
                      está em `tabela.apostasCurto`, no dicionário. */}
                  <th scope="col" className="py-2 px-1.5 sm:px-3 text-right">
                    <span className="sm:hidden">{T.tabela.apostasCurto}</span>
                    <span className="hidden sm:inline">{T.tabela.apostas}</span>
                  </th>
                  {/* Some no celular: com cinco colunas em 375px a tabela
                      passava da largura do diálogo e o Resultado — o número que
                      a pessoa veio ver — ficava fora da tela, só alcançável
                      arrastando de lado. Acerto e Apostado são os detalhes;
                      ROI e Resultado, o assunto. */}
                  <th
                    scope="col"
                    className="py-2 px-1.5 sm:px-3 text-right hidden sm:table-cell"
                  >
                    {T.detalheDosEsportes.acerto}
                  </th>
                  <th scope="col" className="py-2 px-1.5 sm:px-3 text-right">
                    {T.tabela.roi}
                  </th>
                  <th scope="col" className="py-2 pl-1.5 sm:pl-3 text-right">
                    {T.tabela.resultado}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta/[0.05]">
                {sports.map((s) => (
                  <tr key={s.esporte}>
                    <td className="py-2.5 pr-1.5 sm:pr-3">
                      <SportBadge sport={s.esporte} />
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-3 text-right font-mono text-[var(--text-2)]">
                      {formatarInteiro(s.apostas)}
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-3 text-right font-mono text-[var(--text-2)] hidden sm:table-cell">
                      {formatarTaxa(s.taxaAcerto)}
                    </td>
                    <td
                      className={`py-2.5 px-1.5 sm:px-3 text-right font-mono font-bold ${corDoValor(
                        s.roi
                      )}`}
                    >
                      {formatarPorcentagem(s.roi)}
                    </td>
                    <td
                      className={`py-2.5 pl-1.5 sm:pl-3 text-right font-mono font-bold whitespace-nowrap ${corDoValor(
                        converter(s.lucro)
                      )}`}
                    >
                      {formatarReaisComSinal(converter(s.lucro))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => setDetalhe(null)}
            className="w-full py-2 bg-[var(--bg)] hover:bg-[var(--bg-tinted)] text-[var(--text)] text-xs font-semibold rounded-xl transition-colors active:transform-none"
          >
            {T.tabela.fechar}
          </button>
        </Dialogo>
      )}

      {detalhe === "casas" && (
        <Dialogo
          key="detalhe-casas"
          rotulo={T.detalheDasCasas.rotulo(trecho)}
          onFechar={() => setDetalhe(null)}
          largura="max-w-2xl"
        >
          <div className="pb-3 border-b border-tinta/[0.06]">
            <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
              {T.detalheDasCasas.titulo}
            </h2>
            <p className="text-xs text-[var(--text-3)]">
              {T.detalheDasCasas.resumo(casas.length, trecho)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-xs">
              <thead className="text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th scope="col" className="py-2 pr-1.5 sm:pr-3 whitespace-nowrap">
                    {T.detalheDasCasas.casa}
                  </th>
                  {/* Duas palavras para a mesma coluna, por largura: o porquê
                      está em `tabela.apostasCurto`, no dicionário. */}
                  <th scope="col" className="py-2 px-1.5 sm:px-3 text-right">
                    <span className="sm:hidden">{T.tabela.apostasCurto}</span>
                    <span className="hidden sm:inline">{T.tabela.apostas}</span>
                  </th>
                  <th
                    scope="col"
                    className="py-2 px-1.5 sm:px-3 text-right hidden sm:table-cell"
                  >
                    {T.detalheDasCasas.apostado}
                  </th>
                  <th scope="col" className="py-2 px-1.5 sm:px-3 text-right">
                    {T.tabela.roi}
                  </th>
                  <th scope="col" className="py-2 pl-1.5 sm:pl-3 text-right">
                    {T.tabela.resultado}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta/[0.05]">
                {casas.map((b) => (
                  <tr key={b.casa}>
                    <td className="py-2.5 pr-1.5 sm:pr-3">
                      <BookieBadge bookie={b.casa} />
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-3 text-right font-mono text-[var(--text-2)]">
                      {formatarInteiro(b.apostas)}
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-3 text-right font-mono text-[var(--text-2)] whitespace-nowrap hidden sm:table-cell">
                      {formatarReais(converter(b.apostado))}
                    </td>
                    <td
                      className={`py-2.5 px-1.5 sm:px-3 text-right font-mono font-bold ${corDoValor(
                        b.roi
                      )}`}
                    >
                      {formatarPorcentagem(b.roi)}
                    </td>
                    <td
                      className={`py-2.5 pl-1.5 sm:pl-3 text-right font-mono font-bold whitespace-nowrap ${corDoValor(
                        converter(b.lucro)
                      )}`}
                    >
                      {formatarReaisComSinal(converter(b.lucro))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => setDetalhe(null)}
            className="w-full py-2 bg-[var(--bg)] hover:bg-[var(--bg-tinted)] text-[var(--text)] text-xs font-semibold rounded-xl transition-colors active:transform-none"
          >
            {T.tabela.fechar}
          </button>
        </Dialogo>
      )}

      <SecaoTelegram />
    </div>
  );
}
