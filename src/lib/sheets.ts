import path from "path";
import fs from "fs";
import { BetItem, BetResult } from "./types";
import { abaDoMesAtual, abasRecentes, ABA_TODOS, ordemDaAba, reaisParaUnidades } from "./constants";
import { parseDateTimestamp } from "./date";
import { computeStatsFromBets } from "./stats";
import { lerAbaPublica } from "./planilhaPublica";

export { computeStatsFromBets };
export { parseDateTimestamp };

// A planilha do grupo é pública; o ID não é segredo e vai como padrão para
// que o site funcione sem nenhuma configuração.
const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID ||
  "1wIUWUDb4EjV2BfXZgIpYqOwxtjUEpkS46glw0nwdFEc";

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
    let credentials;
    try {
      credentials = JSON.parse(inline);
    } catch {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON existe mas não é um JSON válido."
      );
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

export async function getSheetsClient() {
  const google = await carregarGoogle();
  return google.sheets({ version: "v4", auth: await buildAuth() });
}

function parseCurrency(str: string): number {
  if (!str) return 0;
  // "-R$ 50,00", "R$ 150,00", "-R$160,00", "R$11.771,29"
  const cleaned = str
    .replace(/R\$/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseOdd(str: string): number {
  if (!str) return 1.0;
  const num = parseFloat(str.replace(",", ".").trim());
  return isNaN(num) ? 1.0 : num;
}

function parseResultado(raw: string): BetResult {
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
const cacheTabs = { tabs: [] as string[], timestamp: 0 };
const cacheBetsPerTab = new Map<string, { data: BetItem[]; timestamp: number }>();

const TTL_MES_ATUAL = 15 * 1000;
const TTL_MES_PASSADO = 5 * 60 * 1000;

/** Transforma as linhas B..L em apostas. Igual para API e leitura pública. */
function linhasParaBets(tab: string, rows: string[][]): BetItem[] {
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

  // Mais recente primeiro — inclusive dentro do mesmo dia. Ordenar só pela
  // data preservava a ordem da planilha, que é crescente: "Últimas Apostas
  // Registradas" mostrava as PRIMEIRAS do dia. A posição na planilha desempata.
  return bets
    .map((bet, posicao) => ({ bet, posicao, ts: parseDateTimestamp(bet.data) }))
    .sort((a, b) => b.ts - a.ts || b.posicao - a.posicao)
    .map((x) => x.bet);
}

/**
 * Abas via leitura pública. Como o gviz não erra em aba inexistente, cada
 * candidata dos últimos 18 meses é validada pelo conteúdo antes de entrar.
 */
async function getAvailableTabsPublico(): Promise<string[]> {
  const candidatas = abasRecentes(18);

  const encontradas = await Promise.all(
    candidatas.map(async (aba) => {
      const ordem = ordemDaAba(aba);
      const mes = ordem % 100;
      const ano2 = Math.floor(ordem / 100) % 100;
      try {
        const r = await lerAbaPublica(SPREADSHEET_ID, aba, { mes, ano2 });
        return r && r.linhas.length > 0 ? aba : null;
      } catch {
        return null;
      }
    })
  );

  return encontradas.filter((a): a is string => a !== null);
}

export async function getAvailableTabs(): Promise<string[]> {
  const now = Date.now();
  if (cacheTabs.tabs.length > 0 && now - cacheTabs.timestamp < 60 * 1000) {
    return cacheTabs.tabs;
  }

  if (!temCredencial()) {
    const publicas = await getAvailableTabsPublico();
    if (publicas.length === 0) {
      throw new Error(
        "Não foi possível ler a planilha publicamente. Confirme que ela está " +
          "compartilhada por link, ou configure GOOGLE_SERVICE_ACCOUNT_JSON."
      );
    }
    publicas.sort((a, b) => ordemDaAba(b) - ordemDaAba(a));
    cacheTabs.tabs = publicas;
    cacheTabs.timestamp = now;
    return publicas;
  }

  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });

  const rawTabs = (meta.data.sheets || [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));

  const validTabs = rawTabs.length > 0 ? rawTabs : abasRecentes();
  // Mais recente primeiro; abas fora do padrão mês+ano vão para o fim
  validTabs.sort((a, b) => ordemDaAba(b) - ordemDaAba(a));

  cacheTabs.tabs = validTabs;
  cacheTabs.timestamp = now;
  return validTabs;
}

export async function getBetsFromTab(tabName?: string): Promise<BetItem[]> {
  const tab = tabName || abaDoMesAtual();

  if (tab === ABA_TODOS || tab === "TODAS" || tab === "ALL") {
    return getAllBetsFromAllTabs();
  }

  const now = Date.now();
  const cached = cacheBetsPerTab.get(tab);
  const ttl = tab === abaDoMesAtual() ? TTL_MES_ATUAL : TTL_MES_PASSADO;
  if (cached && now - cached.timestamp < ttl) {
    return cached.data;
  }

  let rows: string[][];

  if (temCredencial()) {
    const sheets = await getSheetsClient();
    // B4:L = da coluna DATA até RECORD_ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!B4:L`,
    });
    rows = (response.data.values || []) as string[][];
  } else {
    const ordem = ordemDaAba(tab);
    const publica = await lerAbaPublica(
      SPREADSHEET_ID,
      tab,
      ordem > 0
        ? { mes: ordem % 100, ano2: Math.floor(ordem / 100) % 100 }
        : undefined
    );
    if (!publica) {
      throw new Error(`Aba "${tab}" não encontrada na planilha pública.`);
    }
    // A leitura pública traz a linha inteira; recorta de B (índice 1) até L
    rows = publica.linhas.map((l) => l.slice(1, 12));
  }

  const bets = linhasParaBets(tab, rows);
  cacheBetsPerTab.set(tab, { data: bets, timestamp: now });
  return bets;
}

export async function getAllBetsFromAllTabs(): Promise<BetItem[]> {
  const tabs = await getAvailableTabs();
  const monthlyTabs = tabs.filter(
    (t) => !t.toLowerCase().includes("resumo") && !t.toLowerCase().includes("config")
  );

  const results = await Promise.all(monthlyTabs.map((t) => getBetsFromTab(t)));
  const allBets = results.flat();

  allBets.sort((a, b) => parseDateTimestamp(b.data) - parseDateTimestamp(a.data));
  return allBets;
}
