"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { SportBadge } from "@/components/SportBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonCorpoAdms } from "@/components/Skeleton";
import { Dialogo } from "@/components/Dialogo";
import { BookieBadge } from "@/components/BookieBadge";
import { BarraDeProgresso } from "@/components/BarraDeProgresso";
import { useBets } from "@/hooks/useBets";
import { useEstadoNaUrl } from "@/hooks/useEstadoNaUrl";
import { AvisoAtraso, SeletorGrupo } from "@/components/SeletorGrupo";
import { ehGrupo, grupoParaEndereco } from "@/lib/grupos";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { formatarInteiro, formatarReaisComSinal, formatarUnidades } from "@/lib/format";
import { useUnidade } from "@/hooks/useUnidade";
import { trechoDaAba } from "@/lib/constants";
import { abaDoEndereco, abaParaEndereco } from "@/lib/endereco";
import type { RecorteDoAdm } from "@/lib/types";

export default function AdmsPage() {
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

  const adms = stats?.tipsters ?? [];
  const { converter } = useUnidade();

  /** Adm cujo detalhe está aberto, se algum. */
  const [aberto, setAberto] = useState<string | null>(null);
  const detalhe = adms.find((a) => a.nome === aberto) ?? null;
  const trecho = trechoDaAba(activeTab);

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
              Performance dos Adms
            </h1>
            {!erro && !isMock && !loading && (
              <span className="px-2.5 py-0.5 bg-[var(--green-soft)] text-[var(--green)] text-xs font-bold rounded-full">
                Ranking
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Assertividade e lucro por unidade {trecho.prefixo}{" "}
            <span className="font-semibold text-[var(--text)]">{trecho.nome}</span>. A
            taxa considera apenas apostas finalizadas.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <SeletorAba
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          onRecarregar={recarregar}
          loading={loading}
          id="seletor-adms"
        />
      </div>

      {isMock && <AvisoMock />}
      <AvisoAtraso grupo={grupo} />
      {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}

      {mostrarEsqueleto ? (
        <SkeletonCorpoAdms />
      ) : erro ? null : adms.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-16 text-center text-[var(--text-3)]">
          <p className="text-sm font-medium">
            Nenhum adm com dados {trecho.prefixo} {trecho.nome}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-entrada">
          {adms.map((adm, index) => {
            const isProfitable = adm.lucroUnidades >= 0;
            const total = adm.totalApostas || 1;
            const fatias = [
              { rotulo: "green", n: adm.greens, cor: "var(--green)" },
              { rotulo: "red", n: adm.reds, cor: "var(--red)" },
              { rotulo: "void", n: adm.voids, cor: "var(--text-3)" },
              { rotulo: "pendente", n: adm.pendentes, cor: "var(--accent)" },
            ].filter((f) => f.n > 0);
            return (
              // A entrada em cascata mora no invólucro, e não no botão.
              //
              // O framer anima `y` escrevendo `transform` no style do elemento,
              // e estilo inline ganha de qualquer classe: com a entrada no
              // próprio botão, o `hover:-translate-y-1` nunca vencia e o card
              // não subia — só a sombra mudava. Em Estatísticas o botão é comum,
              // e era por isso que lá o efeito funcionava e aqui não.
              <motion.div
                key={adm.nome}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.3) }}
              >
                {/* O card inteiro é botão, como os do feed e os de Estatísticas:
                    clicar abre o detalhe. O número do adm sozinho não diz de
                    onde veio, e é o "de onde" que muda a leitura. */}
                <button
                  type="button"
                  onClick={() => setAberto(adm.nome)}
                  aria-label={`Ver o desempenho de ${adm.nome} por casa e por esporte`}
                  className="w-full h-full text-left bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent)] hover:-translate-y-1 hover:shadow-card active:translate-y-0 transition-[transform,box-shadow] duration-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-[var(--text)] tracking-tight">
                          {adm.nome}
                        </span>
                        {/* Primeiro da lista não basta: num mês em que todos
                            perderam, o selo verde ia para quem perdeu menos. */}
                        {index === 0 &&
                          adm.totalApostas >= 3 &&
                          adm.lucroUnidades > 0 && (
                            <span className="px-2 py-0.5 bg-[var(--green-soft)] text-[var(--green)] text-[10.5px] font-bold rounded-full flex items-center gap-1">
                              <Award className="w-3 h-3" /> Top #1
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {adm.esportes.map((sp) => (
                          <SportBadge
                            key={sp}
                            sport={sp}
                            className="scale-90 origin-left"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-xl font-bold ${
                          isProfitable ? "text-[var(--green)]" : "text-[var(--red)]"
                        }`}
                      >
                        {formatarUnidades(adm.lucroUnidades)}
                      </span>
                      <div className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold">
                        Lucro Líquido
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[var(--bg-soft)] p-3 rounded-xl border border-tinta/[0.04] text-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                        Acerto
                      </div>
                      <div className="font-mono text-base font-bold text-[var(--text)] mt-0.5">
                        {adm.taxaAcerto.toFixed(1).replace(".", ",")}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                        Volume
                      </div>
                      <div className="font-mono text-base font-bold text-[var(--text)] mt-0.5">
                        {formatarInteiro(adm.totalApostas)} tips
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                        ROI
                      </div>
                      <div
                        className={`font-mono text-base font-bold mt-0.5 ${
                          adm.roi >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                        }`}
                      >
                        {adm.roi >= 0 ? "+" : ""}
                        {adm.roi.toFixed(2).replace(".", ",")}%
                      </div>
                    </div>
                  </div>

                  {/*
                  Antes daqui saía uma régua de "ponto de equilíbrio": 100 / odd
                  média, marcada sobre a taxa de acerto. A conta só fecha quando
                  toda entrada usa a MESMA stake e a MESMA odd — aqui a stake
                  varia por aposta, então a marca sugeria um limiar que não
                  existe. Quem responde "esse adm está no lucro?" é o ROI, logo
                  acima, que já pesa cada entrada pelo valor apostado.

                  No lugar entrou a composição das tips, que não depende de
                  staking nenhum e explica a taxa de acerto: 0% em 11 tips muda
                  de sentido quando várias ainda estão pendentes.
                */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-3)]">
                      <span>Composição das tips</span>
                      {adm.oddMedia > 0 && (
                        <span className="font-normal">
                          odd média {adm.oddMedia.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>

                    <div
                      className="h-2 bg-[var(--bg-tinted)] rounded-full overflow-hidden flex origin-left animate-surgir-x"
                      role="img"
                      aria-label={`${adm.nome}: ${formatarInteiro(adm.greens)} green, ${formatarInteiro(
                        adm.reds
                      )} red, ${formatarInteiro(adm.voids)} anuladas e ${formatarInteiro(
                        adm.pendentes
                      )} pendentes, de ${formatarInteiro(adm.totalApostas)} tips`}
                    >
                      {fatias.map((f) => (
                        <div
                          key={f.rotulo}
                          className="h-full"
                          style={{ width: `${(f.n / total) * 100}%`, background: f.cor }}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-3)] font-medium">
                      {fatias.map((f) => (
                        <span key={f.rotulo} className="flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: f.cor }}
                            aria-hidden="true"
                          />
                          {formatarInteiro(f.n)} {f.rotulo}
                          {f.n > 1 ? "s" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
      {detalhe && (
        <Dialogo
          key="detalhe-adm"
          rotulo={`Desempenho de ${detalhe.nome} por casa e por esporte`}
          onFechar={() => setAberto(null)}
          largura="max-w-2xl"
        >
          <div className="pb-3 border-b border-tinta/[0.06]">
            <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
              {detalhe.nome}
            </h2>
            <p className="text-xs text-[var(--text-3)]">
              {formatarInteiro(detalhe.totalApostas)}{" "}
              {detalhe.totalApostas === 1 ? "aposta" : "apostas"} {trecho.prefixo}{" "}
              {trecho.nome} · {formatarUnidades(detalhe.lucroUnidades)}
            </p>
          </div>

          {/* Duas listas, mesma pergunta: de onde veio o resultado. Casa
                primeiro porque é a que muda a leitura — casa limita conta boa,
                e concentração numa só é risco que o número total esconde. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Recorte
              titulo="Por casa"
              itens={detalhe.porCasa}
              converter={converter}
              casa
            />
            <Recorte
              titulo="Por esporte"
              itens={detalhe.porEsporte}
              converter={converter}
            />
          </div>

          <button
            type="button"
            onClick={() => setAberto(null)}
            className="w-full py-2 bg-[var(--bg)] hover:bg-[var(--bg-tinted)] text-[var(--text)] text-xs font-semibold rounded-xl transition-colors active:transform-none"
          >
            Fechar
          </button>
        </Dialogo>
      )}

      <SecaoTelegram />
    </div>
  );
}

/** Uma das duas listas do detalhe do adm. */
function Recorte({
  titulo,
  itens,
  converter,
  casa = false,
}: {
  titulo: string;
  itens: RecorteDoAdm[];
  converter: (v: number) => number;
  /** Usa a pílula da casa em vez do selo de esporte. */
  casa?: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
        {titulo}
      </h3>
      {itens.length === 0 ? (
        <p className="text-xs text-[var(--text-3)]">Nada neste período.</p>
      ) : (
        <div className="divide-y divide-tinta/[0.05]">
          {itens.map((i) => (
            <div key={i.nome} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                {casa ? <BookieBadge bookie={i.nome} /> : <SportBadge sport={i.nome} />}
                <div className="text-[10.5px] text-[var(--text-3)] whitespace-nowrap">
                  {formatarInteiro(i.apostas)} tips ·{" "}
                  {i.taxaAcerto.toFixed(1).replace(".", ",")}% acerto · ROI{" "}
                  {i.roi >= 0 ? "+" : ""}
                  {i.roi.toFixed(2).replace(".", ",")}%
                </div>
              </div>
              <span
                className={`font-mono text-xs font-bold shrink-0 ${
                  i.lucro >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                }`}
              >
                {formatarReaisComSinal(converter(i.lucro))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
