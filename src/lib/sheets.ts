import path from "node:path";
import fs from "node:fs";
import type { BetItem, BetResult } from "./types";
import {
  abaDoMesAtual,
  abasRecentes,
  ABA_TODOS,
  ordemDaAba,
  reaisParaUnidades,
} from "./constants";
import { inicioDeHoje, parseDateTimestamp } from "./date";
import { computeStatsFromBets } from "./stats";
import { lerAbaPublica } from "./planilhaPublica";
import { GRUPO_PADRAO, GRUPOS, type Grupo, type IdGrupo } from "./grupos";

export { computeStatsFromBets };

// A planilha do grupo é pública; o ID não é segredo e vai como padrão para
// que o site funcione sem nenhuma configuração.
const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID || "1wIUWUDb4EjV2BfXZgIpYqOwxtjUEpkS46glw0nwdFEc";

/**
 * A planilha de cada grupo (#72).
 *
 * A do gratuito tem padrão, como sempre teve. A do Sigma só existe quando
 * alguém configura `GOOGLE_SPREADSHEET_ID_SIGMA`; sem ela o grupo fica
 * desligado, e o site segue exatamente como antes.
 */
function planilhaDoGrupo(grupo: IdGrupo): string | null {
  if (grupo === "sigma") return process.env.GOOGLE_SPREADSHEET_ID_SIGMA || null;
  return SPREADSHEET_ID;
}

/**
 * Os grupos que o site oferece: os que têm planilha. No modo demonstração,
 * os dois, para o seletor e o atraso poderem ser vistos e testados.
 */
export function gruposDisponiveis(): Grupo[] {
  return GRUPOS.filter((g) => USANDO_MOCK || planilhaDoGrupo(g.id) !== null);
}

function planilhaObrigatoria(grupo: IdGrupo): string {
  const planilha = planilhaDoGrupo(grupo);
  if (!planilha)
    throw new Error(`O grupo "${grupo}" ainda não tem planilha configurada.`);
  return planilha;
}

/** Existe credencial configurada? Se não, caímos na leitura pública. */
function temCredencial(): boolean {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return true;
  return [
    path.resolve(process.cwd(), "credenciais.json"),
    path.resolve(process.cwd(), "../extrator/credenciais.json"),
  ].some((p) => fs.existsSync(p));
}

/** Modo demonstração explícito — nunca é ativado por falha. */
export const USANDO_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

/**
 * O pacote googleapis é pesado e só serve ao caminho com service account.
 * Importado no topo, era carregado em todo cold start da API, da home e da
 * imagem de preview — inclusive no modo padrão, que lê a planilha pública e
 * nunca o usa.
 */
async function carregarGoogle() {
  const { google } = await import("googleapis");
  return google;
}

/**
 * Credenciais: variável de ambiente em produção (serverless não tem disco),
 * arquivo local como conveniência de desenvolvimento.
 */
async function buildAuth() {
  const google = await carregarGoogle();
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(inline);
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON existe mas não é um JSON válido.");
    }
    return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  }

  const localPaths = [
    path.resolve(process.cwd(), "credenciais.json"),
    path.resolve(process.cwd(), "../extrator/credenciais.json"),
  ];
  const keyFile = localPaths.find((p) => fs.existsSync(p));
  if (keyFile) {
    return new google.auth.GoogleAuth({ keyFile, scopes: SCOPES });
  }

  throw new Error(
    "Credenciais do Google ausentes. Defina GOOGLE_SERVICE_ACCOUNT_JSON " +
      "(conteúdo do JSON da service account) ou coloque credenciais.json na raiz do projeto."
  );
}

async function getSheetsClient() {
  const google = await carregarGoogle();
  return google.sheets({ version: "v4", auth: await buildAuth() });
}

