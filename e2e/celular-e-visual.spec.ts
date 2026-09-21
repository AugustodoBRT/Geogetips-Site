import { expect, test } from "@playwright/test";

/**
 * Os defeitos de tela da varredura, cada um do tamanho que apareceu.
 *
 * Nenhum deles quebra o site: a tip vira uma letra, o card fica torto, a coluna
 * some no celular, a rosca soma 101 e o 404 responde em inglês. São os que só
 * se vê usando — e, por isso mesmo, os que voltam se ninguém olhar.
 */

const CELULAR = { width: 375, height: 812 };

test("no celular a tip da última aposta cabe inteira na linha dela", async ({ page }) => {
  await page.setViewportSize(CELULAR);
  await page.goto("/painel");

  const secao = page.getByRole("region", { name: "Últimas Apostas Registradas" });
  await expect(secao).toBeVisible({ timeout: 15_000 });

  // A tip curta cabe inteira; a longa corta com reticências, como toda lista
  // resumida faz. O que não pode voltar é a tip espremida: antes sobravam 49 px
  // para ela num cartão de 290, e o mercado aparecia como "J…".
  const tips = secao.locator("div.w-full > span.truncate");
  await expect(tips.first()).toBeVisible();
  const espremidas = await tips.evaluateAll((els) =>
    els
      .filter((e) => e.scrollWidth > e.clientWidth + 1 && e.clientWidth < 110)
      .map((e) => `${e.textContent?.slice(0, 24)} em ${e.clientWidth}px`)
  );
  expect(espremidas).toEqual([]);
});

test("o card de Top Esportes começa no topo, e não no meio", async ({ page }) => {
  await page.goto("/estatisticas");

  const esportes = page.getByRole("button", { name: "Ver todos os esportes em detalhe" });
  const casas = page.getByRole("button", { name: "Ver todas as casas em detalhe" });
  await expect(esportes).toBeVisible({ timeout: 15_000 });

  // Os dois cards são vizinhos de grade: o conteúdo do mais baixo boiava no
  // meio, porque botão centraliza na vertical o que sobra de altura.
  const topo = async (alvo: typeof esportes) =>
    alvo.evaluate((el) => {
      const caixa = el.getBoundingClientRect();
      const primeiro = el.querySelector("h2")?.getBoundingClientRect();
      return Math.round((primeiro?.top ?? 0) - caixa.top);
    });

  expect(await topo(esportes)).toBeLessThan(40);
  expect(await topo(esportes)).toBe(await topo(casas));
});

test("no celular o diálogo das casas mostra o resultado sem arrastar", async ({
  page,
}) => {
  await page.setViewportSize(CELULAR);
  await page.goto("/estatisticas");

  await page.getByRole("button", { name: "Ver todas as casas em detalhe" }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();

  // A tabela cabe na caixa do diálogo — nada de rolagem lateral escondendo a
  // última coluna, que é a que a pessoa veio ver.
  const cabe = await dialogo
    .locator("table")
    .evaluate((t) => t.scrollWidth <= (t.parentElement?.clientWidth ?? 0) + 1);
  expect(cabe).toBe(true);

  await expect(dialogo.getByRole("columnheader", { name: "Resultado" })).toBeVisible();
  // E o escudo da casa continua com tamanho de escudo.
  const logo = dialogo.locator("tbody img").first();
  if (await logo.count()) {
    const largura = await logo.evaluate((el) => el.getBoundingClientRect().width);
    expect(largura).toBeGreaterThan(30);
  }
});

test("a rosca de resultados soma 100%", async ({ page }) => {
  await page.goto("/estatisticas");

  const legenda = page.getByText(/^\d+ \(\d+%\)$/);
  await expect(legenda.first()).toBeVisible({ timeout: 15_000 });

  const textos = await legenda.allInnerTexts();
  const soma = textos.reduce(
    (acc, t) => acc + Number(t.match(/\((\d+)%\)/)?.[1] ?? 0),
    0
  );
  expect(soma).toBe(100);
});

test("o endereço errado responde em português", async ({ page }) => {
  const resposta = await page.goto("/pagina-que-nao-existe");
  expect(resposta?.status()).toBe(404);

  await expect(
    page.getByRole("heading", { name: "Esta página não existe." })
  ).toBeVisible();
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
  await expect(page).toHaveTitle(/Página não encontrada/);

  // E oferece caminho de volta que funciona.
  await page.getByRole("link", { name: /Voltar para o início/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("intervalo invertido se explica e se conserta num clique", async ({ page }) => {
  await page.goto("/apostas");
  // Os campos existem antes dos dados, e os limites do calendário só chegam com
  // a aba carregada — ler antes disso pulava o teste em silêncio.
  await expect(page.getByRole("button", { name: /^Ver detalhes: / }).first()).toBeVisible(
    {
      timeout: 15_000,
    }
  );

  const de = page.locator("#periodo-de");
  const ate = page.locator("#periodo-ate");
  const primeiro = await de.getAttribute("min");
  const ultimo = await ate.getAttribute("max");
  test.skip(!primeiro || !ultimo, "a aba não trouxe datas");

  await de.fill(ultimo as string);
  await ate.fill(primeiro as string);

  const trocar = page.getByRole("button", { name: /data inicial está depois da final/ });
  await expect(trocar).toBeVisible();

  await trocar.click();
  await expect(de).toHaveValue(primeiro as string);
  await expect(ate).toHaveValue(ultimo as string);
  await expect(trocar).toHaveCount(0);
});
