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
function parseCsv(texto: string): string[][] {
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

function urlCsvDaAba(spreadsheetId: string, aba: string): string {
  return `${BASE}/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(aba)}`;
}

/**
 * Confere se as linhas realmente pertencem à aba pedida, comparando o mês/ano
 * da coluna DATA com o nome da aba. É o que impede a aba-fallback do gviz de
 * entrar no lugar de um mês que não existe.
 *
 * Decide pelo mês da **maioria** das linhas, e não pelo da primeira: se a
 * primeira linha de um mês novo fosse uma aposta de longo prazo, a aba passaria
 * por inexistente e o mês inteiro sumiria do site.
 *
 * Aposta de longo prazo guarda a data do evento, meses à frente, e por isso
 * **não vota**: contar essas linhas fazia o mesmo mês sumir pelo motivo
 * contrário, bastando serem mais que as do dia — o que acontece justamente nos
 * primeiros dias de um mês, quando a aba tem poucas linhas.
 *
 * Quem denuncia a aba-fallback do gviz é linha de mês **anterior** ao pedido:
 * a varredura só sonda meses até o corrente, então a aba que vem no lugar é
 * sempre de um mês já passado, e as linhas dela contam e vencem o esperado,
 * que fica em zero.
 */
export function pertenceAoMes(linhas: string[][], mes: number, ano2: number): boolean {
  const limite = (2000 + ano2) * 100 + mes;
  const porMes = new Map<number, number>();
  for (const l of linhas) {
    const data = (l[1] || "").trim();
    const m = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) continue;
    const ordem = parseInt(m[3], 10) * 100 + parseInt(m[2], 10);
    if (ordem > limite) continue;
    porMes.set(ordem, (porMes.get(ordem) ?? 0) + 1);
  }
  // Aba sem nenhuma linha do mês pedido: não dá para afirmar que é a certa
  const doEsperado = porMes.get(limite) ?? 0;
  if (doEsperado === 0) return false;
  return Array.from(porMes.values()).every((n) => n <= doEsperado);
}

interface AbaPublica {
  aba: string;
  linhas: string[][];
}

/**
 * Por que a leitura não deu certo.
 *
 * As três são coisas diferentes e exigem respostas diferentes, e foi por
 * devolver `null` para as três que o site passou meses podendo acusar a causa
 * errada: em 01/10/2026 o antivírus interceptou o HTTPS, o Node recusou o
 * certificado, e a tela mandou conferir o compartilhamento de uma planilha que
 * estava pública.
 *
 * - `nao-publica`: o gviz devolveu HTML. A planilha não está compartilhada.
 * - `outro-mes`: veio a aba-fallback do gviz. A aba pedida **não existe**, e
 *   esta é a única das três que é resposta definitiva sobre a aba.
 * - `falhou`: não deu para ler — HTTP ruim, rede, DNS, certificado, tempo
 *   esgotado. Não diz nada sobre a aba existir ou não.
 */
export type MotivoDeFalha = "nao-publica" | "outro-mes" | "falhou";

export type LeituraPublica =
  | ({ ok: true } & AbaPublica)
  | { ok: false; motivo: MotivoDeFalha; detalhe?: string };

/**
 * Lê uma aba pública e, quando não dá certo, diz por quê.
 *
 * Nunca lança: o erro de rede vira `motivo: "falhou"` com a causa em
 * `detalhe`, para quem chama decidir o que fazer com a informação em vez de
 * descobri-la por exclusão.
 */
export async function lerAbaPublica(
  spreadsheetId: string,
  aba: string,
  mesEsperado?: { mes: number; ano2: number }
): Promise<LeituraPublica> {
  let res: Response;
  try {
    res = await fetch(urlCsvDaAba(spreadsheetId, aba), {
      // Deixa o cache do Next tomar conta; sem isto cada render refaz a chamada
      next: { revalidate: 60 },
    });
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro);
    return { ok: false, motivo: "falhou", detalhe };
  }

  if (!res.ok) {
    return { ok: false, motivo: "falhou", detalhe: `HTTP ${res.status}` };
  }

  const texto = await res.text();
  // O gviz devolve HTML quando a planilha não é pública
  if (texto.trimStart().startsWith("<")) {
    return { ok: false, motivo: "nao-publica" };
  }

  const todas = parseCsv(texto);
  // O gviz já consome a linha de cabeçalho da planilha e devolve os dados a
  // partir da segunda linha do CSV. Pular mais que uma descartaria apostas
  // reais — foi exatamente o que aconteceu antes desta correção.
  const linhas = todas.slice(1).filter((l) => l.some((c) => c.trim() !== ""));

  if (mesEsperado && !pertenceAoMes(linhas, mesEsperado.mes, mesEsperado.ano2)) {
    return { ok: false, motivo: "outro-mes" };
  }

  return { ok: true, aba, linhas };
}