export function parseCurrency(str: string): number {
  if (!str) return 0;
  // "-R$ 50,00", "R$ 150,00", "-R$160,00", "R$11.771,29"
  const cleaned = str
    .replace(/R\$/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

export function parseOdd(str: string): number {
  if (!str) return 1.0;
  const num = parseFloat(str.replace(",", ".").trim());
  return Number.isNaN(num) ? 1.0 : num;
}

export function parseResultado(raw: string): BetResult {
  const r = raw.toUpperCase();
  // VOID antes de tudo: "ANULADA" e "REEMBOLSADA" não podem cair em GREEN/RED
  if (
    r.includes("VOID") ||
    r.includes("ANULAD") ||
    r.includes("CANCELAD") ||
    r.includes("REEMBOLS") ||
    r.includes("DEVOLVID")
  ) {
    return "VOID";
  }
  // "HALF LOST" contém LOST e cairia em RED por acidente. Perda/ganho parcial
  // fica na categoria do sinal, e o lucro real vem da coluna LUCRO da planilha.
  if (r.includes("HALF")) {
    return r.includes("WON") || r.includes("WIN") ? "GREEN" : "RED";
  }
  if (r.includes("GREEN") || r.includes("WIN") || r.includes("GANHA")) return "GREEN";
  if (r.includes("RED") || r.includes("LOSS") || r.includes("PERDIDA")) return "RED";
  return "PENDENTE";
}

// Cache em memória. Em serverless cada instância tem o seu; a rota de API
// complementa com revalidate para o cache compartilhado do Next.
// As duas chaves levam a planilha: cada grupo tem a sua, e o cache de uma não
// pode responder pela outra.
const cacheTabs = new Map<string, { tabs: string[]; timestamp: number }>();
const cacheBetsPerTab = new Map<string, { data: BetItem[]; timestamp: number }>();

const TTL_MES_ATUAL = 15 * 1000;
const TTL_MES_PASSADO = 5 * 60 * 1000;

/**
 * Por quanto tempo a lista de abas vale.
 *
 * Aba nova nasce uma vez por mês. Com 60 s, cada minuto de tráfego pagava uma
 * varredura inteira da planilha para redescobrir a mesma lista. Cinco minutos
 * é tempo de sobra para a aba do mês novo aparecer no site e corta a conversa
 * com o Google por cinco.
 */
const TTL_LISTA_DE_ABAS = 5 * 60 * 1000;

/**
 * Transforma as linhas B..L em apostas. Igual para API e leitura pública.
 *
 * Exportada — junto dos quatro parsers acima — para o teste alcançar. São as
 * funções onde um engano vira número errado no ar sem quebrar nada, que é
 * exatamente o tipo de defeito que só teste pega.
 */
export function linhasParaBets(tab: string, rows: string[][]): BetItem[] {
  const bets: BetItem[] = [];

  rows.forEach((row, index) => {
    const dataStr = (row[0] || "").trim();
    const partida = (row[3] || "").trim();
    if (!dataStr && !partida) return;

    const odd = parseOdd((row[7] || "").trim());
    const valor = parseCurrency((row[6] || "").trim());
    const resultado = parseResultado((row[8] || "PENDENTE").trim());
    const lucroRaw = (row[9] || "").trim();

    let lucro = 0;
    if (resultado === "VOID") {
      lucro = 0;
    } else if (lucroRaw) {
      lucro = parseCurrency(lucroRaw);
    } else if (resultado === "GREEN") {
      lucro = valor * (odd - 1);
    } else if (resultado === "RED") {
      lucro = -valor;
    }

    bets.push({
      id: (row[10] || "").trim() || `${tab}-${index + 4}`,
      data: dataStr || "—",
      esporte: (row[1] || "").trim() || "Futebol",
      tipster: (row[2] || "").trim() || "Geral",
      partida: partida || "Aposta Registrada",
      tip: (row[4] || "").trim() || "Aposta",
      casa: (row[5] || "").trim() || "Sem Casa",
      odd: parseFloat(odd.toFixed(2)),
      valor: parseFloat(valor.toFixed(2)),
      unidades: reaisParaUnidades(valor),
      resultado,
      lucro: parseFloat(lucro.toFixed(2)),
    });
  });

  return ordenarApostas(bets);
}

/**
 * Ordem do feed: mais recente primeiro, com as de longo prazo no fim.
 *
 * Duas regras, nesta ordem.
 *
 * **Aposta de longo prazo pendente vai para o fim.** Campeão de campeonato,
 * artilheiro e rebaixamento são lançados com a data do evento, meses à frente.
 * Ordenando só por data decrescente, elas ficavam acima das apostas de hoje —
 * e a primeira linha do feed, que qualquer um lê como "a mais recente", era uma
 * aposta que só resolve no ano que vem. Entre elas, a que resolve antes vem
 * primeiro. Quando o resultado sai, a aposta deixa de ser pendente e volta ao
 * lugar cronológico dela.
 *
 * **O resto é do mais recente para o mais antigo, com desempate dentro do
 * mesmo dia.** Ordenar só pela data preservava a ordem da planilha, que é
 * crescente: "Últimas Apostas Registradas" mostrava as PRIMEIRAS do dia. A
 * posição na planilha desempata.
 *
 * Nada aqui muda número: a aposta de longo prazo continua contando no ROI, no
 * investido e nos pendentes exatamente como contava. Isto é ordenação.
 */
export function ordenarApostas(bets: BetItem[], ref: Date = new Date()): BetItem[] {
  const hoje = inicioDeHoje(ref);

  return bets
    .map((bet, posicao) => {
      const ts = parseDateTimestamp(bet.data);
      return {
        bet,
        posicao,
        ts,
        longoPrazo: bet.resultado === "PENDENTE" && ts > hoje,
      };
    })
    .sort((a, b) => {
      if (a.longoPrazo !== b.longoPrazo) return a.longoPrazo ? 1 : -1;
      // Entre as de longo prazo, a que resolve antes vem primeiro.
      if (a.longoPrazo) return a.ts - b.ts || a.posicao - b.posicao;
      return b.ts - a.ts || b.posicao - a.posicao;
    })
    .map((x) => x.bet);
}

/**
 * Abas via leitura pública. Como o gviz não erra em aba inexistente, cada
 * candidata dos últimos 18 meses é validada pelo conteúdo antes de entrar.
 */
/**
 * Quantos meses seguidos sem aba antes de parar de procurar.
 *
 * O grupo publica todo mês, então três buracos seguidos significam que a
 * planilha acabou ali — não que exista um mês solto mais atrás. Dois seriam
 * apertado demais: basta uma pausa de fim de ano para cortar o histórico no
 * meio.
 */
const MESES_VAZIOS_PARA_PARAR = 3;

/**
 * Quantas abas são sondadas de uma vez.
 *
 * A varredura custa uma requisição por mês sondado, e elas vão em paralelo
 * dentro do lote. Lote grande demais desperdiça requisição depois do fim da
 * planilha; pequeno demais multiplica as rodadas e a espera. Doze cobre um ano
 * por rodada.
 */
const LOTE_DE_SONDAGEM = 12;

/**
 * Teto de segurança, em meses.
 *
 * Nunca deveria ser alcançado — a regra dos três meses vazios para antes. Ele
 * existe para que um erro de sondagem que devolva "existe" para tudo não vire
 * uma varredura infinita.
 */
const LIMITE_DE_MESES = 120;

/**
 * Anda para trás a partir do mês atual, mês a mês, até encontrar
 * `MESES_VAZIOS_PARA_PARAR` seguidos sem aba.
 *
 * Substituiu um `abasRecentes(18)` de tamanho fixo. O problema daquele não era
 * custo, era **perda silenciosa**: o grupo começou em agosto de 2025, e a
 * partir de fevereiro de 2027 o mês mais antigo sairia da janela. Sumiria do
 * histórico, deixaria de ser somado na visão de todos os meses, e o
 * consolidado encolheria sozinho sem nada na tela dizendo por quê.
 *
 * Recebe a sondagem por parâmetro para poder ser testada sem rede.
 */
export async function descobrirAbas(
  existe: (aba: string) => Promise<boolean>,
  ref: Date = new Date()
): Promise<string[]> {
  const encontradas: string[] = [];
  let vaziosSeguidos = 0;

  for (let inicio = 0; inicio < LIMITE_DE_MESES; inicio += LOTE_DE_SONDAGEM) {
    const lote = abasRecentes(inicio + LOTE_DE_SONDAGEM, ref).slice(inicio);
    const resultados = await Promise.all(lote.map(existe));

    for (let i = 0; i < lote.length; i++) {
      if (resultados[i]) {
        encontradas.push(lote[i]);
        vaziosSeguidos = 0;
        continue;
      }
      vaziosSeguidos += 1;
      if (vaziosSeguidos >= MESES_VAZIOS_PARA_PARAR) return encontradas;
    }
  }

  return encontradas;
}

/** Sondagem de verdade: a aba existe e tem linha do mês que deveria conter. */
async function existeAbaPublica(planilha: string, aba: string): Promise<boolean> {
  const ordem = ordemDaAba(aba);
  if (ordem <= 0) return false;
  const mes = ordem % 100;
  const ano2 = Math.floor(ordem / 100) % 100;
  try {
    // O mês esperado não é zelo à toa: quando a aba não existe, o gviz devolve
    // a PRIMEIRA aba da planilha em vez de erro. Sem a conferência, a varredura
    // acharia que todos os meses existem.
    const r = await lerAbaPublica(planilha, aba, { mes, ano2 });
    return Boolean(r && r.linhas.length > 0);
  } catch {
    return false;
  }
}

function getAvailableTabsPublico(planilha: string): Promise<string[]> {
  return descobrirAbas((aba) => existeAbaPublica(planilha, aba));
}

export async function getAvailableTabs(grupo: IdGrupo = GRUPO_PADRAO): Promise<string[]> {
  const planilha = planilhaObrigatoria(grupo);
  const now = Date.now();
  const emCache = cacheTabs.get(planilha);
  if (emCache && emCache.tabs.length > 0 && now - emCache.timestamp < TTL_LISTA_DE_ABAS) {
    return emCache.tabs;
  }

  if (!temCredencial()) {
    const publicas = await getAvailableTabsPublico(planilha);
    if (publicas.length === 0) {
      throw new Error(
        "Não foi possível ler a planilha publicamente. Confirme que ela está " +
          "compartilhada por link, ou configure GOOGLE_SERVICE_ACCOUNT_JSON."
      );
    }
    publicas.sort((a, b) => ordemDaAba(b) - ordemDaAba(a));
    cacheTabs.set(planilha, { tabs: publicas, timestamp: now });
    return publicas;
  }

  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: planilha });

  const rawTabs = (meta.data.sheets || [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));

  const validTabs = rawTabs.length > 0 ? rawTabs : abasRecentes();
  // Mais recente primeiro; abas fora do padrão mês+ano vão para o fim
  validTabs.sort((a, b) => ordemDaAba(b) - ordemDaAba(a));

  cacheTabs.set(planilha, { tabs: validTabs, timestamp: now });
  return validTabs;
}

