"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import type { BetItem, BetResult } from "@/lib/types";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonLinhas } from "@/components/Skeleton";
import { BarraDeProgresso } from "@/components/BarraDeProgresso";
import { useBets } from "@/hooks/useBets";
import { useEstadoNaUrl } from "@/hooks/useEstadoNaUrl";
import { AvisoAtraso, SeletorGrupo } from "@/components/SeletorGrupo";
import { ehGrupo, grupoDoId, grupoParaEndereco } from "@/lib/grupos";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useUnidade } from "@/hooks/useUnidade";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import { paraISO, parseDateTimestamp, rotuloDoPeriodo, timestampDoISO } from "@/lib/date";
import { SeletorMultiplo } from "@/components/SeletorMultiplo";
import { FiltroPeriodo } from "@/components/FiltroPeriodo";
import { calcularRoi, taxaDeAcerto } from "@/lib/stats";
import { agruparPorDia, diasAbertosDeSaida } from "@/lib/dias";
import { normalizarTexto } from "@/lib/texto";
import { trechoDaAba, VALOR_UNIDADE } from "@/lib/constants";
import { apostasParaCsv, nomeDoArquivo } from "@/lib/csv";
import {
  abaDoEndereco,
  abaParaEndereco,
  escolher,
  lerData,
  lerLista,
} from "@/lib/endereco";
import {
  corDoValor,
  ehZero,
  FORMATO_REAIS_COM_SINAL,
  FORMATO_ROI,
  FORMATO_TAXA,
  formatarInteiro,
  formatarOdd,
  formatarOddExata,
  formatarReais,
  formatarReaisComSinal,
} from "@/lib/format";

/**
 * Quantas apostas a tela desenha de saída.
 *
 * Sem limite, Abril26 punha 2.452 linhas na tela de uma vez: 44.753 nós no DOM
 * e 665.421 px de altura, cerca de 800 telas de rolagem. Desenhar só uma parte
 * derruba isso para a ordem de 2 mil nós e é o que devolve a fluidez à busca.
 *
 * Nos cartões o limite é por dia: os dias mais recentes abrem até somar isto, e
 * os anteriores aparecem recolhidos. Na tabela, que não tem dias, é por bloco,
 * com "Mostrar mais" no fim.
 */
const APOSTAS_POR_BLOCO = 100;

/**
 * Quais dias do feed estão abertos, antes das escolhas feitas dia a dia.
 *
 * - `automatica`: os mais recentes, até somar {@link APOSTAS_POR_BLOCO}.
 * - `todos` e `nenhum`: o que Expandir tudo e Recolher tudo pedem.
 */
type Abertura = "automatica" | "todos" | "nenhum";

/**
 * O detalhe da aposta só desce quando alguém abre uma.
 *
 * São cerca de 230 linhas de diálogo que a maior parte das visitas nunca vê —
 * quem entra para conferir o resultado do dia rola o feed e sai. Fora do
 * pacote inicial, a primeira pintura da tela chega antes.
 *
 * `ssr: false` porque o diálogo nunca existe na primeira pintura: ele depende
 * de um clique, e renderizá-lo no servidor seria trabalho jogado fora.
 */
const DetalheAposta = dynamic(
  () => import("@/components/DetalheAposta").then((m) => m.DetalheAposta),
  { ssr: false }
);

