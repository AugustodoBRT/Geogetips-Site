import { expect, test } from "@playwright/test";

/**
 * A hidratação não pode quebrar por causa da ordem em que os chunks carregam
 * (#86).
 *
 * O `children` do layout raiz é o roteador do Next, que recebe o componente do
 * `error.tsx` como propriedade. Se o chunk dele ainda não carregou quando o
 * React chega ao `<main>`, o elemento fica pendente e a hidratação suspende
 * ali. Suspendendo direto num elemento HTML, o React do Next 15 às vezes
 * retoma esse elemento sem voltar o cursor de hidratação, acusa o erro 418 e
 * remonta a página inteira (react/react#37584). O Fragment com chave no layout
 * tira a suspensão do `<main>`.
 *
 * O defeito é uma corrida: o chunk precisa ficar pronto exatamente no
 * intervalo em que o React cede a vez. Mesmo atrasando o chunk de propósito,
 * a tela quebrava em até 42% das cargas de um lote, e em alguns lotes em
 * nenhuma. Um teste de navegador passaria quase sempre sem a correção. Por
 * isso quem guarda o conserto é o teste de estrutura, que procura o padrão no
 * que o servidor manda. O teste de comportamento confere só que a tela
 * sobrevive ao chunk atrasado.
 */

type Elemento = ["$", string, string | null, Record<string, unknown>];

const ehElemento = (v: unknown): v is Elemento =>
  Array.isArray(v) && v.length === 4 && v[0] === "$" && typeof v[1] === "string";

/**
 * O payload RSC que vai embutido no HTML, o mesmo que o navegador hidrata,
 * como linhas `id → texto`.
 */
function linhasDoPayload(html: string): Map<string, string> {
  let texto = "";
  for (const [, trecho] of html.matchAll(
    /<script>self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g
  )) {
    const [tipo, dado] = JSON.parse(trecho) as [number, unknown];
    if (tipo === 1 && typeof dado === "string") texto += dado;
  }
  const linhas = new Map<string, string>();
  // O `*` no corte apanha também as linhas de dica, que vêm sem id (`:HL[...]`)
  // e, sem isso, grudariam no fim da linha anterior.
  for (const linha of texto.split(/\n(?=[0-9a-f]*:)/)) {
    const m = linha.match(/^([0-9a-f]+):([\s\S]*)$/);
    if (m) linhas.set(m[1], m[2]);
  }
  return linhas;
}

function lerJson(texto: string | undefined): unknown {
  try {
    return texto === undefined ? undefined : JSON.parse(texto);
  } catch {
    return undefined;
  }
}

/**
 * As props que apontam por valor (`"$6"`, e não `"$L6"`) para um módulo de
 * cliente. É isso que deixa o elemento pendente enquanto o chunk do módulo
 * não carrega. Não desce em outro elemento: ele fica pendente sozinho, sem
 * prender o de fora.
 */
function modulosPorValor(v: unknown, modulos: Set<string>, caminho = ""): string[] {
  if (typeof v === "string") {
    const id = v.match(/^\$([0-9a-f]+)$/)?.[1];
    return id && modulos.has(id) ? [`${caminho}=${v}`] : [];
  }
  if (!v || typeof v !== "object" || ehElemento(v)) return [];
  return Object.entries(v).flatMap(([k, filho]) =>
    modulosPorValor(filho, modulos, caminho ? `${caminho}.${k}` : k)
  );
}

function* elementos(v: unknown): Generator<Elemento> {
  if (ehElemento(v)) yield v;
  if (!v || typeof v !== "object") return;
  for (const filho of Object.values(v)) yield* elementos(filho);
}

// Todas as telas estáticas: o layout raiz é o mesmo, mas o padrão pode nascer
// em qualquer página, e conferir custa um pedido.
const TELAS = [
  "/",
  "/painel",
  "/apostas",
  "/historico",
  "/adms",
  "/estatisticas",
  "/perguntas",
  "/calculadora",
];

