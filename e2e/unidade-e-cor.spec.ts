import { expect, type Page, test } from "@playwright/test";

/**
 * A cor não mente sobre o número escrito ao lado dela (#103).
 *
 * A regra do site é "zero não é lucro", e ela já tinha teste — mas só pelo eixo
 * do dado: um mês que fecha em zero, um dia só com pendentes. Faltava o eixo que
 * deixou a família inteira passar: a **unidade do visitante**. Quando 1u vale
 * pouco, um resultado real encolhe até imprimir "R$ 0,00", e a cor, que saía do
 * valor cru da planilha, continuava dizendo ganho ou perda.
 *
 * Este arquivo existe porque a ausência dele custou caro: a varredura de #93
 * trocou 21 lugares e deixou quatro, e o defeito sobreviveu mais uma leva porque
 * os testes cobriam a tabela do Histórico e não a barra.
 *
 * O que NÃO é testado aqui, de propósito: o número resumido das células do
 * calendário abaixo de `lg`, onde `compacto` imprime inteiro e escreve "0" para
 * valores até meio real. Ali é abreviação por falta de espaço — como "2,3k" — e
 * o valor cheio vai no nome acessível. O viewport da suíte é Desktop Chrome,
 * acima de `lg`, então esse trecho nem entra na página.
 */

/** O piso que o campo aceita. Põe os valores do mock na faixa em que a conversão zera o texto. */
const UNIDADE_MINIMA = "0,01";

/**
 * Um lucro pequeno o bastante para zerar no piso da unidade, e diferente de zero.
 *
 * R$ 2,50 vira R$ 0,00025 com 1u = R$ 0,01, que o conversor arredonda para zero.
 * O valor **não** é zero: é isso que separa "a tela escreve zero" de "o dado é
 * zero", e é exatamente onde a cor mentia.
 */
const LUCRO_QUE_ZERA = 2.5;

/**
 * Deixa guardada a unidade mínima, que vale para todas as telas.
 *
 * Passa pelo campo em vez de escrever no localStorage direto: é o caminho de
 * quem usa, e é ele que tem de resultar no estado testado.
 */
async function guardarUnidadeMinima(page: Page) {
  await page.goto("/painel");
  const campo = page.getByLabel("Valor de 1 unidade em reais");
  await expect(campo).toBeVisible({ timeout: 15_000 });
  await campo.fill(UNIDADE_MINIMA);
  await campo.blur();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("geogetips:unidade")))
    .toBe("0.01");
}

/**
 * Força um mês e um consolidado pequenos no resumo, como o zero-e-grupo já faz.
 *
 * Sem isso o Histórico não tem nenhum valor na faixa: os meses do mock são
 * grandes demais para zerarem mesmo no piso da unidade, e o teste passaria sem
 * conferir nada. Teste que passa por vacuidade é pior que teste nenhum.
 */
async function comMesQueZera(page: Page) {
  await page.route(
    (url) => url.pathname === "/api/resumo",
    async (rota) => {
      const resposta = await rota.fetch();
      const json = await resposta.json();
      if (Array.isArray(json.meses) && json.meses.length > 0) {
        json.meses[0] = { ...json.meses[0], lucro: LUCRO_QUE_ZERA };
      }
      if (json.consolidado) {
        json.consolidado = { ...json.consolidado, lucro: LUCRO_QUE_ZERA };
      }
      await rota.fulfill({ response: resposta, json });
    }
  );
}