export async function getBetsFromTab(
  tabName?: string,
  grupo: IdGrupo = GRUPO_PADRAO
): Promise<BetItem[]> {
  const tab = tabName || abaDoMesAtual();
  const planilha = planilhaObrigatoria(grupo);

  if (tab === ABA_TODOS || tab === "TODAS" || tab === "ALL") {
    return getAllBetsFromAllTabs(grupo);
  }

  const now = Date.now();
  const chave = `${planilha}:${tab}`;
  const cached = cacheBetsPerTab.get(chave);
  const ttl = tab === abaDoMesAtual() ? TTL_MES_ATUAL : TTL_MES_PASSADO;
  if (cached && now - cached.timestamp < ttl) {
    return cached.data;
  }

  let rows: string[][];

  if (temCredencial()) {
    const sheets = await getSheetsClient();
    // B4:L = da coluna DATA até RECORD_ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: planilha,
      range: `${tab}!B4:L`,
    });
    rows = (response.data.values || []) as string[][];
  } else {
    const ordem = ordemDaAba(tab);
    const publica = await lerAbaPublica(
      planilha,
      tab,
      ordem > 0 ? { mes: ordem % 100, ano2: Math.floor(ordem / 100) % 100 } : undefined
    );
    if (!publica) {
      throw new Error(`Aba "${tab}" não encontrada na planilha pública.`);
    }
    // A leitura pública traz a linha inteira; recorta de B (índice 1) até L
    rows = publica.linhas.map((l) => l.slice(1, 12));
  }

  const bets = linhasParaBets(tab, rows);
  cacheBetsPerTab.set(chave, { data: bets, timestamp: now });
  return bets;
}

async function getAllBetsFromAllTabs(grupo: IdGrupo): Promise<BetItem[]> {
  const tabs = await getAvailableTabs(grupo);
  const monthlyTabs = tabs.filter(
    (t) => !t.toLowerCase().includes("resumo") && !t.toLowerCase().includes("config")
  );

  const results = await Promise.all(monthlyTabs.map((t) => getBetsFromTab(t, grupo)));
  const allBets = results.flat();

  // Mesma regra da aba única: juntar meses não pode reintroduzir a aposta de
  // longo prazo no topo.
  return ordenarApostas(allBets);
}
