import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  FileSpreadsheet,
  Target,
  Landmark,
  BarChart3,
  Bot,
} from "lucide-react";
import { getBetsFromTab, USANDO_MOCK } from "@/lib/sheets";
import { computeStatsFromBets, type BetStats } from "@/lib/stats";
import { MOCK_BETS } from "@/lib/data";
import { type PeriodoDoHistorico, periodoDoHistorico } from "@/lib/periodo";
import { ABA_TODOS, TITULO_DA_HOME, VALOR_UNIDADE } from "@/lib/constants";
import {
  corDoValor,
  ehZero,
  formatarInteiro,
  formatarPorcentagem,
  formatarReais,
  formatarReaisComSinal,
  formatarDecimal,
  formatarOdd,
  formatarTaxa,
} from "@/lib/format";
import { BotaoTelegram, SecaoTelegram } from "@/components/Telegram";
import { TextoQueCai, Revelar, EntradaSequencial } from "@/components/animacoes";
import { CarrosselProfundidade } from "@/components/CarrosselProfundidade";
import { textoDaHome } from "@/texto/home";

// Página de captação: renderizada no servidor para que os números apareçam no
// HTML inicial (SEO e preview de link). O prazo acompanha o da API e o da
// leitura da planilha — com 300s aqui, home e painel podiam mostrar totais
// diferentes do mesmo dado por até quatro minutos.
export const revalidate = 60;

/**
 * Os números da home e desde quando eles existem, das mesmas apostas: o
 * período tem de descrever exatamente o histórico que o total conta.
 */
async function carregarResumo(): Promise<{
  stats: BetStats | null;
  periodo: PeriodoDoHistorico | null;
}> {
  try {
    const bets = USANDO_MOCK ? MOCK_BETS : await getBetsFromTab(ABA_TODOS);
    return { stats: computeStatsFromBets(bets), periodo: periodoDoHistorico(bets) };
  } catch {
    // Sem planilha, a home simplesmente não afirma número nenhum.
    return { stats: null, periodo: null };
  }
}

const T = textoDaHome();

/**
 * Os cinco cartões: a ordem, o ícone e a cor, que são desenho.
 *
 * O texto de cada um vem do dicionário, pela chave. Separado assim porque as
 * duas metades têm donos diferentes — a cor do ícone não se traduz, e a frase
 * não se escolhe por paleta.
 */
const FUNCIONALIDADES = [
  {
    ...T.funcionalidades.registro,
    icone: <Bot className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--accent-soft)] text-[var(--accent)]",
  },
  {
    ...T.funcionalidades.planilha,
    icone: <FileSpreadsheet className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--green-soft)] text-[var(--green)]",
  },
  {
    ...T.funcionalidades.adms,
    icone: <Target className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--amber-soft)] text-[var(--amber)]",
  },
  {
    titulo: T.funcionalidades.banca.titulo,
    texto: T.funcionalidades.banca.texto(formatarReais(VALOR_UNIDADE)),
    icone: <Landmark className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--accent-soft)] text-[var(--accent)]",
  },
  {
    ...T.funcionalidades.estatisticas,
    icone: <BarChart3 className="w-6 h-6" strokeWidth={1.75} />,
    corIcone: "bg-[var(--green-soft)] text-[var(--green)]",
  },
];

/** Os três passos, na ordem em que a página os numera. */
const PASSOS = [T.passos.entrada, T.passos.registro, T.passos.conferencia];