/** Todo elemento cujo próprio texto é exatamente "R$ 0,00", com a cor que ele exibe. */
async function zerosNaTela(page: Page) {
  return page.evaluate(() => {
    // O texto que o elemento escreve ELE MESMO, sem o dos filhos. Não dá para
    // filtrar só folhas: nos cards de Estatísticas o span que leva a cor escreve
    // o valor e ainda carrega um `<span>` com o ROI dentro. Ele não é folha, e
    // foi assim que a primeira versão deste teste deixou aquela tela passar.
    const textoProprio = (e: Element) =>
      [...e.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join("")
        .trim();
    const paraHex = (cor: string) => {
      const n = cor.match(/\d+/g);
      return n
        ? `#${n
            .slice(0, 3)
            .map((x) => Number(x).toString(16).padStart(2, "0"))
            .join("")}`
        : cor;
    };
    const raiz = getComputedStyle(document.documentElement);
    const ganho = raiz.getPropertyValue("--green").trim().toLowerCase();
    const perda = raiz.getPropertyValue("--red").trim().toLowerCase();

    return [...document.querySelectorAll("*")]
      .filter((e) => /^R\$\s0,00$/.test(textoProprio(e)))
      .map((e) => {
        const cor = paraHex(getComputedStyle(e).color).toLowerCase();
        return {
          cor,
          mente: cor === ganho || cor === perda,
          onde: e.parentElement?.textContent?.replace(/\s+/g, " ").trim().slice(0, 60) ?? "",
        };
      });
  });
}

/** Qualquer texto que escreva zero com sinal: "+R$ 0,00" ou "-R$ 0,00". */
async function zerosComSinal(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .filter((e) => e.children.length === 0)
      .map((e) => (e.textContent ?? "").trim())
      .filter((t) => /^[+-]R\$\s0,00$/.test(t))
  );
}

/**
 * Cada tela com uma âncora do trecho que interessa.
 *
 * Esperar por "algum R$ visível" não serve: em /apostas o cartão de resumo do
 * topo aparece antes do feed, e a página era amostrada antes de a pílula de cada
 * dia existir — o teste passava contra código quebrado, por corrida.
 */
const TELAS = [
  { rota: "/painel", ancora: "Top Esportes" },
  { rota: "/estatisticas", ancora: "Top Esportes" },
  { rota: "/apostas", ancora: "24/08/2026" },
] as const;

for (const { rota, ancora } of TELAS) {
  test(`em ${rota}, com a unidade no piso, nenhum "R$ 0,00" sai colorido`, async ({
    page,
  }) => {
    await guardarUnidadeMinima(page);
    await page.goto(rota);
    await expect(page.getByText(ancora).first()).toBeVisible({ timeout: 15_000 });

    const zeros = await zerosNaTela(page);
    // Sem este guarda o teste passaria numa tela sem nenhum zero para conferir,
    // e ninguém notaria que ele parou de testar.
    expect(zeros.length).toBeGreaterThan(0);
    expect(zeros.filter((z) => z.mente)).toEqual([]);
    expect(await zerosComSinal(page)).toEqual([]);
  });
}

test('no Histórico, o mês que encolheu até "R$ 0,00" não sai colorido', async ({
  page,
}) => {
  await guardarUnidadeMinima(page);
  await comMesQueZera(page);
  await page.goto("/historico");
  // A tabela por mês é a última coisa a aparecer: esperar por ela garante que o
  // cartão consolidado e as barras já estão na página.
  await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });

  const zeros = await zerosNaTela(page);
  expect(zeros.length).toBeGreaterThan(0);
  expect(zeros.filter((z) => z.mente)).toEqual([]);
  expect(await zerosComSinal(page)).toEqual([]);
});

test("o calendário não pinta a célula de um dia que escreve R$ 0,00", async ({ page }) => {
  await guardarUnidadeMinima(page);
  await page.goto("/painel");

  // 24/08 fechou em +R$ 4,50 no mock: positivo de verdade, mas no piso da
  // unidade o valor convertido imprime zero. Era o caso que pintava a célula
  // inteira de verde.
  const celula = page.getByRole("link", { name: /24\/08\/2026/ });
  await expect(celula).toBeVisible({ timeout: 15_000 });

  await expect(celula).toHaveAttribute("aria-label", /R\$\s0,00/);
  const classe = (await celula.getAttribute("class")) ?? "";
  expect(classe).not.toMatch(/green|red/);
});
