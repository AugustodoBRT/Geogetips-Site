import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Target,
  Landmark,
  BarChart3,
  Bot,
} from "lucide-react";
import { getBetsFromTab, USANDO_MOCK } from "@/lib/sheets";
import { computeStatsFromBets, type BetStats } from "@/lib/stats";
import { MOCK_BETS } from "@/lib/data";
import { ABA_TODOS, VALOR_UNIDADE } from "@/lib/constants";
import { formatarInteiro, formatarReaisComSinal } from "@/lib/format";
import { BotaoTelegram, SecaoTelegram } from "@/components/Telegram";
import { TextoQueCai, Revelar, EntradaSequencial } from "@/components/animacoes";
import { CarrosselProfundidade } from "@/components/CarrosselProfundidade";

// Página de captação: renderizada no servidor para que os números apareçam no
// HTML inicial (SEO e preview de link). O prazo acompanha o da API e o da
// leitura da planilha — com 300s aqui, home e painel podiam mostrar totais
// diferentes do mesmo dado por até quatro minutos.
export const revalidate = 60;

async function carregarStats(): Promise<BetStats | null> {
  if (USANDO_MOCK) return computeStatsFromBets(MOCK_BETS);
  try {
    return computeStatsFromBets(await getBetsFromTab(ABA_TODOS));
  } catch {
    // Sem planilha, a home simplesmente não afirma número nenhum.
    return null;
  }
}

const FUNCIONALIDADES = [
  {
    titulo: "Registro automático",
    texto:
      "Cada entrada enviada no canal vira uma linha na planilha automaticamente, com partida, mercado, odd e valor. Sem digitação manual e sem esquecer nenhuma.",
    icone: <Bot className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--accent)]/10 text-[var(--accent)]",
  },
  {
    titulo: "Planilha Sincronizada",
    texto:
      "A planilha no Google Sheets continua viva e é a fonte de tudo que aparece aqui — aberta para conferência linha a linha.",
    icone: <FileSpreadsheet className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--green)]/10 text-[var(--green)]",
  },
  {
    titulo: "Análise por Adm",
    texto:
      "Descubra quem realmente coloca dinheiro no seu bolso e quem dá prejuízo, com acerto, volume e ROI de cada um.",
    icone: <Target className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--amber)]/10 text-[var(--amber)]",
  },
  {
    titulo: "Gestão de Banca",
    texto: `Controle por unidades (1u = R$ ${VALOR_UNIDADE.toFixed(2).replace(".", ",")}), com travas de segurança e limites máximos. Ajuste a unidade para a sua banca e veja o histórico na sua escala.`,
    icone: <Landmark className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--accent)]/10 text-[var(--accent)]",
  },
  {
    titulo: "Estatísticas Completas",
    texto:
      "Lucro por esporte, casa, odds médias e ROI real — mês a mês, incluindo os meses negativos.",
    icone: <BarChart3 className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--green)]/10 text-[var(--green)]",
  },
];

const PASSOS = [
  {
    titulo: "A entrada chega",
    texto:
      "O adm envia a aposta no canal do Telegram, com a casa, o mercado e a odd.",
  },
  {
    titulo: "Entra na planilha",
    texto:
      "Toda entrada é registrada na hora — green, red ou anulada. Nada fica de fora.",
  },
  {
    titulo: "Você confere",
    texto:
      "Os números deste site saem dessa planilha, que fica aberta para consulta a qualquer momento.",
  },
];

