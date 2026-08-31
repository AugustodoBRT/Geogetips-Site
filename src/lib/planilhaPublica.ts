/**
 * Leitura da planilha SEM credencial nenhuma, aproveitando que ela está
 * compartilhada publicamente. Serve como caminho padrão: o site sobe no Vercel
 * sem service account, sem JSON, sem segredo para vazar.
 *
 * Limitação: o endpoint gviz não erra quando a aba não existe — ele devolve a
 * primeira aba da planilha. Por isso toda aba lida é validada pelo conteúdo.
 */

const BASE = "https://docs.google.com/spreadsheets/d";

/** Divide uma linha de CSV respeitando aspas e vírgulas dentro do campo. */
function parseLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];

    if (dentroDeAspas) {
      if (c !== '"') {
        atual += c;
      } else if (linha[i + 1] === '"') {
        atual += '"'; // aspas escapadas dentro do campo
        i++;
      } else {
        dentroDeAspas = false;
      }
      continue;
    }

    if (c === '"') {
      dentroDeAspas = true;
    } else if (c === ",") {
      campos.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }

  campos.push(atual);
  return campos;
}

/** CSV completo em matriz. Lida com quebras de linha dentro de campos citados. */
export function parseCsv(texto: string): string[][] {
  const linhas: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"') {
      dentroDeAspas = !dentroDeAspas;
      atual += c;
    } else if ((c === "\n" || c === "\r") && !dentroDeAspas) {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linhas.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  if (atual) linhas.push(atual);

  return linhas.map(parseLinhaCsv);
}

export function urlCsvDaAba(spreadsheetId: string, aba: string): string {
  return `${BASE}/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(aba)}`;
}

/**
 * Confere se as linhas realmente pertencem à aba pedida, comparando o mês/ano
 * da coluna DATA com o nome da aba. É o que impede a aba-fallback do gviz de
 * entrar no lugar de um mês que não existe.
 */
function pertenceAoMes(linhas: string[][], mes: number, ano2: number): boolean {
  for (const l of linhas) {
    const data = (l[1] || "").trim();
    const m = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) continue;
    return parseInt(m[2], 10) === mes && m[3].slice(-2) === String(ano2).padStart(2, "0");
  }
  // Aba sem nenhuma data legível: não dá para afirmar que é a certa
  return false;
}

export interface AbaPublica {
  aba: string;
  linhas: string[][];
}

/**
 * Lê uma aba pública. Devolve null quando o conteúdo não corresponde ao mês
 * pedido — ou seja, quando o gviz caiu na aba padrão.
 */
export async function lerAbaPublica(
  spreadsheetId: string,
  aba: string,
  mesEsperado?: { mes: number; ano2: number }
): Promise<AbaPublica | null> {
  const res = await fetch(urlCsvDaAba(spreadsheetId, aba), {
    // Deixa o cache do Next tomar conta; sem isto cada render refaz a chamada
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;

  const texto = await res.text();
  // O gviz devolve HTML quando a planilha não é pública
  if (texto.trimStart().startsWith("<")) return null;

  const todas = parseCsv(texto);
  // O gviz já consome a linha de cabeçalho da planilha e devolve os dados a
  // partir da segunda linha do CSV. Pular mais que uma descartaria apostas
  // reais — foi exatamente o que aconteceu antes desta correção.
  const linhas = todas.slice(1).filter((l) => l.some((c) => c.trim() !== ""));

  if (mesEsperado && !pertenceAoMes(linhas, mesEsperado.mes, mesEsperado.ano2)) {
    return null;
  }

  return { aba, linhas };
}