export default async function HomePage() {
  const { stats, periodo } = await carregarResumo();
  const temNumeros = Boolean(stats && stats.totalBets > 0);

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <EntradaSequencial indice={0}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-soft)] border border-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] rounded-full text-xs font-semibold text-[var(--accent)] mb-7">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{T.selo}</span>
          </div>
        </EntradaSequencial>

        {/* Duas linhas separadas: a segunda cai depois e é a que carrega a ênfase */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-[-1.5px] text-[var(--text)] mb-5">
          <TextoQueCai texto={TITULO_DA_HOME.primeira} atraso={0.3} className="block" />
          <TextoQueCai
            texto={TITULO_DA_HOME.segunda}
            atraso={0.75}
            intervalo={0.07}
            className="block italic text-[var(--accent)]"
          />
        </h1>

        <EntradaSequencial indice={0} base={1.5}>
          <p className="text-base sm:text-lg text-[var(--text-2)] leading-relaxed max-w-xl mx-auto mb-9 font-sans">
            {T.chamada}
          </p>
        </EntradaSequencial>

        <EntradaSequencial indice={1} base={1.5}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <BotaoTelegram />
            <Link
              href="/painel"
              className="px-7 py-3 bg-transparent text-[var(--text)] text-sm font-semibold border border-tinta/15 rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <span>{T.verResultados}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </EntradaSequencial>

        <EntradaSequencial indice={2} base={1.5}>
          <p className="text-xs text-[var(--text-3)] mt-5">{T.promessa}</p>
        </EntradaSequencial>
      </section>

      {/* Faixa de números — só aparece quando existe dado real para mostrar */}
      {temNumeros && stats && (
        <EntradaSequencial
          indice={3}
          base={1.5}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 px-6 pb-16 text-xs text-[var(--text-3)] font-medium"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[var(--text-2)] text-sm">
              {formatarInteiro(stats.totalBets)}
            </span>
            {periodo ? T.numeros.apostas(periodo.desde) : T.numeros.apostasSemPeriodo}
          </div>
          {periodo && (
            <>
              <div className="w-1 h-1 rounded-full bg-tinta/15 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[var(--text-2)] text-sm">
                  {formatarInteiro(periodo.diasComAposta)}
                </span>
                {T.numeros.dias(periodo.diasComAposta)}
              </div>
            </>
          )}
          <div className="w-1 h-1 rounded-full bg-tinta/15 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[var(--text-2)] text-sm">
              {formatarTaxa(stats.taxaAcerto)}
            </span>
            {T.numeros.acerto}
          </div>
          <div className="w-1 h-1 rounded-full bg-tinta/15 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-sm ${corDoValor(stats.roi)}`}>
              {formatarPorcentagem(stats.roi)}
            </span>
            {T.numeros.roi}
          </div>
          <div className="w-1 h-1 rounded-full bg-tinta/15 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[var(--text-2)] text-sm">
              {T.numeros.bot}
            </span>
            {T.numeros.botRotulo}
          </div>
        </EntradaSequencial>
      )}

      {/* Prévia do painel */}
      <Revelar className="max-w-5xl mx-auto px-6 mb-20">
        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl overflow-hidden shadow-subtle">
          <div className="h-10 bg-[var(--bg-alt)] border-b border-tinta/[0.07] flex items-center px-4 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-tinta/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-tinta/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-tinta/20" />
            <div className="ml-4 px-3 py-1 bg-[color:color-mix(in_srgb,var(--bg-card)_70%,transparent)] rounded-md text-[11px] font-mono text-[var(--text-2)] border border-tinta/[0.04]">
              {T.previa.endereco}
            </div>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--bg-soft)]">
            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-tinta/[0.06] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
                {T.previa.lucro.titulo}
              </div>
              {/* Sem planilha não há alta nem queda: o traço saía em verde, com
                  a seta para cima, como se o grupo estivesse no lucro. */}
              <div
                className={`font-serif text-3xl tracking-tight ${
                  !temNumeros || !stats
                    ? "text-[var(--text-3)]"
                    : corDoValor(stats.totalLucro)
                }`}
              >
                {temNumeros && stats
                  ? formatarReaisComSinal(stats.totalLucro)
                  : T.previa.semValor}
              </div>
              <div className="text-xs font-medium text-[var(--text-2)] mt-1.5 flex items-center gap-1">
                {/* Sem dado o cartão mostra "—", e zero não é ganho: os dois
                    levam o traço, como o Painel e o Histórico já fazem. */}
                {!temNumeros || !stats || ehZero(stats.totalLucro) ? (
                  <Minus className="w-3.5 h-3.5" />
                ) : stats.totalLucro > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {temNumeros && stats
                    ? T.previa.lucro.unidades(formatarDecimal(stats.totalUnidades, 2))
                    : T.previa.lucro.semDado}
                </span>
              </div>
            </div>

            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-tinta/[0.06] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
                {T.previa.acerto.titulo}
              </div>
              <div className="font-serif text-3xl text-[var(--text)] tracking-tight">
                {temNumeros && stats ? formatarTaxa(stats.taxaAcerto) : T.previa.semValor}
              </div>
              <div className="text-xs font-medium text-[var(--text-2)] mt-1.5">
                {temNumeros && stats
                  ? T.previa.acerto.placar({
                      greens: formatarInteiro(stats.greens),
                      reds: formatarInteiro(stats.reds),
                    })
                  : T.previa.acerto.semDado}
              </div>
            </div>

            <div className="p-5 bg-[var(--bg-card)] rounded-xl border border-tinta/[0.06] shadow-sm">
              <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-2">
                {T.previa.roi.titulo}
              </div>
              <div
                className={`font-serif text-3xl tracking-tight ${
                  !temNumeros || !stats
                    ? "text-[var(--text-3)]"
                    : stats.roi > 0
                      ? "text-[var(--green)]"
                      : stats.roi < 0
                        ? "text-[var(--red)]"
                        : "text-[var(--text)]"
                }`}
              >
                {temNumeros && stats ? formatarPorcentagem(stats.roi) : T.previa.semValor}
              </div>
              <div className="text-xs font-medium text-[var(--text-2)] mt-1.5">
                {temNumeros && stats
                  ? T.previa.roi.oddMedia(formatarOdd(stats.oddMediaGeral))
                  : T.previa.roi.semDado}
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
                {T.funcionalidades.selo}
              </div>
              {/* Duas entradas e um <br> entre elas: a quebra é desenho, e
                  cada idioma decide a sua. Ver o dicionário. */}
              <h2 className="font-serif text-3xl md:text-4xl text-[var(--text)] tracking-tight leading-tight">
                {T.funcionalidades.titulo[0]}
                <br />
                {T.funcionalidades.titulo[1]}
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
      <section className="bg-[var(--bg-card)] border-y border-tinta/[0.07] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Revelar>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">
              {T.passos.selo}
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-[var(--text)] tracking-tight mb-12">
              {T.passos.titulo}
            </h2>
          </Revelar>

          {/* Um Revelar por passo quebraria o <ol>, que só aceita <li> como
              filho direto. Os três entram juntos, como um bloco. */}
          <Revelar atraso={0.08}>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 list-none p-0 m-0">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo}>
                  {/* Numeral decorativo: o <ol> já anuncia a ordem, e num cinza
                      tão claro ele não é texto para ser lido. */}
                  <div
                    aria-hidden="true"
                    className="font-serif text-5xl text-[var(--bg-tinted)] leading-none mb-4 tracking-tighter"
                  >
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

          <Revelar atraso={0.12}>
            <Link
              href="/perguntas"
              className="inline-flex items-center gap-2 mt-12 text-sm font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
            >
              <span>{T.passos.link}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Revelar>
        </div>
      </section>
    </div>
  );
}