export default async function HomePage() {
  const stats = await carregarStats();
  const temNumeros = Boolean(stats && stats.totalBets > 0);

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <EntradaSequencial indice={0}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--accent)]/[0.08] border border-[var(--accent)]/[0.12] rounded-full text-xs font-semibold text-[var(--accent)] mb-7">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Análise · Dados · Apostas · Resultados</span>
          </div>
        </EntradaSequencial>

        {/* Duas linhas separadas: a segunda cai depois e é a que carrega a ênfase */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-[-1.5px] text-[var(--text)] mb-5">
          <TextoQueCai
            texto="Suas apostas merecem"
            atraso={0.3}
            className="block"
          />
          <TextoQueCai
            texto="matemática de verdade."
            atraso={0.75}
            intervalo={0.07}
            className="block italic text-[var(--accent)]"
          />
        </h1>

        <EntradaSequencial indice={0} base={1.5}>
          <p className="text-base sm:text-lg text-[var(--text-2)] leading-relaxed max-w-xl mx-auto mb-9 font-sans">
            O GeogeTips transforma dados brutos em decisões inteligentes. Registre,
            acompanhe e analise cada aposta com a clareza de quem usa números — não achismo.
          </p>
        </EntradaSequencial>

        <EntradaSequencial indice={1} base={1.5}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <BotaoTelegram />
            <Link
              href="/painel"
              className="px-7 py-3 bg-transparent text-[var(--text)] text-sm font-semibold border border-black/15 rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <span>Ver os resultados</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </EntradaSequencial>

        <EntradaSequencial indice={2} base={1.5}>
          <p className="text-xs text-[var(--text-3)] mt-5">
            Entrada gratuita pelo Telegram · resultados abertos na planilha pública
          </p>
        </EntradaSequencial>
      </section>

      {/* Faixa de números — só aparece quando existe dado real para mostrar */}
      {temNumeros && stats && (
        <EntradaSequencial indice={3} base={1.5} className="flex flex-wrap items-center justify-center gap-6 md:gap-10 px-6 pb-16 text-xs text-[var(--text-3)] font-medium">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[var(--text-2)] text-sm">
              {formatarInteiro(stats.totalBets)}
            </span>
            apostas registradas
          </div>
          <div className="w-1 h-1 rounded-full bg-black/15 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[var(--text-2)] text-sm">
              {stats.taxaAcerto.toFixed(1).replace(".", ",")}%
            </span>
            taxa de acerto
          </div>
          <div className="w-1 h-1 rounded-full bg-black/15 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span
              className={`font-mono font-bold text-sm ${
                stats.roi >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              {stats.roi >= 0 ? "+" : ""}
              {stats.roi.toFixed(2).replace(".", ",")}%
            </span>
            de ROI
          </div>
          <div className="w-1 h-1 rounded-full bg-black/15 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[var(--text-2)] text-sm">24/7</span>
            bot automático
          </div>
        </EntradaSequencial>
      )}

      {/* Prévia do painel */}
      <Revelar className="max-w-5xl mx-auto px-6 mb-20">
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-subtle">
          <div className="h-10 bg-[var(--bg-alt)] border-b border-black/[0.07] flex items-center px-4 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-black/20" />
            <div className="ml-4 px-3 py-1 bg-white/70 rounded-md text-[11px] font-mono text-[var(--text-2)] border border-black/[0.04]">
              /painel
            </div>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--bg-soft)]">
            <div className="p-5 bg-white rounded-xl border border-black/[0.06] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
                Lucro Acumulado
              </div>
              <div
                className={`font-serif text-3xl tracking-tight ${
                  (stats?.totalLucro ?? 0) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                }`}
              >
                {temNumeros && stats ? formatarReaisComSinal(stats.totalLucro) : "—"}
              </div>
              <div className="text-xs font-medium text-[var(--text-2)] mt-1.5 flex items-center gap-1">
                {(stats?.totalLucro ?? 0) >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {temNumeros && stats
                    ? `${stats.totalUnidades.toFixed(2).replace(".", ",")}u acumuladas`
                    : "histórico completo"}
                </span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-black/[0.06] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
                Taxa de Acerto
              </div>
              <div className="font-serif text-3xl text-[var(--text)] tracking-tight">
                {temNumeros && stats
                  ? `${stats.taxaAcerto.toFixed(1).replace(".", ",")}%`
                  : "—"}
              </div>
              <div className="text-xs font-medium text-[var(--text-2)] mt-1.5">
                {temNumeros && stats
                  ? `${formatarInteiro(stats.greens)} green · ${formatarInteiro(stats.reds)} red`
                  : "sobre apostas finalizadas"}
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-black/[0.06] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
                ROI
              </div>
              <div
                className={`font-serif text-3xl tracking-tight ${
                  (stats?.roi ?? 0) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                }`}
              >
                {temNumeros && stats
                  ? `${stats.roi >= 0 ? "+" : ""}${stats.roi
                      .toFixed(2)
                      .replace(".", ",")}%`
                  : "—"}
              </div>
              <div className="text-xs font-medium text-[var(--text-2)] mt-1.5">
                {temNumeros && stats
                  ? `odd média ${stats.oddMediaGeral.toFixed(2).replace(".", ",")}`
                  : "lucro sobre o total apostado"}
              </div>
            </div>
          </div>
        </div>
      </Revelar>

      {/* Funcionalidades */}
      <section className="mb-24">
        <CarrosselProfundidade
          itens={FUNCIONALIDADES}
          cabecalho={
            <div className="flex-none">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-2">
                Funcionalidades
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-[var(--text)] tracking-tight leading-tight">
                Tudo que você precisa, <br />
                nada que não precisa.
              </h2>
            </div>
          }
        />
      </section>

      {/* Conversão */}
      <Revelar className="max-w-5xl mx-auto px-6 mb-24">
        <SecaoTelegram />
      </Revelar>

      {/* Como funciona */}
      <section className="bg-white border-y border-black/[0.07] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Revelar>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">
              Como Funciona
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-[var(--text)] tracking-tight mb-12">
              Três passos. Sem complicação.
            </h2>
          </Revelar>

          {/* Um Revelar por passo quebraria o <ol>, que só aceita <li> como
              filho direto. Os três entram juntos, como um bloco. */}
          <Revelar atraso={0.08}>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 list-none p-0 m-0">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo}>
                  <div className="font-serif text-5xl text-[var(--bg-tinted)] leading-none mb-4 tracking-tighter">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text)] mb-2 tracking-tight">
                    {passo.titulo}
                  </h3>
                  <p className="text-[13.5px] text-[var(--text-2)] leading-relaxed">
                    {passo.texto}
                  </p>
                </li>
              ))}
            </ol>
          </Revelar>
        </div>
      </section>
    </div>
  );
}
