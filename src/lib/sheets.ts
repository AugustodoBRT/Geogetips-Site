import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { BetItem, BetResult, TipsterStat, SportBreakdown, BookieBreakdown } from "./types";
import { MOCK_BETS, MOCK_TIPSTERS, MOCK_SPORTS, MOCK_BOOKIES } from "./data";

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID || "1wIUWUDb4EjV2BfXZgIpYqOwxtjUEpkS46glw0nwdFEc";

function getCredentialsPath(): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), "../extrator/credenciais.json"),
    path.resolve(process.cwd(), "credenciais.json"),
    path.resolve("/home/augusto/botaposta/extrator/credenciais.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function parseCurrency(str: string): number {
  if (!str) return 0;
  // Handles "-R$ 50,00", "R$ 150,00", "-R$160,00", "R$11.771,29"
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
  const cleaned = str.replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 1.0 : num;
}

export function parseDateTimestamp(dateStr: string): number {
  if (!dateStr || dateStr === "—") return 0;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day).getTime();
    }
  }
  return 0;
}

export async function getSheetsClient() {
  const credsPath = getCredentialsPath();
  if (!credsPath) {
    throw new Error("credenciais.json not found");
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credsPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

// In-memory cache for fast response times
const cacheTabs = {
  tabs: [] as string[],
  timestamp: 0,
};

const cacheBetsPerTab = new Map<string, { data: BetItem[]; timestamp: number }>();

export async function getAvailableTabs(): Promise<string[]> {
  const now = Date.now();
  if (cacheTabs.tabs.length > 0 && now - cacheTabs.timestamp < 60 * 1000) {
    return cacheTabs.tabs;
  }

  try {
    const sheets = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const rawTabs = (meta.data.sheets || [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t));

    const validTabs =
      rawTabs.length > 0
        ? rawTabs
        : ["Agosto26", "Julho26", "Junho26", "Maio26", "Abril26"];

    cacheTabs.tabs = validTabs;
    cacheTabs.timestamp = now;

    return validTabs;
  } catch (error) {
    console.error("Failed to list sheets tabs:", error);
    return ["Agosto26", "Julho26", "Junho26", "Maio26", "Abril26"];
  }
}

export async function getBetsFromTab(tabName: string = "Agosto26"): Promise<BetItem[]> {
  if (tabName === "TODOS" || tabName === "TODAS" || tabName === "ALL") {
    return getAllBetsFromAllTabs();
  }

  const now = Date.now();
  const cached = cacheBetsPerTab.get(tabName);
  // Current month: 15s TTL, Past months: 5 min TTL
  const ttl = tabName === "Agosto26" ? 15 * 1000 : 5 * 60 * 1000;
  if (cached && now - cached.timestamp < ttl) {
    return cached.data;
  }

  try {
    const sheets = await getSheetsClient();

    // Range B4:L to get all data rows from column B (DATA) to L (RECORD_ID)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!B4:L`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return MOCK_BETS;
    }

    const bets: BetItem[] = [];

    rows.forEach((row, index) => {
      const dataStr = (row[0] || "").trim();
      const esporte = (row[1] || "").trim();
      const tipster = (row[2] || "").trim() || "Geral";
      const partida = (row[3] || "").trim();
      const tip = (row[4] || "").trim();
      const casa = (row[5] || "").trim();
      const valorRaw = (row[6] || "").trim();
      const oddRaw = (row[7] || "").trim();
      const resultadoRaw = (row[8] || "PENDENTE").trim().toUpperCase();
      const lucroRaw = (row[9] || "").trim();
      const recordId = (row[10] || "").trim();

      // Only count rows that have a date or match
      if (!dataStr && !partida) return;

      const odd = parseOdd(oddRaw);
      const valor = parseCurrency(valorRaw);
      const unidades = parseFloat((valor / 2.0).toFixed(2)); // Base 1u = R$ 2,00

      let resultado: BetResult = "PENDENTE";
      if (
        resultadoRaw.includes("GREEN") ||
        resultadoRaw.includes("WIN") ||
        resultadoRaw.includes("GANHA")
      ) {
        resultado = "GREEN";
      } else if (
        resultadoRaw.includes("RED") ||
        resultadoRaw.includes("LOSS") ||
        resultadoRaw.includes("PERDIDA")
      ) {
        resultado = "RED";
      }

      let lucro = 0;
      if (lucroRaw) {
        lucro = parseCurrency(lucroRaw);
      } else {
        if (resultado === "GREEN") {
          lucro = valor * (odd - 1);
        } else if (resultado === "RED") {
          lucro = -valor;
        }
      }

      bets.push({
        id: recordId || `${tabName}-${index + 4}`,
        data: dataStr || "—",
        esporte: esporte || "Futebol",
        tipster,
        partida: partida || "Aposta Registrada",
        tip: tip || "Palpite",
        casa: casa || "Sem Casa",
        odd: parseFloat(odd.toFixed(2)),
        valor: parseFloat(valor.toFixed(2)),
        unidades,
        resultado,
        lucro: parseFloat(lucro.toFixed(2)),
      });
    });

    // Sort descending by date (latest dates first)
    bets.sort((a, b) => parseDateTimestamp(b.data) - parseDateTimestamp(a.data));

    const finalBets = bets.length > 0 ? bets : MOCK_BETS;
    cacheBetsPerTab.set(tabName, { data: finalBets, timestamp: now });

    return finalBets;
  } catch (error) {
    console.error(`Failed to read bets from tab ${tabName}:`, error);
    return MOCK_BETS;
  }
}

export async function getAllBetsFromAllTabs(): Promise<BetItem[]> {
  try {
    const tabs = await getAvailableTabs();
    // Exclude special non-month tabs if any
    const monthlyTabs = tabs.filter(
      (t) => !t.toLowerCase().includes("resumo") && !t.toLowerCase().includes("config")
    );

    // Fetch all tabs in parallel
    const results = await Promise.all(monthlyTabs.map((t) => getBetsFromTab(t)));
    const allBets = results.flat();

    // Sort all-time bets descending by date
    allBets.sort((a, b) => parseDateTimestamp(b.data) - parseDateTimestamp(a.data));

    return allBets.length > 0 ? allBets : MOCK_BETS;
  } catch (error) {
    console.error("Failed to fetch all bets from all tabs:", error);
    return MOCK_BETS;
  }
}

export function computeStatsFromBets(bets: BetItem[]) {
  const totalBets = bets.length;
  const greens = bets.filter((b) => b.resultado === "GREEN").length;
  const reds = bets.filter((b) => b.resultado === "RED").length;
  const pendings = bets.filter((b) => b.resultado === "PENDENTE").length;

  const totalLucro = bets.reduce((acc, b) => acc + b.lucro, 0);
  const taxaAcerto = greens + reds > 0 ? (greens / (greens + reds)) * 100 : 0;

  // Tipsters
  const tipsterMap = new Map<
    string,
    { esportes: Set<string>; greens: number; reds: number; total: number; lucro: number }
  >();

  bets.forEach((b) => {
    const t = tipsterMap.get(b.tipster) || {
      esportes: new Set<string>(),
      greens: 0,
      reds: 0,
      total: 0,
      lucro: 0,
    };
    t.total += 1;
    t.lucro += b.lucro;
    if (b.esporte) t.esportes.add(b.esporte);
    if (b.resultado === "GREEN") t.greens += 1;
    if (b.resultado === "RED") t.reds += 1;
    tipsterMap.set(b.tipster, t);
  });

  const tipsters: TipsterStat[] = Array.from(tipsterMap.entries()).map(([nome, d], idx) => {
    const rate = d.greens + d.reds > 0 ? (d.greens / (d.greens + d.reds)) * 100 : 0;
    const colors = [
      "from-[#2D8659] to-[#34d399]",
      "from-[#3b82f6] to-[#60a5fa]",
      "from-[#B8860B] to-[#f59e0b]",
      "from-[#C23B22] to-[#f87171]",
      "from-[#8b5cf6] to-[#a78bfa]",
    ];
    return {
      nome,
      esportes: Array.from(d.esportes),
      avatarColor: colors[idx % colors.length],
      initial: nome.charAt(0).toUpperCase() || "T",
      taxaAcerto: parseFloat(rate.toFixed(1)),
      totalApostas: d.total,
      lucroUnidades: parseFloat((d.lucro / 2.0).toFixed(1)),
    };
  });

  // Sort by profit descending
  tipsters.sort((a, b) => b.lucroUnidades - a.lucroUnidades);

  // Sports
  const sportMap = new Map<string, { total: number; greens: number; reds: number; lucro: number }>();
  bets.forEach((b) => {
    let cleanSport = (b.esporte || "Outros").trim();
    if (!cleanSport) cleanSport = "Outros";
    cleanSport = cleanSport.charAt(0).toUpperCase() + cleanSport.slice(1);
    const s = sportMap.get(cleanSport) || { total: 0, greens: 0, reds: 0, lucro: 0 };
    s.total += 1;
    s.lucro += b.lucro;
    if (b.resultado === "GREEN") s.greens += 1;
    if (b.resultado === "RED") s.reds += 1;
    sportMap.set(cleanSport, s);
  });

  const sports: SportBreakdown[] = Array.from(sportMap.entries())
    .map(([esporte, d]) => {
      const rate = d.greens + d.reds > 0 ? (d.greens / (d.greens + d.reds)) * 100 : 0;
      let icone: "soccer" | "basketball" | "tennis" = "soccer";
      const lower = esporte.toLowerCase();
      if (lower.includes("nba") || lower.includes("basquete")) icone = "basketball";
      else if (lower.includes("tênis") || lower.includes("tenis")) icone = "tennis";

      return {
        esporte,
        icone,
        apostas: d.total,
        taxaAcerto: parseFloat(rate.toFixed(1)),
        lucro: parseFloat(d.lucro.toFixed(2)),
      };
    })
    .sort((a, b) => b.apostas - a.apostas);

  // Bookies
  const bookieMap = new Map<string, number>();
  bets.forEach((b) => {
    if (b.casa) {
      bookieMap.set(b.casa, (bookieMap.get(b.casa) || 0) + 1);
    }
  });

  const maxBookie = Math.max(...Array.from(bookieMap.values()), 1);
  const bookies: BookieBreakdown[] = Array.from(bookieMap.entries())
    .map(([casa, apostas]) => ({
      casa,
      apostas,
      percentual: Math.round((apostas / maxBookie) * 100),
    }))
    .sort((a, b) => b.apostas - a.apostas)
    .slice(0, 8);

  return {
    totalBets,
    greens,
    reds,
    pendings,
    totalLucro: parseFloat(totalLucro.toFixed(2)),
    taxaAcerto: parseFloat(taxaAcerto.toFixed(1)),
    tipsters,
    sports,
    bookies,
  };
}