for (const caminho of TELAS) {
  test(`em ${caminho}, nenhum elemento HTML hidrata um filho que espera chunk`, async ({
    request,
  }) => {
    const resposta = await request.get(caminho);
    expect(resposta.status()).toBe(200);
    const linhas = linhasDoPayload(await resposta.text());

    // Módulos de cliente com chunk a carregar: `I[id, [chunks...], nome]`. O
    // que não tem chunk (o próprio roteador, por exemplo) já veio no JS base.
    const modulos = new Set(
      [...linhas]
        .filter(([, texto]) => {
          if (!texto.startsWith("I[")) return false;
          const chunks = (lerJson(texto.slice(1)) as unknown[] | undefined)?.[1];
          return Array.isArray(chunks) && chunks.length > 0;
        })
        .map(([id]) => id)
    );
    const valores = [...linhas.values()].map(lerJson);
    const todos = valores.flatMap((v) => [...elementos(v)]);

    // Sem estas três, o teste passaria em silêncio se o formato do payload
    // mudasse numa atualização do Next.
    expect(
      modulos.size,
      "o payload deixou de ter linhas de módulo (I[...])"
    ).toBeGreaterThan(0);
    expect(
      todos.some(([, tipo, , props]) => tipo === "main" && props.id === "conteudo"),
      "não achei o <main id=conteudo> no payload"
    ).toBe(true);
    expect(
      todos.some(([, , , props]) => modulosPorValor(props, modulos).length > 0),
      "nenhum elemento recebe módulo por valor: o formato mudou ou o Next deixou de passar o error.tsx assim; rever este teste"
    ).toBe(true);

    const problemas: string[] = [];
    for (const [, tipo, , props] of todos) {
      if (tipo.startsWith("$")) continue; // componente ou Fragment, não elemento HTML
      const filhos =
        Array.isArray(props.children) && !ehElemento(props.children)
          ? props.children
          : [props.children];
      for (let filho of filhos) {
        // Filho que o servidor mandou em outra linha: o React o lê no próprio
        // elemento HTML, então a linha conta como filho direto.
        const linha =
          typeof filho === "string" ? filho.match(/^\$L([0-9a-f]+)$/)?.[1] : undefined;
        if (linha) filho = lerJson(linhas.get(linha));
        if (!ehElemento(filho)) continue;
        const refs = modulosPorValor(filho[3], modulos);
        if (refs.length) problemas.push(`<${tipo}> > ${filho[1]} (${refs.join(", ")})`);
      }
    }
    // Se isto falhar, ponha um Fragment com chave entre o elemento e o filho,
    // como no <main> do layout raiz. Depois de atualizar o Next: se o
    // react-dom embutido já tiver `popHydrationStateOnInterruptedWork` (React
    // 19.3+), o Fragment e este teste podem sair.
    expect(problemas, "elemento HTML com filho que espera chunk").toEqual([]);
  });
}

test("com o chunk do error.tsx atrasado, a Home hidrata sem erro", async ({ page }) => {
  let atrasados = 0;
  await page.route("**/_next/static/chunks/app/error-*.js", async (rota) => {
    atrasados++;
    await new Promise((r) => setTimeout(r, 1500));
    await rota.continue();
  });
  const erros: string[] = [];
  page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  page.on("pageerror", (e) => erros.push(e.message));

  await page.goto("/");
  // Sem isto, um nome de chunk diferente numa atualização do Next deixaria o
  // teste verde sem ter atrasado nada.
  expect(
    atrasados,
    "o padrão do chunk do error.tsx não pegou nenhum pedido"
  ).toBeGreaterThan(0);

  // O `aria-pressed` só aparece no commit da raiz, hidratada ou remontada. Se
  // houve erro de hidratação, ele foi reportado antes de o atributo aparecer;
  // os 300 ms são folga para o evento chegar.
  await expect(page.getByRole("button", { name: "Tema escuro" })).toHaveAttribute(
    "aria-pressed",
    /true|false/
  );
  await page.waitForTimeout(300);
  expect(erros).toEqual([]);
});