export default function ApostasPage() {
  const {
    bets,
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
  } = useBets();

  const { converter } = useUnidade();

  // `search` é o que está digitado; `buscaAplicada` é o que de fato filtra.
  // Sem essa separação, cada tecla refiltrava tudo e remontava a lista inteira
  // — medi entre 640 e 1.199 ms de interface travada por caractere.
  const [search, setSearch] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | BetResult>("TODAS");
  // Listas vazias = sem filtro. Ver SeletorMultiplo para o porquê.
  const [sportsFilter, setSportsFilter] = useState<string[]>([]);
  const [bookiesFilter, setBookiesFilter] = useState<string[]>([]);
  const [admsFilter, setAdmsFilter] = useState<string[]>([]);
  // Intervalo em "YYYY-MM-DD"; string vazia deixa o lado em aberto.
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [oddRangeFilter, setOddRangeFilter] = useState<
    "TODAS" | "BAIXA" | "MEDIA" | "ALTA"
  >("TODAS");

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [visiveis, setVisiveis] = useState(APOSTAS_POR_BLOCO);
  const [abertura, setAbertura] = useState<Abertura>("automatica");
  // O que o visitante abriu ou fechou à mão, dia a dia. Guarda a decisão, e não
  // um "inverter": o padrão de um dia muda quando o filtro muda, e um inverter
  // guardado passaria a fechar o dia que a pessoa tinha aberto.
  const [escolhas, setEscolhas] = useState<ReadonlyMap<string, boolean>>(new Map());
  const [selectedBet, setSelectedBet] = useState<BetItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setBuscaAplicada(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  // A aba que chegou pelo endereço, junto com o recorte. Ver o efeito abaixo.
  const abaDoLink = useRef<string | null>(null);

  // Trocar de aba zera os recortes presos ao mês anterior: as datas não
  // existem na aba nova e as casas/esportes podem não existir também.
  useEffect(() => {
    // Menos quando a aba veio do endereço: aí o recorte veio com ela, e zerar
    // apagaria justamente o filtro que a pessoa abriu pelo link.
    if (abaDoLink.current === activeTab) {
      abaDoLink.current = null;
      return;
    }
    setDe("");
    setAte("");
    setSportsFilter([]);
    setBookiesFilter([]);
    setAdmsFilter([]);
    setAbertura("automatica");
    setEscolhas(new Map());
  }, [activeTab]);

  // O recorte vai para o endereço, e volta dele ao abrir: "voltar" do navegador
  // devolve a tela como estava, e o link compartilhado abre o mesmo recorte.
  useEstadoNaUrl(
    {
      aba: abaParaEndereco(activeTab),
      grupo: grupoParaEndereco(grupo),
      q: buscaAplicada,
      resultado: statusFilter === "TODAS" ? "" : statusFilter.toLowerCase(),
      esporte: sportsFilter.join(","),
      casa: bookiesFilter.join(","),
      adm: admsFilter.join(","),
      de,
      ate,
      odd: oddRangeFilter === "TODAS" ? "" : oddRangeFilter.toLowerCase(),
      vista: viewMode === "table" ? "tabela" : "",
    },
    (lidos) => {
      // O grupo antes da aba: trocar de grupo volta a aba ao mês, e a aba do
      // link tem de vencer essa volta.
      if (ehGrupo(lidos.grupo) && lidos.grupo !== grupo) trocarGrupo(lidos.grupo);
      const aba = abaDoEndereco(lidos.aba);
      if (aba && aba !== activeTab) {
        abaDoLink.current = aba;
        setActiveTab(aba);
      }
      if (lidos.q) {
        setSearch(lidos.q);
        setBuscaAplicada(lidos.q);
      }
      const resultado = escolher(lidos.resultado?.toUpperCase(), [
        "GREEN",
        "RED",
        "VOID",
        "PENDENTE",
      ] as const);
      if (resultado) setStatusFilter(resultado);
      setSportsFilter(lerLista(lidos.esporte));
      setBookiesFilter(lerLista(lidos.casa));
      setAdmsFilter(lerLista(lidos.adm));
      setDe(lerData(lidos.de));
      setAte(lerData(lidos.ate));
      const odd = escolher(lidos.odd?.toUpperCase(), ["BAIXA", "MEDIA", "ALTA"] as const);
      if (odd) setOddRangeFilter(odd);
      if (lidos.vista === "tabela") setViewMode("table");
    }
  );

  // Listas de filtro em ordem alfabética, para o usuário achar o item
  const sports = useMemo(
    () =>
      Array.from(new Set(bets.map((b) => b.esporte)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [bets]
  );

  const bookies = useMemo(
    () =>
      Array.from(new Set(bets.map((b) => b.casa)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [bets]
  );

  // O campo interno se chama `tipster` porque espelha a coluna da planilha. Na
  // tela é "adm", e é assim que o grupo fala.
  const adms = useMemo(
    () =>
      Array.from(new Set(bets.map((b) => b.tipster)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [bets]
  );

  const availableDays = useMemo(() => {
    const dates = Array.from(new Set(bets.map((b) => b.data))).filter(
      (d) => d && d !== "—"
    );
    dates.sort((a, b) => parseDateTimestamp(b) - parseDateTimestamp(a));
    return dates;
  }, [bets]);

  // Extremos da aba, para o calendário não abrir em dia sem aposta nenhuma.
  const limitesDeData = useMemo(() => {
    if (availableDays.length === 0) return { min: undefined, max: undefined };
    return {
      min: paraISO(availableDays[availableDays.length - 1]) || undefined,
      max: paraISO(availableDays[0]) || undefined,
    };
  }, [availableDays]);

  // Um Map em vez de um filter por opção: com 99 casas o segundo caminho
  // varria a lista inteira uma vez por linha do menu.
  const contagemPorEsporte = useMemo(() => {
    const m = new Map<string, number>();
    bets.forEach((b) => {
      if (b.esporte) m.set(b.esporte, (m.get(b.esporte) ?? 0) + 1);
    });
    return m;
  }, [bets]);

  const contagemPorCasa = useMemo(() => {
    const m = new Map<string, number>();
    bets.forEach((b) => {
      if (b.casa) m.set(b.casa, (m.get(b.casa) ?? 0) + 1);
    });
    return m;
  }, [bets]);

  const contagemPorAdm = useMemo(() => {
    const m = new Map<string, number>();
    bets.forEach((b) => {
      if (b.tipster) m.set(b.tipster, (m.get(b.tipster) ?? 0) + 1);
    });
    return m;
  }, [bets]);

  /**
   * O texto procurável de cada aposta, sem acento e em minúsculas.
   *
   * A busca comparava os campos crus: "Milão" achava 10 apostas e "milao"
   * achava 33, porque a planilha grafa o mesmo time das duas formas — e nenhuma
   * das duas buscas mostrava as 43. Normalizar dentro do filtro resolveria, mas
   * refaria a conta em até 7.858 apostas a cada tecla; aqui é uma vez por aba.
   */
  const indiceDeBusca = useMemo(() => {
    const indice = new Map<string, string>();
    for (const bet of bets) {
      indice.set(
        bet.id,
        normalizarTexto(`${bet.partida} ${bet.tip} ${bet.casa} ${bet.tipster}`)
      );
    }
    return indice;
  }, [bets]);

  const filteredBets = useMemo(() => {
    const termo = normalizarTexto(buscaAplicada);
    const deTs = timestampDoISO(de);
    const ateTs = timestampDoISO(ate);
    return bets.filter((bet) => {
      const matchesSearch =
        termo === "" || (indiceDeBusca.get(bet.id) ?? "").includes(termo);

      const matchesStatus = statusFilter === "TODAS" || bet.resultado === statusFilter;
      const matchesSport =
        sportsFilter.length === 0 || sportsFilter.includes(bet.esporte);
      const matchesBookie =
        bookiesFilter.length === 0 || bookiesFilter.includes(bet.casa);
      const matchesAdm = admsFilter.length === 0 || admsFilter.includes(bet.tipster);

      // Intervalo fechado dos dois lados quando ambos estão preenchidos.
      let matchesDay = true;
      if (deTs || ateTs) {
        const ts = parseDateTimestamp(bet.data);
        if (ts === 0) matchesDay = false;
        else if (deTs && ts < deTs) matchesDay = false;
        else if (ateTs && ts > ateTs) matchesDay = false;
      }

      let matchesOdd = true;
      if (oddRangeFilter === "BAIXA") matchesOdd = bet.odd < 1.8;
      else if (oddRangeFilter === "MEDIA") matchesOdd = bet.odd >= 1.8 && bet.odd <= 3.0;
      else if (oddRangeFilter === "ALTA") matchesOdd = bet.odd > 3.0;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSport &&
        matchesBookie &&
        matchesAdm &&
        matchesOdd &&
        matchesDay
      );
    });
  }, [
    bets,
    indiceDeBusca,
    buscaAplicada,
    statusFilter,
    sportsFilter,
    bookiesFilter,
    admsFilter,
    de,
    ate,
    oddRangeFilter,
  ]);

  const resumo = useMemo(() => {
    const greens = filteredBets.filter((b) => b.resultado === "GREEN").length;
    const reds = filteredBets.filter((b) => b.resultado === "RED").length;
    const pendentes = filteredBets.filter((b) => b.resultado === "PENDENTE").length;
    const voids = filteredBets.filter((b) => b.resultado === "VOID").length;
    const lucro = converter(filteredBets.reduce((acc, b) => acc + b.lucro, 0));
    const odd =
      filteredBets.length > 0
        ? filteredBets.reduce((acc, b) => acc + b.odd, 0) / filteredBets.length
        : 0;
    return {
      greens,
      reds,
      pendentes,
      voids,
      lucro,
      odd,
      taxa: taxaDeAcerto(greens, reds),
      // razão: independe da unidade escolhida
      roi: calcularRoi(filteredBets),
    };
  }, [filteredBets, converter]);

  // Volta ao primeiro bloco sempre que o recorte muda, senão o visitante
  // continuaria vendo 500 linhas depois de restringir o filtro.
  useEffect(() => {
    setVisiveis(APOSTAS_POR_BLOCO);
  }, [
    buscaAplicada,
    statusFilter,
    sportsFilter,
    bookiesFilter,
    admsFilter,
    de,
    ate,
    oddRangeFilter,
    activeTab,
  ]);

  /**
   * O que de fato vai para a tela. Os totais do resumo continuam saindo de
   * `filteredBets` — o recorte é do desenho, não da conta.
   */
  const betsVisiveis = useMemo(
    () => filteredBets.slice(0, visiveis),
    [filteredBets, visiveis]
  );
  const restantes = filteredBets.length - betsVisiveis.length;

  /** Frase curta do recorte de data, para o subtítulo dizer o que está na tela. */
  const periodo = rotuloDoPeriodo(de, ate);

  const trecho = trechoDaAba(activeTab);

  // O feed em dias, sobre tudo o que o filtro deixa passar — e não só sobre o
  // que já está desenhado. Antes o último dia da tela podia aparecer com metade
  // da contagem até alguém clicar em "Mostrar mais"; com o dia recolhível, o
  // cabeçalho é o que fica à vista, e tem de falar do dia inteiro. A ordem e o
  // porquê de não reordenar estão em lib/dias.ts.
  const dias = useMemo(() => agruparPorDia(filteredBets), [filteredBets]);
  const abertosDeSaida = useMemo(
    () => diasAbertosDeSaida(dias, APOSTAS_POR_BLOCO),
    [dias]
  );

  const estaAberto = useCallback(
    (data: string) =>
      escolhas.get(data) ??
      (abertura === "todos" || (abertura === "automatica" && abertosDeSaida.has(data))),
    [escolhas, abertura, abertosDeSaida]
  );

  const todosAbertos = dias.every((d) => estaAberto(d.data));
  const todosFechados = dias.every((d) => !estaAberto(d.data));

  function alternarDia(data: string) {
    const abrir = !estaAberto(data);
    setEscolhas((anteriores) => new Map(anteriores).set(data, abrir));
  }

  // Tudo ou nada apaga as escolhas de dia: "recolher tudo" que deixasse aberto
  // o dia que a pessoa abriu à mão não estaria recolhendo tudo.
  function abrirTodos(abrir: boolean) {
    setAbertura(abrir ? "todos" : "nenhum");
    setEscolhas(new Map());
  }

  // Um botão só, que oferece o contrário do último "tudo": depois de recolher
  // tudo, expandir; depois de expandir, recolher. Abrir ou fechar dias à mão
  // não troca a oferta — a não ser que deixe o botão sem efeito: com tudo
  // aberto ele recolhe, e com tudo fechado ele expande, venha de onde vier.
  const expandirEhAProxima = !todosAbertos && (todosFechados || abertura === "nenhum");

  const fecharDetalhe = useCallback(() => setSelectedBet(null), []);

  /**
   * Baixa o recorte em CSV: tudo o que o filtro deixa passar, e não só o que
   * está desenhado — com dias recolhidos e "Mostrar mais", a tela mostra uma
   * parte, e a planilha de quem baixa precisa do recorte inteiro. Gerado aqui
   * mesmo, sem ir ao servidor.
   */
  function baixarCsv() {
    const csv = apostasParaCsv(filteredBets, converter, VALOR_UNIDADE);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeDoArquivo(activeTab, statusFilter, de, ate, grupo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revogar na mesma volta cancela o download em parte dos navegadores.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleCopyBet(bet: BetItem) {
    const texto = `${bet.partida} - ${bet.tip} @${formatarOddExata(bet.odd)} (${bet.casa})`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (contexto inseguro ou permissão negada)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BarraDeProgresso ativo={loading} />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          {grupos.length > 1 && (
            <div className="mb-3">
              <SeletorGrupo grupos={grupos} grupo={grupo} onChange={trocarGrupo} />
            </div>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
            Feed de Apostas
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Feed cronológico {trecho.prefixo}{" "}
            <span className="font-semibold text-[var(--text)]">{trecho.nome}</span>
            {periodo && <span> ({periodo})</span>}.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* No cabeçalho, e não na barra de filtros: lá ele empurrava as faixas
              de odd para uma terceira linha até em 1440 px. Aqui fica ao lado
              do outro controle que age sobre o feed inteiro, a visualização. */}
          <button
            type="button"
            onClick={baixarCsv}
            disabled={mostrarEsqueleto || Boolean(erro) || filteredBets.length === 0}
            title={`Baixar as ${formatarInteiro(filteredBets.length)} apostas do filtro, para abrir no Excel ou no Google Sheets`}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[30px] bg-[var(--bg-card)] border border-tinta/[0.12] rounded-full shadow-sm text-xs font-semibold text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Baixar CSV
          </button>

          {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que traz borda, margem e padding do navegador e existe para agrupar campo de formulário — não uma barra de botões. */}
          <div
            className="flex items-center bg-[var(--bg-card)] border border-tinta/[0.12] rounded-full p-0.5 shadow-sm"
            role="group"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-pressed={viewMode === "cards"}
              aria-label="Visualizar em cartões"
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "cards"
                  ? "bg-[var(--accent)] text-[var(--sobre-cor)]"
                  : "text-[var(--text-2)] hover:text-[var(--accent)]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              aria-label="Visualizar em tabela"
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "table"
                  ? "bg-[var(--accent)] text-[var(--sobre-cor)]"
                  : "text-[var(--text-2)] hover:text-[var(--accent)]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <SeletorAba
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            onRecarregar={recarregar}
            loading={loading}
            id="seletor-apostas"
          />
        </div>
      </div>

      {(isMock || erro) && (
        <div className="space-y-4 mb-6">
          {isMock && <AvisoMock />}
          {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}
        </div>
      )}

      {grupoDoId(grupo).atrasoDias > 0 && (
        <div className="mb-6">
          <AvisoAtraso grupo={grupo} />
        </div>
      )}

      <div className="mb-6">
        <SeletorUnidade />
      </div>

      {/* Resumo do filtro atual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Lucro do Filtro
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
              ehZero(resumo.lucro)
                ? "text-[var(--text)]"
                : resumo.lucro > 0
                  ? "text-[var(--green)]"
                  : "text-[var(--red)]"
            }`}
          >
            <NumeroAnimado
              value={resumo.lucro}
              locales="pt-BR"
              format={FORMATO_REAIS_COM_SINAL}
            />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Green / Red
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            <span className="text-[var(--green)]">{formatarInteiro(resumo.greens)}</span>{" "}
            <span className="text-[var(--text-3)] font-normal text-sm">/</span>{" "}
            <span className="text-[var(--red)]">{formatarInteiro(resumo.reds)}</span>
            {resumo.voids > 0 && (
              <span className="text-[var(--text-2)] text-sm font-normal">
                {" "}
                · {formatarInteiro(resumo.voids)} void
              </span>
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Taxa de Acerto
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--text)] mt-1 tracking-tight">
            {resumo.greens + resumo.reds > 0 ? (
              <NumeroAnimado
                value={resumo.taxa}
                locales="pt-BR"
                format={FORMATO_TAXA}
                suffix="%"
              />
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            ROI do Filtro
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
              // Sem aposta decidida o cartão mostra um traço, que não é ganho:
              // saía verde. E com aposta decidida o ROI zerado também não é
              // ganho — daí corDoValor, e não `roi >= 0`.
              resumo.greens + resumo.reds === 0
                ? "text-[var(--text)]"
                : corDoValor(resumo.roi)
            }`}
          >
            {resumo.greens + resumo.reds > 0 ? (
              <NumeroAnimado
                value={resumo.roi}
                locales="pt-BR"
                format={FORMATO_ROI}
                suffix="%"
              />
            ) : (
              "—"
            )}
          </div>
          <div className="text-[10.5px] text-[var(--text-3)] mt-0.5">
            odd média {resumo.odd > 0 ? formatarOdd(resumo.odd) : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filtros */}
        <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="w-4 h-4 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="busca-apostas" className="sr-only">
                Buscar apostas
              </label>
              <input
                id="busca-apostas"
                type="search"
                placeholder="Buscar partida, mercado, casa, adm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--bg)] border border-tinta/[0.06] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no
                  lugar é <fieldset>, que chega com borda, margem e padding do
                  navegador e existe para agrupar campo de formulário. Aqui é uma
                  barra de pílulas: trocar custaria regressão visual sem ganho de
                  leitura. */}
            <div
              className="flex items-center gap-1 flex-wrap"
              role="group"
              aria-label="Filtrar por resultado"
            >
              {(["TODAS", "GREEN", "RED", "VOID", "PENDENTE"] as const).map((status) => {
                const isActive = statusFilter === status;
                const rotulos = {
                  TODAS: "Todas",
                  GREEN: "Green",
                  RED: "Red",
                  VOID: "Void",
                  PENDENTE: "Pendente",
                } as const;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${
                      isActive
                        ? "bg-[var(--accent)] text-[var(--sobre-cor)] border-[var(--accent)]"
                        : "bg-[var(--bg-card)] text-[var(--text-2)] border-tinta/[0.08] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {rotulos[status]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-tinta/[0.05]">
            <div className="flex items-center gap-2 flex-wrap">
              <FiltroPeriodo
                de={de}
                ate={ate}
                onChange={(novoDe, novoAte) => {
                  setDe(novoDe);
                  setAte(novoAte);
                }}
                min={limitesDeData.min}
                max={limitesDeData.max}
              />

              <SeletorMultiplo
                rotuloVazio="Todos os Esportes"
                substantivo="esportes"
                opcoes={sports}
                selecionadas={sportsFilter}
                onChange={setSportsFilter}
                contagem={contagemPorEsporte}
              />

              <SeletorMultiplo
                rotuloVazio="Todas as Casas"
                substantivo="casas"
                opcoes={bookies}
                selecionadas={bookiesFilter}
                onChange={setBookiesFilter}
                contagem={contagemPorCasa}
              />

              <SeletorMultiplo
                rotuloVazio="Todos os Adms"
                substantivo="adms"
                opcoes={adms}
                selecionadas={admsFilter}
                onChange={setAdmsFilter}
                contagem={contagemPorAdm}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no
                  lugar é <fieldset>, que chega com borda, margem e padding do
                  navegador e existe para agrupar campo de formulário. Aqui é uma
                  barra de pílulas: trocar custaria regressão visual sem ganho de
                  leitura. */}
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Filtrar por faixa de odd"
              >
                <span className="text-[11px] font-medium text-[var(--text-3)] mr-1">
                  Odd:
                </span>
                {(
                  [
                    { label: "Todas", val: "TODAS" },
                    { label: "< 1,8", val: "BAIXA" },
                    { label: "1,8 – 3,0", val: "MEDIA" },
                    { label: "> 3,0", val: "ALTA" },
                  ] as const
                ).map((range) => (
                  <button
                    key={range.val}
                    type="button"
                    onClick={() => setOddRangeFilter(range.val)}
                    aria-pressed={oddRangeFilter === range.val}
                    className={`px-2 py-0.5 min-h-[24px] text-[10.5px] font-semibold rounded-full border transition-all ${
                      oddRangeFilter === range.val
                        ? "bg-[var(--accent)] text-[var(--sobre-cor)] border-[var(--accent)]"
                        : "bg-[var(--bg-card)] text-[var(--text-2)] border-tinta/[0.08] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Recolher e expandir os dias mora aqui, no fim da barra de
                  filtros, e não numa linha própria: é o controle que decide o
                  que o filtro mostra, e fica ao alcance de quem acabou de
                  filtrar. Só nos cartões, que é onde há dias. */}
              {viewMode === "cards" && !mostrarEsqueleto && !erro && dias.length > 0 && (
                <button
                  type="button"
                  onClick={() => abrirTodos(expandirEhAProxima)}
                  className="flex items-center gap-1 px-2 py-0.5 min-h-[24px] text-[10.5px] font-semibold rounded-full border bg-[var(--bg-card)] text-[var(--text-2)] border-tinta/[0.08] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
                >
                  {expandirEhAProxima ? (
                    <ChevronsUpDown className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <ChevronsDownUp className="w-3 h-3" aria-hidden="true" />
                  )}
                  {expandirEhAProxima ? "Expandir tudo" : "Recolher tudo"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feed */}
        {mostrarEsqueleto ? (
          <SkeletonLinhas quantidade={6} altura="h-20" />
        ) : erro ? null : filteredBets.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-16 text-center">
            <p className="text-sm font-medium text-[var(--text-3)]">
              {bets.length === 0
                ? `Nenhuma aposta registrada ${trecho.prefixo} ${trecho.nome}.`
                : "Nenhuma aposta corresponde aos filtros."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="space-y-3 animate-entrada">
            {dias.map((dia, indice) => {
              const aberto = estaAberto(dia.data);
              const idApostas = `apostas-do-dia-${indice}`;
              // O resultado do dia já na unidade do visitante: é o número que a
              // pílula escreve, então é dele que a cor tem de sair (#103). Lendo
              // o cru, um dia que imprime "R$ 0,00" numa unidade pequena saía
              // verde — o mesmo defeito que o comentário lá embaixo já dizia ter
              // consertado, mas com o teste no valor errado.
              const lucroDoDia = converter(dia.lucro);
              // Sem `layout` do framer: ela anima mudanças de tamanho por
              // transform, e ao mudar a altura das linhas a seção inteira
              // travou em scaleY(11.67) com translateY de 1504px — o feed
              // ficava esticado e ilegível. Mesmo motivo pelo qual o
              // AnimatePresence saiu das linhas.
              return (
                <section key={dia.data} className="space-y-2">
                  {/* O cabeçalho inteiro é o botão, e continua dizendo quantas
                      apostas o dia tem e como ele fechou mesmo recolhido — é o
                      que deixa o mês legível como lista de dias.

                      Abrir e fechar é instantâneo, de propósito: é gesto de
                      repetição, e quem recolhe dez dias seguidos não quer
                      esperar dez animações. Só a seta gira.

                      E não afunda ao ser pressionado. O `scale(0.97)` que
                      todo botão faz no clique (globals.css), num botão da
                      largura da tela, puxa a borda esquerda ~17 px para dentro
                      — e a seta, que mora nela, fugia de baixo do cursor entre
                      o apertar e o soltar. O clique acabava no <h2> de fora e
                      nunca chegava ao botão: clicar na seta não fazia nada. */}
                  <h2>
                    <button
                      type="button"
                      onClick={() => alternarDia(dia.data)}
                      aria-expanded={aberto}
                      aria-controls={aberto ? idApostas : undefined}
                      className="group/dia w-full flex items-center gap-3 py-1 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer active:transform-none"
                    >
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-[var(--text-3)] group-hover/dia:text-[var(--accent)] transition-transform duration-150 ${
                          aberto ? "" : "-rotate-90"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-mono font-bold text-[var(--text)] group-hover/dia:text-[var(--accent)] transition-colors">
                        {dia.data}
                      </span>
                      <span className="text-[11px] text-[var(--text-3)]">
                        ({formatarInteiro(dia.apostas.length)}{" "}
                        {dia.apostas.length === 1 ? "aposta" : "apostas"})
                      </span>
                      <span className="flex-1 h-px bg-tinta/[0.06]" aria-hidden="true" />
                      {/* Zero é neutro: o dia de hoje, só com pendentes, saía
                          verde, com "+R$ 0,00", como se tivesse dado lucro. */}
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          ehZero(lucroDoDia)
                            ? "bg-[var(--text-2-soft)] text-[var(--text-2)]"
                            : lucroDoDia > 0
                              ? "bg-[var(--green-soft)] text-[var(--green)]"
                              : "bg-[var(--red-soft)] text-[var(--red)]"
                        }`}
                      >
                        {formatarReaisComSinal(lucroDoDia)}
                      </span>
                    </button>
                  </h2>

                  {/* Recolhido, o dia sai do DOM em vez de só se esconder: é o
                      que mantém leve um mês de 2.452 apostas. */}
                  {aberto && (
                    <div id={idApostas} className="space-y-2">
                      {dia.apostas.map((bet) => {
                        const isGreen = bet.resultado === "GREEN";
                        const isRed = bet.resultado === "RED";
                        const isVoid = bet.resultado === "VOID";

                        return (
                          // Botão comum, com entrada só de opacidade e por CSS.
                          // Era um motion.button com entrada em escala, e o
                          // framer deixa `transform` no style do elemento:
                          // estilo inline ganha de classe, e o
                          // hover:-translate-y-0.5 nunca acontecia. Sem framer
                          // aqui a linha também sai mais barata, e há milhares
                          // delas num mês.
                          //
                          // `content-visibility: auto` deixa o navegador pular o
                          // layout do cartão fora da tela. Com Abril26 inteiro
                          // aberto (2.452 cartões), Expandir tudo caiu de 517
                          // para 194 ms e cada troca de filtro de ~600 para
                          // ~325 ms. O tamanho reservado é a caixa de conteúdo
                          // medida — 87 px no desktop, 128 no celular, onde a
                          // tip ganha linha própria — e o `auto` troca pelo
                          // tamanho real assim que o cartão é desenhado uma vez.
                          <button
                            key={bet.id}
                            type="button"
                            onClick={() => setSelectedBet(bet)}
                            aria-label={`Ver detalhes: ${bet.partida}, ${bet.tip}`}
                            className="w-full text-left bg-[var(--bg-card)] border border-tinta/[0.07] rounded-xl overflow-hidden shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 transition-[transform,box-shadow] duration-150 grid grid-cols-[5px_1fr] group animate-aparecer [content-visibility:auto] [contain-intrinsic-size:auto_5.8rem] max-sm:[contain-intrinsic-size:auto_8.5rem]"
                          >
                            <div
                              className={
                                isGreen
                                  ? "bg-[var(--green)]"
                                  : isRed
                                    ? "bg-[var(--red)]"
                                    : isVoid
                                      ? "bg-[var(--text-3)]"
                                      : "bg-[var(--amber)]"
                              }
                            />

                            <div className="p-3.5 sm:p-4 space-y-2 min-w-0">
                              {/* Linha 1 — quebra no mobile em vez de ser cortada */}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                                <SportBadge sport={bet.esporte} />
                                <span className="text-[13.5px] font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--accent)] transition-colors min-w-0 flex-1 truncate">
                                  {bet.partida}
                                </span>
                                <BookieBadge bookie={bet.casa} />
                              </div>

                              {/* Linha 2 — odd, valor, status e lucro sempre visíveis */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1.5 border-t border-tinta/[0.04]">
                                {/* No mobile a tip ocupa a linha inteira; a
                                        partir de sm divide espaço com o resto. */}
                                <span className="text-xs text-[var(--text-2)] font-medium w-full sm:w-auto sm:min-w-0 sm:flex-1 truncate">
                                  {bet.tip}
                                </span>

                                {bet.tipster && bet.tipster !== "Geral" && (
                                  <span className="text-[10px] text-[var(--text-3)] px-1.5 py-0.5 bg-[var(--bg)] rounded shrink-0">
                                    {bet.tipster}
                                  </span>
                                )}

                                <span className="text-xs font-mono font-bold text-[var(--text)] bg-[var(--bg)] px-2 py-0.5 rounded border border-tinta/[0.04] shrink-0">
                                  @{formatarOddExata(bet.odd)}
                                </span>

                                <span className="text-xs font-mono text-[var(--text-2)] shrink-0">
                                  {formatarReais(converter(bet.valor))}
                                </span>

                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0 ${
                                    isGreen
                                      ? "bg-[var(--green-soft)] text-[var(--green)]"
                                      : isRed
                                        ? "bg-[var(--red-soft)] text-[var(--red)]"
                                        : isVoid
                                          ? "bg-[var(--text-2-soft)] text-[var(--text-2)]"
                                          : "bg-[var(--amber-soft)] text-[var(--amber)]"
                                  }`}
                                >
                                  {bet.resultado}
                                </span>

                                <span
                                  className={`font-mono text-xs font-bold shrink-0 ${
                                    isGreen
                                      ? "text-[var(--green)]"
                                      : isRed
                                        ? "text-[var(--red)]"
                                        : "text-[var(--text-3)]"
                                  }`}
                                >
                                  {bet.resultado === "PENDENTE" || isVoid
                                    ? "—"
                                    : formatarReaisComSinal(converter(bet.lucro))}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto animate-entrada">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">
                  Apostas registradas {trecho.prefixo} {trecho.nome}
                </caption>
                <thead className="bg-[var(--bg-soft)] border-b border-tinta/[0.06] text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th scope="col" className="py-3 px-4">
                      Data
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Esporte
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Partida / Mercado
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Casa
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Odd
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Valor
                    </th>
                    <th scope="col" className="py-3 px-3 text-center">
                      Status
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Lucro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tinta/[0.05]">
                  {betsVisiveis.map((bet) => {
                    const isGreen = bet.resultado === "GREEN";
                    const isRed = bet.resultado === "RED";
                    const isVoid = bet.resultado === "VOID";
                    return (
                      <tr
                        key={bet.id}
                        onClick={() => setSelectedBet(bet)}
                        className="hover:bg-[var(--bg-soft)] cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--text-2)] whitespace-nowrap">
                          {bet.data}
                        </td>
                        <td className="py-2.5 px-3">
                          <SportBadge sport={bet.esporte} />
                        </td>
                        <td className="py-2.5 px-4 max-w-xs">
                          {/* A linha inteira abre o detalhe no clique, mas <tr>
                                não recebe foco: pelo teclado a tabela não abria
                                nada. O botão no nome da partida é esse caminho. */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBet(bet);
                            }}
                            className="block max-w-full text-left font-bold text-[var(--text)] truncate hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                          >
                            {bet.partida}
                          </button>
                          <div className="text-[11px] text-[var(--text-2)] truncate">
                            {bet.tip}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <BookieBadge bookie={bet.casa} />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-[var(--text)]">
                          {formatarOddExata(bet.odd)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-[var(--text-2)] whitespace-nowrap">
                          {formatarReais(converter(bet.valor))}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              isGreen
                                ? "bg-[var(--green-soft)] text-[var(--green)]"
                                : isRed
                                  ? "bg-[var(--red-soft)] text-[var(--red)]"
                                  : isVoid
                                    ? "bg-[var(--text-2-soft)] text-[var(--text-2)]"
                                    : "bg-[var(--amber-soft)] text-[var(--amber)]"
                            }`}
                          >
                            {bet.resultado}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-4 font-mono font-bold text-right whitespace-nowrap ${
                            isGreen
                              ? "text-[var(--green)]"
                              : isRed
                                ? "text-[var(--red)]"
                                : "text-[var(--text-3)]"
                          }`}
                        >
                          {bet.resultado === "PENDENTE" || isVoid
                            ? "—"
                            : formatarReaisComSinal(converter(bet.lucro))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === "table" && restantes > 0 && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setVisiveis((v) => v + APOSTAS_POR_BLOCO)}
              className="px-6 py-2.5 bg-[var(--accent)] text-[var(--sobre-cor)] text-sm font-bold rounded-full hover:bg-[var(--accent-hover)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all"
            >
              Mostrar mais {Math.min(restantes, APOSTAS_POR_BLOCO)}
            </button>
            <p className="text-[11px] text-[var(--text-3)]">
              Exibindo {formatarInteiro(betsVisiveis.length)} de{" "}
              {formatarInteiro(filteredBets.length)} apostas
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <SecaoTelegram />
      </div>

      {/* Sem AnimatePresence: o diálogo desmonta direto, e o porquê está em
          Dialogo.tsx — animar a saída deixava o véu preso no DOM engolindo
          clique, três vezes neste projeto. */}
      {selectedBet && (
        <DetalheAposta
          bet={selectedBet}
          onFechar={fecharDetalhe}
          onCopiar={handleCopyBet}
          copiado={copied}
          converter={converter}
        />
      )}
    </div>
  );
}
